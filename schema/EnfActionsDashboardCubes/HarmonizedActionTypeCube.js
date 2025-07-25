import { harmonizedActionCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`HarmonizedActionTypeCube`, {
  sql: `
    SELECT * 
    FROM ${harmonizedActionCollection}
  `,

  sqlAlias: `HaAcCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [harmonizedActionType, _id],
    },
  },

  dimensions: {
    harmonizedActionType: {
      sql: `${CUBE}.\`info.harmonizedActionType\``,
      type: `string`,
      title: `harmonizedActionType`,
    },
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },
  },

  dataSource: `default`,
});
