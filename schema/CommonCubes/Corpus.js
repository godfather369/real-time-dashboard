import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { corpusCollection } from "./collections";

cube(`Corpus`, {
  sql: `SELECT jurisdiction, _id, id, name, tenantId  FROM ${corpusCollection}`,

  sqlAlias : `CorpCube`,

	refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql :`${CUBE.tenantId} = ${Tenants.tenantId}` 
    },
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [_id, tenantId]
    }
  },

  dimensions: {
    jurisdiction: {
      sql: `${CUBE}.\`jurisdiction\``,
      type: `string`,
			title: `Jurisdiction name`
    },
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true
    },
		id: {
      sql: `${CUBE}.id`,
      type: `string`,
    },
    name: {
      sql: `${CUBE}.\`name\``,
      type: `string`,
			title: `Corpus name`
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
			title: `Tenant Id`
    }
  },

  dataSource: `default`
});
