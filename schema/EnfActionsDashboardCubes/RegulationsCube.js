import { ENFORCEMENT_CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { regulationsCollection } from "./collections";

cube(`RegulationsCube`, {
  sql: `SELECT * FROM ${regulationsCollection}`,
  sqlAlias: `ReglCube`,

  refreshKey: {
    every: `${ENFORCEMENT_CUBE_REFRESH_KEY_TIME}`
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [authoritativeDocuments, _id]
    }
  },

  dimensions: {
    authoritativeDocuments: {
      sql: `${CUBE}.\`info.regulations.title\``,
      type: `string`,
      title: `AuthoritativeDocuments`
    },
    citations: {
      sql: `${CUBE}.\`info.regulations.document_number\``,
      type: `string`,
      title: `Citations`
    },
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true
    }
  },

  dataSource: `default`
});
