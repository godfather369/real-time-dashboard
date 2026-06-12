import { alertsCollection, alertsGroupsCollection } from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";
import { alertsActiveFilterSql } from "./sql-queries";

cube(`AlertsByGroupsCube`, {
  sql: `
		SELECT
			alerts._id,
			alerts.status,
			alerts.tenantId,
			alerts.publishedDate,
			alerts.created,
			alerts.alertCategory,
			alerts.docStatus,
			groupIds.groups
		FROM (
			SELECT _id, status, tenantId, publishedDate, created, alertCategory, \`info.docStatus\` AS docStatus
			FROM ${alertsCollection}
			WHERE ${alertsActiveFilterSql}
		) AS alerts
		INNER JOIN (
			SELECT _id AS Id, groups
			FROM ${alertsGroupsCollection}
		) AS groupIds
			ON alerts._id = groupIds.Id
	`,

  sqlAlias: `AlGrCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

  preAggregations: {
    alertsByGroupsRollUp: {
      sqlAlias: "alByGrpsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsByGroupsCube.count],
      dimensions: [
        AlertsByGroupsCube.tenantId,
        AlertsByGroupsCube.groups,
        AlertsByGroupsCube.alertCategory,
        AlertsByGroupsCube.status,
        AlertsByGroupsCube.docStatus,
      ],
      timeDimension: AlertsByGroupsCube.created,
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
    created: {
      sql: `${CUBE}.\`created\``,
      type: `time`,
    },
    alertCategory: {
      sql: `${CUBE}.\`alertCategory\``,
      type: `string`,
      title: `Alert Category`,
    },
    groups: {
      sql: `groups`,
      type: `string`,
      title: `groups`,
    },
    docStatus: {
      sql: `${CUBE}.\`docStatus\``,
      type: `string`,
      title: `Doc Status`,
    },
  },

  dataSource: `default`,
});
