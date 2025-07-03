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
  },

  preAggregations: {
    alertsByGroupsRollUp: {
      sqlAlias: "alByGrpsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        AlertsByGroupsCube.unread,
        AlertsByGroupsCube.applicable,
        AlertsByGroupsCube.following,
        AlertsByGroupsCube.duplicate,
        AlertsByGroupsCube.inProcess,
        AlertsByGroupsCube.excluded,
        AlertsByGroupsCube.totalCount,
      ],
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
      measures: [
        AlertsByGroupsCube.unread,
        AlertsByGroupsCube.applicable,
        AlertsByGroupsCube.following,
        AlertsByGroupsCube.duplicate,
        AlertsByGroupsCube.inProcess,
        AlertsByGroupsCube.totalCount,
        AlertsByGroupsCube.open,
        AlertsByGroupsCube.closed,
        AlertsByGroupsCube.excluded,
      ],
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
    unread: {
      type: `count`,
      sql: `status`,
      title: `unread`,
      filters: [{ sql: `${CUBE}.status = 'Unread'` }],
    },
    excluded: {
      type: `count`,
      sql: `status`,
      title: `excluded`,
      filters: [{ sql: `${CUBE}.status = 'Excluded'` }],
    },
    applicable: {
      type: `count`,
      sql: `status`,
      title: `Applicable`,
      filters: [{ sql: `${CUBE}.status = 'Applicable'` }],
    },
    inProcess: {
      type: `count`,
      sql: `status`,
      title: `inProcess`,
      filters: [{ sql: `${CUBE}.status = 'In Process'` }],
    },
    following: {
      type: `count`,
      sql: `status`,
      title: `Following`,
      filters: [{ sql: `${CUBE}.status = 'Following'` }],
    },
    duplicate: {
      type: `count`,
      sql: `status`,
      title: `Duplicate`,
      filters: [{ sql: `${CUBE}.status = 'Duplicate'` }],
    },
    open: {
      sql: `${unread} +${inProcess}`,
      type: `number`,
      title: "open",
    },
    closed: {
      sql: `${following} +${applicable} + ${excluded} + ${duplicate}`,
      type: `number`,
      title: "closed",
    },
    totalCount: {
      sql: `${unread} + ${applicable} + ${inProcess} +${following} + ${excluded} + ${duplicate}`,
      type: `number`,
      title: "totalCount",
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
