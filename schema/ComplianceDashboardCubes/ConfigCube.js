import { CONFIG_CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { regConfigCollection } from "./collections";

cube(`ConfigCube`, {
  sql: `SELECT * FROM ${regConfigCollection}`,

  sqlAlias: `ConfCube`,

  refreshKey: {
    every: CONFIG_CUBE_REFRESH_KEY_TIME
  },

  joins: {
    MapStatusCube: {
      relationship: `hasOne`,
      sql :`${CUBE.tenantId} = ${MapStatusCube.tenantId}` 
    },
    TasksByStatusCube: {
      relationship: `hasMany`,
      sql: `${CUBE._id} = ${TasksByStatusCube._id}`,
    },
    ControlsByStatusCube: {
      relationship: `hasMany`,
      sql: `${CUBE._id} = ${ControlsByStatusCube._id}`,
    },
    RisksByStatusCube: {
      relationship: `hasMany`,
      sql: `${CUBE._id} = ${RisksByStatusCube._id}`,
    },
  },

  dimensions: {
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
    },
  },
  dataSource: `default`,
});
