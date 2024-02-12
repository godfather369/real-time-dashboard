import {
	impactAssessmentCollection,
	impactAssessmentGroupsCollection,
	regMapGenericCollection,
	alertsCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`ImpactsByGroupCube`, {
	sql: `SELECT _id, tenantId, status, startDate, docStatus, created, groups FROM (SELECT _id, tenantId, status, startDate, srcObject, created, groups FROM (SELECT _id, tenantId, startDate, created, status, groups FROM (SELECT _id, tenantId, startDate, created, status  FROM ${impactAssessmentCollection} where ${impactAssessmentCollection}.archived=0) as impacts INNER JOIN (SELECT _id as Id , groups FROM ${impactAssessmentGroupsCollection}) as groupIds ON impacts._id = groupIds.Id) as UserImpacts INNER JOIN (SELECT srcObject, destObject FROM ${regMapGenericCollection} WHERE ${regMapGenericCollection}.archived=0 AND ${regMapGenericCollection}.srcType="Alert" AND ${regMapGenericCollection}.destType="ImpactAssessment") as Maps ON UserImpacts._id=Maps.destObject) as mappedImpacts INNER JOIN (SELECT _id as Id, \`info.docStatus\` as docStatus FROM ${alertsCollection} WHERE ${alertsCollection}.archived=0) as alerts ON mappedImpacts.srcObject=alerts.Id`,

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
			sql: `TRIM(CONVERT(${CUBE.groups}, CHAR)) = TRIM(CONVERT(${Groups._id}, CHAR))`,
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
			dimensions: [
				Tenants.tenantId,
				Groups.name,
				Groups._id,
				ImpactsByGroupCube.docStatus,
			],
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
		docStatus: {
			sql: `${CUBE}.\`docStatus\``,
			type: `string`,
			title: `Doc Status`,
		},
	},

	dataSource: `default`,
});
