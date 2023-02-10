import { AggregateUserFeeds} from "./sql-queries";
import {juridictionsCollection} from "./collections";
import {COMPLIANCE_COVERAGE_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`AgencyCoverageCube`, {
  sql: `
	SELECT _id,displayName,tenantId,corpusType FROM (
		(SELECT _id,jurisdiction,tenantId , corpusType from ${AggregateUserFeeds}) AS AggregateFeedCube
			LEFT JOIN 
		(SELECT _id as jurisId , displayName from ${juridictionsCollection})AS JurisdictionCollectionCube
			ON AggregateFeedCube.jurisdiction = JurisdictionCollectionCube.jurisId 
	)
	`,

  sqlAlias: `AgenCov`,

	refreshKey: {
		every: COMPLIANCE_COVERAGE_CUBE_REFRESH_KEY_TIME,
	},


	preAggregations: {	
		AgencyCoverageRollUp: {
      sqlAlias: "AgCovRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        AgencyCoverageCube.count
      ],
      dimensions: [
				AgencyCoverageCube.jurisdictionName,
				AgencyCoverageCube.corpusType,
        Tenants.tenantId
      ],
      refreshKey: {
        every: COMPLIANCE_COVERAGE_CUBE_REFRESH_KEY_TIME
      }
    }	
	},

	joins: {
		Tenants: {
      relationship: `hasOne`,
      sql :`${CUBE.tenantId} = ${Tenants.tenantId}` 
  	}
	},

	measures: {
		 count: {
      sql: `_id`,
      type: `count`,
    }
	},

  dimensions: {
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
		jurisdictionName: {
      sql: `${CUBE}.\`displayName\``,
      type: `string`,
    },
		corpusType : {
			sql: `${CUBE}.\`corpusType\``,
      type: `string`,
		},
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true
    },
  },
  dataSource: `default`,
});
