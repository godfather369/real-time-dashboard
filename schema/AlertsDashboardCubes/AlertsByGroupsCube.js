import { alertsCollection, alertsGroupsCollection } from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`AlertsByGroupsCube`, {
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
				groups 
			FROM ${alertsGroupsCollection}
		) as groupIds ON alerts._id = groupIds.Id
	`,

  sqlAlias: `AlGrCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
    Groups: {
      relationship: `belongsTo`,
      sql: `${CUBE.groups} = ${Groups._id}`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1`,
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
        Tenants.tenantId,
        Groups.name,
        Groups._id,
        AlertsByGroupsCube.alertCategory,
        AlertsByGroupsCube.docStatus,
      ],
      timeDimension: AlertsByGroupsCube.created,
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
    alertsGroupsSLARollUp: {
      sqlAlias: "alByGrApRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsByGroupsCube.open, AlertsByGroupsCube.closed],
      dimensions: [
        Tenants.tenantId,
        Groups.name,
        Groups._id,
        AlertsByGroupsCube.docStatus,
      ],
      timeDimension: AlertsByGroupsCube.created,
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
      sql: `(NOT ${AlertStatusCube}.isTerminal AND NOT ${AlertStatusCube}.isExcluded)`,
      type: `sum`,
      title: "open",
    },

    closed: {
      sql: `(${AlertStatusCube}.isTerminal OR ${AlertStatusCube}.isExcluded)`,
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
