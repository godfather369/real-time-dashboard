import { CONTROL_CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { controlsCollection } from "./collections";

cube(`ControlsCube`, {
  sql: `SELECT * FROM ${controlsCollection} where ${controlsCollection}.archived = 0`,
  
	extends: Users,

  sqlAlias : `ConCube`,
  
  refreshKey: {
    every: CONTROL_CUBE_REFRESH_KEY_TIME
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [controls, _id]
    }
  },

  dimensions: {
    controls: {
      sql: `${CUBE}.\`id\``,
      type: `string`,
      title: `Controls`
    },
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true
    },
    archived: {
      sql: `${CUBE}.\`archived\``,
      type: `boolean`,
      title: `archivedControls`,
    },
  },

  dataSource: `default`
});
