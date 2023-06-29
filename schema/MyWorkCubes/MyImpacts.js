import {
	impactAssessmentCollection,
	impactAssessmentGroupsCollection,
	impactAssessmentOwnersCollection,
	groupsOfUserCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`MyImpacts`, {
	sql: `SELECT DISTINCT(CONCAT(_id, ugId)), _id, tenantId, impactLevel, status, startDate, ugId, owners FROM(SELECT * FROM(SELECT * FROM (SELECT _id, tenantId, impactLevel, status, startDate FROM ${impactAssessmentCollection} where ${impactAssessmentCollection}.archived=0) as impacts LEFT JOIN 
	(SELECT _id as UId , owners FROM ${impactAssessmentOwnersCollection}) as users ON impacts._id = users.UId) as impactUsers LEFT JOIN 
	(SELECT _id as GId , groups FROM ${impactAssessmentGroupsCollection}) as groupIds ON impactUsers._id = groupIds.GId) as impactUsersGroups LEFT JOIN
	(SELECT _id as ugId , functionalRole FROM ${groupsOfUserCollection}) as userGroups ON impactUsersGroups.owners = userGroups.ugId ||impactUsersGroups.groups = userGroups.functionalRole`,
	sqlAlias: `myIA`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `belongsTo`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
		Users: {
			relationship: `belongsTo`,
			sql: `${CUBE.ugId} = ${Users._id}||${CUBE.owners} = ${Users._id}`,
		},
	},

	preAggregations: {
		myImpactsRollUp: {
			sqlAlias: "myIARP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [MyImpacts.inProcess, MyImpacts.New, MyImpacts.closed],
			dimensions: [Tenants.tenantId, Users._id, MyImpacts.impactLevel],
			timeDimension: MyImpacts.startDate,
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
			drillMembers: [_id, ugId],
		},
		inProcess: {
			type: "count",
			drillMembers: [_id, ugId],
			filters: [
				{
					sql: `${CUBE}.status = 'In Process'`,
				},
			],
		},
		New: {
			type: "count",
			drillMembers: [_id, ugId],
			filters: [
				{
					sql: `${CUBE}.status ='New'`,
				},
			],
		},
		closed: {
			type: "count",
			drillMembers: [_id, ugId],
			filters: [
				{
					sql: `${CUBE}.status = 'Closed'`,
				},
			],
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
		ugId: {
			sql: `ugId`,
			type: `string`,
			title: `ugId`,
		},
	},

	dataSource: `default`,
});
