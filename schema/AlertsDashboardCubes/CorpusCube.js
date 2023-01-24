import { CORPUS_CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { corpusCollection } from "./collections";

cube(`CorpusCube`, {
  sql: `SELECT * FROM ${corpusCollection}`,

  sqlAlias : `CorpCube`,

	refreshKey: {
    every: CORPUS_CUBE_REFRESH_KEY_TIME,
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
      drillMembers: [_id, corpusName, tenantId]
    }
  },

  dimensions: {
    jurisdiction: {
      sql: `${CUBE}.\`jurisdiction\``,
      type: `string`,
			title: `Jurisdiction name`
    },
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true
    },
		id: {
      sql: `${CUBE}.id`,
      type: `string`,
    },
    corpusName: {
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
