import { alertsCollection, alertMDIDCollection } from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";
import { alertsActiveFilterSql } from "./sql-queries";

cube(`AlertsByTopic`, {
  sql: `
		SELECT
			alerts._id,
			alerts.status,
			alerts.tenantId,
			alerts.publishedDate,
			alerts.alertCategory,
			TopicIds.mdId
		FROM (
			SELECT _id, status, tenantId, publishedDate, alertCategory
			FROM ${alertsCollection}
			WHERE ${alertsActiveFilterSql}
		) AS alerts
		INNER JOIN (
			SELECT _id AS Id, \`mdInfo._id\` AS mdId
			FROM ${alertMDIDCollection}
		) AS TopicIds
			ON alerts._id = TopicIds.Id
	`,

  sqlAlias: `AlTopCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

  preAggregations: {
    alertsByTopicRollUp: {
      sqlAlias: "alByTopRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsByTopic.count],
      dimensions: [
        AlertsByTopic.tenantId,
        AlertsByTopic.mdId,
        AlertsByTopic.alertCategory,
        AlertsByTopic.statusId,
      ],
      timeDimension: AlertsByTopic.publishedDate,
      granularity: `second`,
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
    statusId: {
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
    mdId: {
      sql: `${CUBE}.\`mdId\``,
      type: `string`,
      title: `MD Id`,
    },
  },

  dataSource: `default`,
});
