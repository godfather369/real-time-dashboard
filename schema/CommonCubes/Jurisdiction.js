import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { juridictionsCollection } from "./collections";

cube(`Jurisdiction`, {
  sql: `
    SELECT 
      jurisdictionId,
      displayName,
      tenantId,
      shortName 
    FROM ${juridictionsCollection}
  `,

  sqlAlias: `JursCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
  },

  dimensions: {
    jurisdictionId: {
      sql: `${CUBE}.\`jurisdictionId\``,
      title: `Jurisdiction`,
      type: `string`,
      primaryKey: true,
    },
    displayName: {
      sql: `${CUBE}.\`displayName\``,
      title: `Jurisdiction Name`,
      type: `string`,
    },
    shortName: {
      sql: `${CUBE}.\`shortName\``,
      title: `Short Name`,
      type: `string`,
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
      title: `Tenant Id`,
    },
  },

  dataSource: `default`,
});
