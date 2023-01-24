import { JURISDICTIONS_CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { juridictionsCollection } from "./collections";

cube(`JurisdictionsCube`, {
  sql: `SELECT jurisdictionId , displayName , tenantId FROM ${juridictionsCollection}`,
	
  sqlAlias: `JursCube`,

  refreshKey: {
    every: JURISDICTIONS_CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`
    }
  },

  dimensions: {
    jurisdictionId: {
      sql: `${CUBE}.\`jurisdictionId\``,
      title: `Jurisdiction`,
      type: `string`,
      primaryKey: true
    },
    displayName: {
      sql: `${CUBE}.\`displayName\``,
      title: `Jurisdiction Name`,
      type: `string`
    },
		tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
			title: `Tenant Id`
    }
  },

  dataSource: `default`
});
