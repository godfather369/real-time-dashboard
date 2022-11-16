import { impactAssessmentCollection } from "./collections";
import {
	IMPACT_ASSESSMENT_CUBE_REFRESH_KEY_TIME,
	IMPACT_ASSESSMENT_CUBE_PRE_AGG_REFRESH_KEY,
	IMPACT_ASSESSMENT_IMPACTED_TEAM_CUBE_PRE_AGG_REFRESH_KEY
} from "./cube-constants";

cube(`ImpactAssessmentCube`, {
	sql: `SELECT * FROM ${impactAssessmentCollection} where ${impactAssessmentCollection}.archived=0`,

	sqlAlias: `impAsCube`,

	refreshKey: {
		every: IMPACT_ASSESSMENT_CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
		ImpactAssessmentOwnersCube: {
			relationship: `belongsTo`,
			sql: `${CUBE._id} = ${ImpactAssessmentOwnersCube._id}`,
		},
		ImpactAssessmentImpactedTeamCube: {
			relationship: `belongsTo`,
			sql: `${CUBE._id}=${ImpactAssessmentImpactedTeamCube.id}`
		}
	},

	preAggregations: {
		impactAssessmentByStatusRollUp: {
			sqlAlias: "iaByStatus",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
				ImpactAssessmentCube.inProcess,
				ImpactAssessmentCube.new,
				ImpactAssessmentCube.closed,
			],
			timeDimension: ImpactAssessmentCube.startDate,
			granularity: `month`,
			buildRangeStart: {
				sql: `SELECT NOW() - interval '365 day'`,
			},
			buildRangeEnd: {
				sql: `SELECT NOW()`,
			},
			refreshKey: {
				every: IMPACT_ASSESSMENT_CUBE_PRE_AGG_REFRESH_KEY,
			},
		},
		impactAssessmentByImpactLevelRollUp: {
			sqlAlias: "iaByIL",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
				ImpactAssessmentCube.noImpact,
				ImpactAssessmentCube.low,
				ImpactAssessmentCube.medium,
				ImpactAssessmentCube.high,
				ImpactAssessmentCube.critical,
			],
			timeDimension: ImpactAssessmentCube.startDate,
			granularity: `month`,
			buildRangeStart: {
				sql: `SELECT NOW() - interval '365 day'`,
			},
			buildRangeEnd: {
				sql: `SELECT NOW()`,
			},
			refreshKey: {
				every: IMPACT_ASSESSMENT_CUBE_PRE_AGG_REFRESH_KEY,
			},
		},
		impactAssessmentImpactedTeamRollUp: {
			sqlAlias: "iaByTm",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
			  ImpactAssessmentCube.count
			],
			dimensions: [
			  ImpactAssessmentImpactedTeamCube.impactedTeam
			],
			timeDimension: ImpactAssessmentCube.startDate,
			granularity: `month`,
			buildRangeStart: {
			  sql: `SELECT NOW() - interval '365 day'`,
			},
			buildRangeEnd: {
			  sql: `SELECT NOW()`,
			},
			refreshKey: {
			  every: IMPACT_ASSESSMENT_IMPACTED_TEAM_CUBE_PRE_AGG_REFRESH_KEY
			}
		  }
	},

	measures: {
		count: {
			type: `count`,
		},
		inProcess: {
			sql: `status`,
			type: "count",
			title: "InProcess",
			filters: [
				{
					sql: `${CUBE}.status = 'In Process'`,
				},
			],
		},
		new: {
			sql: `status`,
			type: "count",
			title: "New",
			filters: [
				{
					sql: `${CUBE}.status ='New'`,
				},
			],
		},
		closed: {
			sql: `status`,
			type: "count",
			title: "Closed",
			filters: [
				{
					sql: `${CUBE}.status = 'Closed'`,
				},
			],
		},
		noImpact: {
			type: `count`,
			sql: `impactLevel`,
			title: `noImpact`,
			filters: [{ sql: `${CUBE}.impactLevel = 'No Impact'` }],
		},
		low: {
			type: `count`,
			sql: `impactLevel`,
			title: `low`,
			filters: [{ sql: `${CUBE}.impactLevel = 'Low'` }],
		},
		medium: {
			type: `count`,
			sql: `impactLevel`,
			title: `medium`,
			filters: [{ sql: `${CUBE}.impactLevel = 'Medium'` }],
		},
		high: {
			type: `count`,
			sql: `impactLevel`,
			title: `high`,
			filters: [{ sql: `${CUBE}.impactLevel = 'High'` }],
		},
		critical: {
			type: `count`,
			sql: `impactLevel`,
			title: `critical`,
			filters: [{ sql: `${CUBE}.impactLevel = 'Critical'` }],
		},
	},

	dimensions: {
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
		startDate: {
			sql: `${CUBE}.\`startDate\``,
			type: `time`,
		},
		_id: {
			sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
			type: `string`,
			primaryKey: true,
		},
		impactLevel: {
			sql: `${CUBE}.\`impactLevel\``,
			type: `string`,
		},
		status: {
			sql: `${CUBE}.\`status\``,
			type: `string`,
		},
	},

	dataSource: `default`,
});
