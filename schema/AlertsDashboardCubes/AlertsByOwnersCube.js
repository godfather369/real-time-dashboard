import { alertsCollection, alertsUsersCollection } from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`AlertsByOwnersCube`, {
  sql: `
		SELECT * 
		FROM (
			SELECT 
				_id, 
				status, 
				tenantId, 
				publishedDate, 
				created, 
				alertCategory, 
				\`info.docStatus\` as docStatus  
			FROM ${alertsCollection} 
			WHERE ${alertsCollection}.archived = 0
		) as alerts 
		INNER JOIN (
			SELECT 
				_id as Id, 
				owners 
			FROM ${alertsUsersCollection}
		) as ownerIds ON alerts._id = ownerIds.Id
	`,

  sqlAlias: `AlOwCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
    Users: {
      relationship: `belongsTo`,
      sql: `${CUBE.owners} = ${Users._id}`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1 AND ${AlertStatusCube.isExcluded} = 0`,
    },
  },

  preAggregations: {
    alertsByUsersRollUp: {
      sqlAlias: "alByUsrsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsByOwnersCube.count],
      dimensions: [
        Tenants.tenantId,
        Users.fullName,
        Users._id,
        AlertsByOwnersCube.alertCategory,
        AlertStatusCube.statusId,
        AlertStatusCube.statusName,
      ],
      timeDimension: AlertsByOwnersCube.created,
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
    alertsOwnersRollUp: {
      sqlAlias: "alByAppRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        AlertsByOwnersCube.count,
        AlertsByOwnersCube.open,
        AlertsByOwnersCube.closed,
      ],
      dimensions: [
        Tenants.tenantId,
        Users.fullName,
        Users._id,
        AlertsByOwnersCube.docStatus,
      ],
      timeDimension: AlertsByOwnersCube.created,
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
    open: {
      sql: `NOT ${AlertStatusCube}.isTerminal`,
      type: `sum`,
      title: "open",
    },
    closed: {
      sql: `${AlertStatusCube}.isTerminal `,
      type: `sum`,
      title: "closed",
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
    owners: {
      sql: `owners`,
      type: `string`,
      title: `owners`,
    },
    docStatus: {
      sql: `${CUBE}.\`docStatus\``,
      type: `string`,
      title: `Doc Status`,
    },
  },

  dataSource: `default`,
});
