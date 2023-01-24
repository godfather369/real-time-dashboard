import { alertGroupIdsCollection, alertsCollection, alertsMetaCollection } from './collections';
import { ALERT_CUBE_REFRESH_KEY_TIME , ALERT_CUBE_PRE_AGG_REFRESH_KEY } from './cube-constants';

cube(`AlertsByTopic`, {
	sql: `
  SELECT * FROM ((SELECT
  status,
  grpIds,
  tenantId,
  alertCategory,
  publishedDate
  FROM ${alertsCollection} as alerts INNER JOIN 
	(SELECT _id as Id , grpIds  FROM ${alertGroupIdsCollection}) as grpIds ON CONVERT(alerts._id,CHAR) = CONVERT(grpIds.Id,CHAR) ))as alertsByTopic 
	INNER JOIN (SELECT alertGrpId , alertGrpName FROM ${alertsMetaCollection} where ${alertsMetaCollection}.grpType != "jurisdiction") 
	as alertsMeta On alertsByTopic.grpIds = CONVERT(alertsMeta.alertGrpId,CHAR)`,

  refreshKey: {
    every: ALERT_CUBE_REFRESH_KEY_TIME
  },

  sqlAlias: `AlByT`,

  joins: {
    Tenants: {
			relationship: `hasOne`,
			sql :`${CUBE.tenantId} = ${Tenants.tenantId}` 
		}
  },

  preAggregations: {
    alertsByTopicRollUp: {
      sqlAlias: "albyTRP",
      external: true,
      scheduledRefresh: true,
			type: `rollup`,
      measures: [
        AlertsByTopic.totalCount
      ],
      dimensions: [
        AlertsByTopic.grpName,
        AlertsByTopic.alertCategory,
        Tenants.tenantId
      ],
      timeDimension: AlertsByTopic.publishedDate,
      granularity: `day`,
      buildRangeStart: {
        sql: `SELECT NOW() - interval '365 day'`
      },
      buildRangeEnd: {
        sql: `SELECT NOW()`
      },
      refreshKey: {
        every: ALERT_CUBE_PRE_AGG_REFRESH_KEY
      }
    },
  },

  measures: {
    totalCount: {
      sql: `status`,
      type: `count`,
			 filters: [
        {
          sql: `${CUBE}.status != "Excluded" `
        }
      ],
      title: "totalCount"
    }
  },

  dimensions: {
    grpIds: {
      sql: `CONVERT(${CUBE}.\`grpIds\`,CHAR)`,
      type: `string`,
      title: `Group Ids`
    },
    grpName: {
      sql: `${CUBE}.\`alertGrpName\``,
      type: `string`,
      title: `Group Name`
    },
    publishedDate: {
      sql: `${CUBE}.\`publishedDate\``,
      type: `time`,
      title : `Published Date`
    },
    alertCategory: {
      sql: `${CUBE}.\`alertCategory\``,
      type: `string`,
      title: `Alert Category`
    },
		tenantId : {
 			sql: `${CUBE}.\`tenantId\``,
      type: `string`,
      title: `Tenant Id`
		},
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true
    }
  }
});