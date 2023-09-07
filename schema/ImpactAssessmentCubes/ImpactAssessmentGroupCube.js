import {
	impactAssessmentCollection,
	impactAssessmentGroupsCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`ImpactsByGroupCube`, {
	sql: `SELECT * FROM (SELECT _id, tenantId, startDate, created, status  FROM ${impactAssessmentCollection} where ${impactAssessmentCollection}.archived=0) as impacts INNER JOIN 
	(SELECT _id as Id , groups FROM ${impactAssessmentGroupsCollection}) as grpIds ON impacts._id = grpIds.Id`,

	sqlAlias: `IAGrCube`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
		Groups: {
			relationship: `belongsTo`,
			sql: `${CUBE.groups} = ${Groups._id}`,
		},
	},

	preAggregations: {
		impactsGroupsRollUp: {
			sqlAlias: "IAByAppRP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
				ImpactsByGroupCube.count,
				ImpactsByGroupCube.open,
				ImpactsByGroupCube.New,
				ImpactsByGroupCube.inProcess,
				ImpactsByGroupCube.closed,
			],
			dimensions: [Tenants.tenantId, Groups.name, Groups._id],
			timeDimension: ImpactsByGroupCube.created,
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
			drillMembers: [_id],
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
		New: {
			sql: `status`,
			type: "count",
			title: "Open",
			filters: [
				{
					sql: `${CUBE}.status ='New'`,
				},
			],
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
		open: {
			sql: `${inProcess} + ${New}`,
			type: `number`,
			title: "open",
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
		created: {
			sql: `${CUBE}.\`created\``,
			type: `time`,
		},
		groups: {
			sql: `groups`,
			type: `string`,
			title: `groups`,
		},
		status: {
			sql: `status`,
			type: `string`,
		},
	},

	dataSource: `default`,
});
