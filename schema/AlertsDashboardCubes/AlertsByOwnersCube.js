import { alertsCollection, alertsUsersCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { alertsActiveFilterSql } from "./sql-queries";

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
			WHERE ${alertsActiveFilterSql}
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
    Users: {
      relationship: `belongsTo`,
      sql: `${CUBE.owners} = ${Users._id}`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1`,
    },
  },

  measures: {
    count: {
      sql: `NOT ${AlertStatusCube}.isExcluded`,
      type: `sum`,
      title: "open",
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
    total: {
      sql: `${open} + ${closed}`,
      type: `number`,
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
