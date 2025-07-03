import { agenciesCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`Agency`, {
  sql: `
    SELECT 
      _id,
      name as agencyNames,
      shortCode 
    FROM ${agenciesCollection}
  `,

  sqlAlias: `AgCu`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  dimensions: {
    agencyNames: {
      sql: `${CUBE}.\`agencyNames\``,
      type: `string`,
      title: `agencyNames`,
    },
    shortCode: {
      sql: `${CUBE}.\`shortCode\``,
      type: `string`,
      title: `shortCode`,
    },
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },
  },

  dataSource: `default`,
});
