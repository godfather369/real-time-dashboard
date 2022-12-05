import { regMapStatusCollection ,uniregCollection,juridictionsCollection, corpusCollection} from "./collections";
import {COMPLIANCE_COVERAGE_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`CoverageByJurisdictionCube`, {
	sql : `
	SELECT _id,tenantId ,displayName ,status FROM
	(
			(
				SELECT _id,tenantId ,repo ,status FROM 
					(
							(SELECT _id , tenantId, srcObject,status FROM ${regMapStatusCollection} 
								WHERE ${regMapStatusCollection}.srcType = 'Regulation'
								AND ${regMapStatusCollection}.archived = 0
							) as RegMapStatusCube 
						LEFT JOIN 
							(SELECT _id as uniregId , repo FROM ${uniregCollection}) AS UniRegCube 
						ON RegMapStatusCube.srcObject = UniRegCube.uniregId 
					)
			) AS RegMapUniregJoin
		LEFT JOIN 
		(
			SELECT id,displayName FROM 
			(
				(SELECT id, jurisdiction from ${corpusCollection})AS CorpusCollectionCube
				LEFT JOIN 
					(SELECT jurisdictionId , displayName from ${juridictionsCollection})AS JurisdictionCollectionCube
				ON CorpusCollectionCube.jurisdiction = JurisdictionCollectionCube.jurisdictionId)
			)AS CorpusJurisdictionJoin
		ON RegMapUniregJoin.repo = CorpusJurisdictionJoin.id
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
