import { RISK_STATUS_CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { risksByStatusCollection } from "./collections";

cube(`RisksByStatusCube`, {
  sql: `SELECT * FROM ${risksByStatusCollection}`,

  sqlAlias : `RisByStatCube`,
  
  refreshKey: {
    every: RISK_STATUS_CUBE_REFRESH_KEY_TIME
  },

  dimensions: {
    riskStatus: {
      sql: `${CUBE}.\`status.risk.name\``,
      type: `string`,
      title: `Status`,
    },
    riskId: {
      sql: `${CUBE}.\`status.risk.id\``,
      type: `string`,
      primaryKey: true,
      shown: true,
    },
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
    },
  },
  dataSource: `default`,
});
