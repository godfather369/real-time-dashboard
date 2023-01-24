import {regMapStatusUniregJoin, regMapStatusUniregJoinCC , CorpusJurisdictionJoin ,RegSiteJurisdictionJoin} from "./sql-queries";
import {COMPLIANCE_COVERAGE_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`CoverageByJurisdictionCube`, {
	sql : `
	SELECT _id,tenantId ,displayName ,status FROM
	(
			(SELECT _id,tenantId ,repo ,status FROM ${regMapStatusUniregJoin}) AS RegMapUniregJoin
		LEFT JOIN 
		(SELECT id,displayName FROM ${CorpusJurisdictionJoin})AS CorpusJurisdictionJoin
		ON RegMapUniregJoin.repo = CorpusJurisdictionJoin.id
	) 
	UNION ALL
	SELECT _id,tenantId ,displayName ,status FROM
	(
			(SELECT _id,tenantId ,uid ,status FROM ${regMapStatusUniregJoinCC}) AS RegMapUniregJoin
		LEFT JOIN 
		(
			SELECT regSiteUid ,displayName FROM ${RegSiteJurisdictionJoin} AS RegSiteJurisdictionJoin
		ON RegMapUniregJoin.uid = RegSiteJurisdictionJoin.regSiteUid
	)` ,

	sqlAlias: `CvrgByJurCube`,

	refreshKey: {
		every: COMPLIANCE_COVERAGE_CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		}
	},

	preAggregations: {	
		CoverageByJurisdictionRollUp: {
      sqlAlias: "covJurisRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        CoverageByJurisdictionCube.count
      ],
      dimensions: [
				CoverageByJurisdictionCube.jurisdictionName,
				CoverageByJurisdictionCube.status,
        Tenants.tenantId
      ],
      refreshKey: {
        every: COMPLIANCE_COVERAGE_CUBE_REFRESH_KEY_TIME
      }
    }	
	},

	measures: {
		 count: {
      sql: `_id`,
      type: `count`,
    }
	},

	dimensions: {
		_id: {
			sql: `_id`,
			type: `string`,
			primaryKey: true,
		},
		tenantId: {
			sql: `tenantId`,
			type: `string`,
		},
		jurisdictionName: {
			sql: `displayName`,
			type: `string`,
		},
		status: {
			sql: `status`,
			type: `string`,
		},
	},

	dataSource: `default`,
});
