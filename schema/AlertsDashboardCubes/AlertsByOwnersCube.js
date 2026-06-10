import { alertsCollection, alertsUsersCollection } from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";
import { alertsActiveFilterSql } from "./sql-queries";

cube(`AlertsByOwnersCube`, {
  sql: `
		SELECT
			alerts._id,
			alerts.status,
			alerts.tenantId,
			alerts.publishedDate,
			alerts.created,
			alerts.alertCategory,
			alerts.docStatus,
			ownerIds.owners
		FROM (
			SELECT _id, status, tenantId, publishedDate, created, alertCategory, \`info.docStatus\` AS docStatus
			FROM ${alertsCollection}
			WHERE ${alertsActiveFilterSql}
		) AS alerts
		INNER JOIN (
			SELECT _id AS Id, owners
			FROM ${alertsUsersCollection}
		) AS ownerIds
			ON alerts._id = ownerIds.Id
	`,

  sqlAlias: `AlOwCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

  preAggregations: {
    alertsByUsersRollUp: {
      sqlAlias: "alByUsrsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsByOwnersCube.count],
      dimensions: [
        AlertsByOwnersCube.tenantId,
        AlertsByOwnersCube.ownerId,
        AlertsByOwnersCube.alertCategory,
        AlertsByOwnersCube.statusId,
        AlertsByOwnersCube.docStatus,
      ],
      timeDimension: AlertsByOwnersCube.created,
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
    ownerId: {
      sql: `${CUBE}.\`owners\``,
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
    docStatus: {
      sql: `${CUBE}.\`docStatus\``,
      type: `string`,
      title: `Doc Status`,
    },
  },

  dataSource: `default`,
});
