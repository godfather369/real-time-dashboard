import {
	alertsCollection,
	alertsUsersCollection,
	alertsGroupsCollection,
	groupsOfUserCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`MyAlertsSLA`, {
	sql: `SELECT DISTINCT(CONCAT(_id, ugId)), _id, tenantId, status, created, ugId FROM(SELECT * FROM(SELECT * FROM (SELECT _id, tenantId, status, created FROM ${alertsCollection} where ${alertsCollection}.archived=0) as alerts LEFT JOIN 
	(SELECT _id as UId , owners FROM ${alertsUsersCollection}) as users ON alerts._id = users.UId) as alertsUsers LEFT JOIN 
	(SELECT _id as GId , groups FROM ${alertsGroupsCollection}) as groupIds ON alertsUsers._id = groupIds.GId) as alertsUsersGroups INNER JOIN
	(SELECT _id as ugId , functionalRole FROM ${groupsOfUserCollection}) as userGroups ON alertsUsersGroups.owners = userGroups.ugId ||alertsUsersGroups.groups = userGroups.functionalRole`,
	sqlAlias: `myAlSLA`,

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
			sql: `${CUBE.ugId} = ${Users._id}`,
		},
	},

	preAggregations: {
		myAlertsSLARollUp: {
			sqlAlias: "myAlSLARP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [MyAlertsSLA.count],
			dimensions: [Tenants.tenantId, Users._id, MyAlertsSLA.status],
			timeDimension: MyAlertsSLA.created,
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
	},

	dimensions: {
		_id: {
			sql: `${CUBE}.\`_id\``,
			type: `string`,
			primaryKey: true,
		},
		status: {
			type: `string`,
			case: {
				when: [
					{
						sql: `${CUBE}.status = 'Unread' OR ${CUBE}.status = 'In Process'`,
						label: `Open`,
					},
					{
						sql: `${CUBE}.status = 'Excluded' OR ${CUBE}.status = 'Following' OR ${CUBE}.status = 'Applicable'`,
						label: `Closed`,
					},
				],
			},
		},
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
		created: {
			sql: `${CUBE}.\`created\``,
			type: `time`,
		},
		ugId: {
			sql: `${CUBE}.\`ugId\``,
			type: `string`,
			title: `ugId`,
		},
	},

	dataSource: `default`,
});
