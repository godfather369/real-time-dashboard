import { alertsCollection, agencyMapCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { alertsActiveFilterSql } from "./sql-queries";

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
			WHERE ${alertsActiveFilterSql}
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
    Agency: {
      relationship: `belongsTo`,
      sql: `${CUBE.agencyMap} = ${Agency._id}`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1 AND ${AlertStatusCube.isExcluded} = 0`,
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
