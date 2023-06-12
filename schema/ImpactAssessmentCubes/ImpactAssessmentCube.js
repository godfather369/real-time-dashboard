import { impactAssessmentCollection } from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`ImpactAssessmentCube`, {
	sql: `SELECT _id, tenantId, impactLevel, status, startDate FROM ${impactAssessmentCollection} where ${impactAssessmentCollection}.archived=0`,

	sqlAlias: `impAsCube`,

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
			dimensions: [Tenants.tenantId],
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
			dimensions: [Tenants.tenantId],
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
			sql: `tenantId`,
			type: `string`,
		},
		startDate: {
			sql: `startDate`,
			type: `time`,
		},
		_id: {
			sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
			type: `string`,
			primaryKey: true,
		},
		impactLevel: {
			sql: `impactLevel`,
			type: `string`,
		},
		status: {
			sql: `status`,
			type: `string`,
		},
	},

	dataSource: `default`,
});
