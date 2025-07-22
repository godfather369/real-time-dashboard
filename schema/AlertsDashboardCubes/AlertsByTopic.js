import { alertsCollection, alertMDIDCollection } from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`AlertsByTopic`, {
  sql: `
		SELECT * 
		FROM (
			SELECT 
				_id, 
				status, 
				tenantId, 
				publishedDate, 
				alertCategory  
			FROM ${alertsCollection} 
			WHERE ${alertsCollection}.archived = 0
		) AS alerts 
		INNER JOIN (
			SELECT 
				_id AS Id,  
				\`mdInfo._id\` AS MDiD, 
				\`mdInfo.name\` AS MDName 
			FROM ${alertMDIDCollection}
		) AS TopicIds ON alerts._id = TopicIds.Id
	`,

  sqlAlias: `AlTopCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1 AND ${AlertStatusCube.isExcluded} = 0`,
    },
  },

  preAggregations: {
    alertsByTopicRollUp: {
      sqlAlias: "alByTopRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsByTopic.count],
      dimensions: [
        Tenants.tenantId,
        AlertsByTopic.MDName,
        AlertsByTopic.MDiD,
        AlertsByTopic.alertCategory,
        AlertStatusCube.statusId,
        AlertStatusCube.statusName,
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
    count: {
      type: `count`,
      drillMembers: [_id],
    },
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },
    status: {
      sql: `${CUBE}.\`status\``,
      type: `string`,
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
    publishedDate: {
      sql: `${CUBE}.\`publishedDate\``,
      type: `time`,
    },
    alertCategory: {
      sql: `${CUBE}.\`alertCategory\``,
      type: `string`,
      title: `Alert Category`,
    },
    MDName: {
      sql: `${CUBE}.\`MDName\``,
      type: `string`,
      title: `MDName`,
    },
    MDiD: {
      sql: `CONVERT(${CUBE}.\`MDiD\`,CHAR)`,
      type: `string`,
      title: `MD Id`,
    },
  },

  dataSource: `default`,
});
