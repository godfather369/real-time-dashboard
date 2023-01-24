import { risksCollection } from "./collections";
import { RISK_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`RisksCube`, {
	
  sql: `SELECT * FROM ${risksCollection} where ${risksCollection}.archived = 0`,

  extends: Users,

  sqlAlias : `RiCube`,
  
  refreshKey: {
    every: RISK_CUBE_REFRESH_KEY_TIME
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [risks, _id],
    },
  },

  dimensions: {
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true,
    },
    risks: {
      sql: `${CUBE}.\`id\``,
      type: `string`,
      title: `risks`,
    },
    archived: {
      sql: `${CUBE}.\`archived\``,
      type : `boolean`,
      title : `archivedRisks`
    },
  },
  dataSource: `default`,
});
