import { tenantCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME, defaultTenantId } from "./cube-constants";

cube(`Tenants`, {
  sql: `
    SELECT '${defaultTenantId}' AS tenantId
    UNION ALL
    SELECT _id AS tenantId 
    FROM ${tenantCollection}
  `,

  sqlAlias: `tnts`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [tenantId],
    },
  },

  dimensions: {
    tenantId: {
      sql: `CONVERT(${CUBE}.\`tenantId\`,CHAR)`,
      type: `string`,
      primaryKey: true,
      shown: true,
    },
  },

  dataSource: `default`,
});
