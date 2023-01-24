import {alertsCollection ,alertsUsersCollection } from './collections';
import { ALERT_CUBE_REFRESH_KEY_TIME , ALERT_CUBE_PRE_AGG_REFRESH_KEY_WORKFLOW } from './cube-constants';

cube(`AlertsByOwnersCube`, {
	sql : `SELECT * FROM 
	((SELECT * FROM ${alertsCollection} as alerts INNER JOIN 
	(SELECT _id as Id , owners FROM ${alertsUsersCollection}) as ownerIds ON alerts._id = ownerIds.Id )) as alertsCube`,

  sqlAlias: `AlOwCube`,

  refreshKey: {
    every: ALERT_CUBE_REFRESH_KEY_TIME
  },

  joins: {
		Tenants: {
      relationship: `hasOne`,
      sql :`${CUBE.tenantId} = ${Tenants.tenantId}` 
    },
		Users: {
				relationship: `belongsTo`,
				sql: `${CUBE.owners} = ${Users._id}`
		}
  },

  preAggregations: {
    alertsByUsersRollUp: {
      sqlAlias: "alByUsrsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        AlertsByOwnersCube.unread,
        AlertsByOwnersCube.applicable,
        AlertsByOwnersCube.inProcess,
        AlertsByOwnersCube.totalCount
      ],
      dimensions: [Tenants.tenantId, Users.fullName, AlertsByOwnersCube.alertCategory],
      timeDimension: AlertsByOwnersCube.publishedDate,
      granularity: `day`,
      buildRangeStart: {
        sql: `SELECT NOW() - interval '365 day'`
      },
      buildRangeEnd: {
        sql: `SELECT NOW()`
      },
      refreshKey: {
           every: ALERT_CUBE_PRE_AGG_REFRESH_KEY_WORKFLOW
      }
    }
	},

  measures: {
    count: {
      type: `count`,
      drillMembers: [alertCategory]
    },
    unread: {
      type: `count`,
      sql: `status`,
      title: `unread`,
      filters: [{ sql: `${CUBE}.status = 'Unread'` }]
    },
    excluded: {
      type: `count`,
      sql: `status`,
      title: `excluded`,
      filters: [{ sql: `${CUBE}.status = 'Excluded'` }]
    },
    applicable: {
      type: `count`,
      sql: `status`,
      title: `Applicable`,
      filters: [{ sql: `${CUBE}.status = 'Applicable'` }]
    },
    inProcess: {
      type: `count`,
      sql: `status`,
      title: `inProcess`,
      filters: [{ sql: `${CUBE}.status = 'In Process'` }]
    },
    totalCount: {
      sql: `${unread} + ${applicable} + ${inProcess}`,
      type: `number`,
      title: "totalCount"
    }
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true
    },
    status: {
      sql: `${CUBE}.\`status\``,
      type: `string`
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`
    },
    publishedDate: {
      sql: `${CUBE}.\`publishedDate\``,
      type: `time`
    },
    alertCategory: {
      sql: `${CUBE}.\`alertCategory\``,
      type: `string`,
      title: `Alert Category`
    },
		owners: {
      sql: `owners`,
      type: `string`,
      title: `owners`
    }
  },

  dataSource: `default`,
});
