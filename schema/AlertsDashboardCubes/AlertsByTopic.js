import {
  alertGroupIdsCollection,
  alertsCollection,
  masterDatumCollection,
} from './collections'
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from './cube-constants'

cube(`AlertsByTopic`, {
  sql: `
	SELECT * FROM(
		(SELECT * FROM
		(
			(SELECT _id,status,tenantId,alertCategory,publishedDate from ${alertsCollection} where ${alertsCollection}.archived = 0) AS Alerts
				LEFT JOIN 
			(SELECT _id as Id , grpIds  FROM ${alertGroupIdsCollection}) AS AlertGrpIds
				ON Alerts._id = AlertGrpIds.Id
		)) AS AlertsByGrpsJoin
		LEFT JOIN 
		(SELECT _id as  alertGrpId , name as alertGrpName FROM ${masterDatumCollection}) 
		as AlertsMeta ON AlertsByGrpsJoin.grpIds = AlertsMeta.alertGrpId
		)
	`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  sqlAlias: `AlByT`,

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
  },

  preAggregations: {
    alertsByTopicRollUp: {
      sqlAlias: 'albyTRP',
      external: true,
      scheduledRefresh: true,
      type: `rollup`,
      measures: [AlertsByTopic.totalCount],
      dimensions: [
        AlertsByTopic.grpName,
        AlertsByTopic.grpIds,
        AlertsByTopic.alertCategory,
        Tenants.tenantId,
      ],
      timeDimension: AlertsByTopic.publishedDate,
      granularity: `day`,
      buildRangeStart: {
        sql: `SELECT NOW() - interval '365 day'`,
      },
      buildRangeEnd: {
        sql: `SELECT NOW()`,
      },
      refreshKey: {
        every: PRE_AGG_REFRESH_KEY_TIME,
      },
    },
  },

  measures: {
    totalCount: {
      sql: `status`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.status != "Excluded" `,
        },
      ],
      title: 'totalCount',
    },
  },

  dimensions: {
    grpIds: {
      sql: `CONVERT(${CUBE}.\`grpIds\`,CHAR)`,
      type: `string`,
      title: `Group Ids`,
    },
    grpName: {
      sql: `${CUBE}.\`alertGrpName\``,
      type: `string`,
      title: `Group Name`,
    },
    publishedDate: {
      sql: `${CUBE}.\`publishedDate\``,
      type: `time`,
      title: `Published Date`,
    },
    alertCategory: {
      sql: `${CUBE}.\`alertCategory\``,
      type: `string`,
      title: `Alert Category`,
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
      title: `Tenant Id`,
    },
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true,
    },
  },
})
