import {
  alertsCollection,
  alertsGroupsCollection,
  alertsByStatusCollection,
  regConfigCollection,
} from "./collections";
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
			groupIds.groups,
			regChangeConfig.statusId,
			regChangeConfig.statusName,
			regChangeConfig.isTerminal
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
		LEFT JOIN (
			SELECT Config.tenantId AS configTenantId, alertsStatusConfig.statusId, alertsStatusConfig.statusName, alertsStatusConfig.isTerminal
			FROM ${regConfigCollection} AS Config
			INNER JOIN (
				SELECT _id AS configId, \`status.regChange.id\` AS statusId, \`status.regChange.isTerminal\` AS isTerminal, \`status.regChange.name\` AS statusName
				FROM ${alertsByStatusCollection}
			) AS alertsStatusConfig
				ON alertsStatusConfig.configId = Config._id
		) AS regChangeConfig
			ON alerts.tenantId = regChangeConfig.configTenantId
			AND alerts.status = regChangeConfig.statusId
	`,

  sqlAlias: `AlGrCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Groups: {
      relationship: `belongsTo`,
      sql: `${CUBE.groups} = ${Groups._id}`,
    },
  },

  preAggregations: {
    alertsByGroupsRollUp: {
      sqlAlias: "alByGrpsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsByGroupsCube.count],
      dimensions: [
        AlertsByGroupsCube.tenantId,
        Groups.name,
        Groups._id,
        AlertsByGroupsCube.statusId,
        AlertsByGroupsCube.statusName,
        AlertsByGroupsCube.alertCategory,
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
    alertsGroupsSLARollUp: {
      sqlAlias: "alByGrApRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        AlertsByGroupsCube.count,
        AlertsByGroupsCube.open,
        AlertsByGroupsCube.closed,
        AlertsByGroupsCube.total,
      ],
      dimensions: [
        AlertsByGroupsCube.tenantId,
        Groups.name,
        Groups._id,
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
    open: {
      sql: `NOT ${CUBE}.isTerminal`,
      type: `sum`,
      title: "open",
    },
    closed: {
      sql: `${CUBE}.isTerminal `,
      type: `sum`,
      title: "closed",
    },
    total: {
      sql: `${open}+${closed}`,
      type: `number`,
      title: "total",
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
    statusId: {
      sql: `${CUBE}.\`statusId\``,
      type: `string`,
    },
    statusName: {
      sql: `${CUBE}.\`statusName\``,
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
