import { alertsCollection, agencyMapCollection } from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`AlertsByAgencyCube`, {
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
				agencyMap 
			FROM ${agencyMapCollection}
		) AS agencies 
		ON alerts._id = agencies.Id
	`,

  sqlAlias: `AlAgCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
    Agency: {
      relationship: `belongsTo`,
      sql: `${CUBE.agencyMap} = ${Agency._id}`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1 AND ${AlertStatusCube.isExcluded} = 0`,
    },
  },

  preAggregations: {
    alertsByAgenciesRollUp: {
      sqlAlias: "alByAgRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsByAgencyCube.count],
      dimensions: [
        Tenants.tenantId,
        AlertsByAgencyCube.alertCategory,
        AlertStatusCube.statusId,
        AlertsByAgencyCube.agencyMap,
        Agency.agencyNames,
        Agency.shortCode,
      ],
      timeDimension: AlertsByAgencyCube.publishedDate,
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
    agencyMap: {
      sql: `agencyMap`,
      type: `string`,
      title: `agencyMap`,
    },
  },

  dataSource: `default`,
});
