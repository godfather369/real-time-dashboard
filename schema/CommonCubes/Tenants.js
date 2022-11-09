import { tenantCollection } from "./collections";
import { TENANTS_CUBE_REFRESH_KEY_TIME , defaultTenantId } from "./cube-constants";

cube(`Tenants`, {
	
  sql: `select '${defaultTenantId}' as tenantId
        union all
        SELECT _id as tenantId FROM ${tenantCollection}`,

  sqlAlias : `tnts`,

	refreshKey: {
    every: TENANTS_CUBE_REFRESH_KEY_TIME
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [tenantId]
    }
  },

  dimensions: {
    tenantId: {
      sql: `CONVERT(${CUBE}.\`tenantId\`,CHAR)`,
      type: `string`,
      primaryKey: true,
      shown: true
    }
  },

  dataSource: `default`
});
