import {
	impactAssessmentCollection,
	impactAssessmentImpactedTeamCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`ImpactsByTeamCube`, {
	sql: `SELECT * FROM (SELECT _id, tenantId, startDate  FROM ${impactAssessmentCollection} where ${impactAssessmentCollection}.archived=0) as impacts INNER JOIN 
	(SELECT _id as Id , \`customAttributes.I_E_F_IMPACTED_TEAM\` as team FROM ${impactAssessmentImpactedTeamCollection}) as teamIds ON impacts._id = teamIds.Id`,

	sqlAlias: `IAITCube`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
	},

	preAggregations: {
		impactTeamRollUp: {
			sqlAlias: "IAByTeRP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [ImpactsByTeamCube.count],
			dimensions: [Tenants.tenantId, ImpactsByTeamCube.team],
			timeDimension: ImpactsByTeamCube.startDate,
			granularity: `day`,
			buildRangeStart: {
				sql: `SELECT NOW() - interval '90 day'`,
			},
			buildRangeEnd: {
				sql: `SELECT NOW()`,
			},
			refreshKey: {
				every: PRE_AGG_REFRESH_KEY_TIME,
			},
		},
	},

	measures: {
		count: {
			type: `count`,
			drillMembers: [_id],
		},
	},

	dimensions: {
		_id: {
			sql: `${CUBE}.\`_id\``,
			type: `string`,
			primaryKey: true,
		},
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
		startDate: {
			sql: `${CUBE}.\`startDate\``,
			type: `time`,
		},
		team: {
			sql: `team`,
			type: `string`,
			title: `team`,
		},
	},

	dataSource: `default`,
});
