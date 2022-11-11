import { harmonizedActionCollection } from "./collections";
import {HARMONIZED_ACTION_CUBE_REFRESH_KEY_TIME} from "./cube-constants"

cube(`HarmonizedActionTypeCube`, {
  sql: `SELECT * FROM ${harmonizedActionCollection}`,

  sqlAlias: `HaAcCube`,

  refreshKey: {
    every: `${HARMONIZED_ACTION_CUBE_REFRESH_KEY_TIME}`
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
      title: `harmonizedActionType`
    },
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true
    }
  },

  dataSource: `default`
});
