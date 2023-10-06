import {
	regConfigCollection,
	impactAssessmentImpactLevelCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`ImpactsByLevelCube`, {
	sql: `SELECT impLevelId, impLevel, tenantId FROM (SELECT _id as configId, tenantId FROM ${regConfigCollection}) as config INNER JOIN 
        (SELECT _id as impLevel_Id, \`impactAssessment.extensions.fields.IMPACT_LEVEL.allowed_values.id\` as impLevelId, \`impactAssessment.extensions.fields.IMPACT_LEVEL.allowed_values.name\` as impLevel  FROM ${impactAssessmentImpactLevelCollection})
         as impLevelConfig ON impLevelConfig.impLevel_Id=config.configId `,

	sqlAlias: `ImpByLevel`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
		ImpactAssessmentCube: {
			relationship: `hasMany`,
			sql: `${CUBE.tenantId} = ${ImpactAssessmentCube.tenantId} AND ${CUBE.impactLevelId}=${ImpactAssessmentCube.impactLevel}`,
		},
	},

	preAggregations: {
		impactAssessmentByLevelRollUp: {
			sqlAlias: "iaByLevel",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [ImpactAssessmentCube.count],
			dimensions: [ImpactsByLevelCube.impactLevel, Tenants.tenantId],
			timeDimension: ImpactAssessmentCube.startDate,
			granularity: `day`,
			buildRangeStart: {
				sql: `SELECT NOW() - interval '365 day'`,
			},
			buildRangeEnd: {
				sql: `SELECT NOW()`,
			},
			refreshKey: {
				every: PRE_AGG_REFRESH_KEY_TIME,
			},
		},
	},

	dimensions: {
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
		impactLevelId: {
			sql: `impLevelId`,
			type: `string`,
		},
		impactLevel: {
			sql: `impLevel`,
			type: `string`,
		},
	},

	dataSource: `default`,
});
