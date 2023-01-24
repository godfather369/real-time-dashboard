import { MAP_USER_CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { mapUserCollection } from "./collections";

cube(`MapUserCube`, {
  sql: `SELECT user , srcObject FROM ${mapUserCollection} where ${mapUserCollection}.archived = 0 `,

  refreshKey: {
    every: MAP_USER_CUBE_REFRESH_KEY_TIME
  },

  sqlAlias: `MapUsCube`,

  measures: {
    count: {
      type: `count`,
      drillMembers: [_id],
    },
  },

  dimensions: {
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true,
    },
    srcObject: {
      sql: `${CUBE}.\`srcObject\``,
      type: `string`,
      title: `Source`,
    },
  },
  
  dataSource: `default`,
});
