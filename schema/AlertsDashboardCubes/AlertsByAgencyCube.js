import { alertsCollection, agencyMapCollection } from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";
import { alertsActiveFilterSql } from "./sql-queries";

cube(`AlertsByAgencyCube`, {
  sql: `
		SELECT 
			alerts._id,
			alerts.status,
			alerts.tenantId,
			alerts.publishedDate,
			alerts.alertCategory,
			agencies.agencyMap
		FROM (
			SELECT _id, status, tenantId, publishedDate, alertCategory
			FROM ${alertsCollection}
			WHERE ${alertsActiveFilterSql}
		) AS alerts
		INNER JOIN (
			SELECT _id AS Id, agencyMap
			FROM ${agencyMapCollection}
		) AS agencies
			ON alerts._id = agencies.Id
	`,

  sqlAlias: `AlAgCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

  preAggregations: {
    alertsByAgenciesRollUp: {
      sqlAlias: "alByAgRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsByAgencyCube.count],
      dimensions: [
        AlertsByAgencyCube.tenantId,
        AlertsByAgencyCube.alertCategory,
        AlertsByAgencyCube.status,
        AlertsByAgencyCube.agencyId,
      ],
      timeDimension: AlertsByAgencyCube.publishedDate,
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
    alertCategory: {
      sql: `${CUBE}.\`alertCategory\``,
      type: `string`,
      title: `Alert Category`,
    },
    agencyId: {
      sql: `agencyMap`,
      type: `string`,
      title: `Agency ID`,
    },
  },

  dataSource: `default`,
});
