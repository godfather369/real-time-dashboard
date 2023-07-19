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

cube(`MyImpactsSLA`, {
	sql: `SELECT DISTINCT(CONCAT(_id, user)),_id, tenantId, status, created, user  FROM (SELECT _id, tenantId, status, created, IFNULL(owners,ugId)as user FROM(SELECT * FROM(SELECT * FROM (SELECT _id, tenantId, status, created FROM ${impactAssessmentCollection} where ${impactAssessmentCollection}.archived=0) as impacts LEFT JOIN 
	(SELECT _id as UId , owners FROM ${impactAssessmentOwnersCollection}) as users ON impacts._id = users.UId) as impactUsers LEFT JOIN 
	(SELECT _id as GId , groups FROM ${impactAssessmentGroupsCollection}) as groupIds ON impactUsers._id = groupIds.GId) as impactUsersGroups LEFT JOIN
	(SELECT _id as ugId , functionalRole FROM ${groupsOfUserCollection}) as userGroups ON impactUsersGroups.owners = userGroups.ugId ||impactUsersGroups.groups = userGroups.functionalRole) AS MyImpactsSLA`,
	sqlAlias: `myIASLA`,

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
			sql: `${CUBE.user} = ${Users._id}`,
		},
	},

	preAggregations: {
		myImpactsSLARollUp: {
			sqlAlias: "myAlRP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [MyImpactsSLA.count],
			dimensions: [Tenants.tenantId, Users._id, MyImpactsSLA.status],
			timeDimension: MyImpactsSLA.created,
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
			drillMembers: [_id, user],
		},
	},

	dimensions: {
		tenantId: {
			sql: `tenantId`,
			type: `string`,
		},
		_id: {
			sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
			type: `string`,
			primaryKey: true,
		},
		status: {
			type: `string`,
			case: {
				when: [
					{
						sql: `${CUBE}.status = 'New' OR ${CUBE}.status = 'In Process'`,
						label: `Open`,
					},
					{
						sql: `${CUBE}.status = 'Closed'`,
						label: `Closed`,
					},
				],
			},
		},
		created: {
			sql: `${CUBE}.\`created\``,
			type: `time`,
		},
		user: {
			sql: `user`,
			type: `string`,
			title: `user`,
		},
	},

	dataSource: `default`,
});
