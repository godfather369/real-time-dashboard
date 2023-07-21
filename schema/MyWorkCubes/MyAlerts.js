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

cube(`MyAlerts`, {
	sql: `SELECT DISTINCT(CONCAT(CONVERT(_id, char), CONVERT( user, char))),_id, alertCategory, publishedDate, tenantId,status, user FROM (SELECT _id, alertCategory, publishedDate, tenantId, status, IFNULL(owners,ugId)as user FROM(SELECT * FROM(SELECT * FROM (SELECT _id, alertCategory, publishedDate, tenantId, status FROM ${alertsCollection} where ${alertsCollection}.archived=0) as alerts LEFT JOIN 
	(SELECT _id as UId , owners FROM ${alertsUsersCollection}) as users ON alerts._id = users.UId) as alertsUsers LEFT JOIN 
	(SELECT _id as GId , groups FROM ${alertsGroupsCollection}) as groupIds ON alertsUsers._id = groupIds.GId) as alertsUsersGroups LEFT JOIN
	(SELECT _id as ugId , functionalRole FROM ${groupsOfUserCollection}) as userGroups ON alertsUsersGroups.owners = userGroups.ugId ||alertsUsersGroups.groups = userGroups.functionalRole) as MyAlerts`,
	sqlAlias: `myAl`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `belongsTo`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
	},

	preAggregations: {
		myAlertsRollUp: {
			sqlAlias: "myAlRP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
				MyAlerts.bills,
				MyAlerts.regulatoryChanges,
				MyAlerts.agencyUpdates,
				MyAlerts.count,
			],
			dimensions: [Tenants.tenantId, MyAlerts.user],
			timeDimension: MyAlerts.publishedDate,
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
		bills: {
			type: `count`,
			drillMembers: [_id, user],
			filters: [
				{
					sql: `${CUBE}.alertCategory = 'Bills' AND ${CUBE}.status!= 'Excluded'`,
				},
			],
		},
		agencyUpdates: {
			type: `count`,
			drillMembers: [_id, user],
			filters: [
				{
					sql: `${CUBE}.alertCategory = 'News & Publications' AND ${CUBE}.status!= 'Excluded'`,
				},
			],
		},
		regulatoryChanges: {
			type: `count`,
			drillMembers: [_id, user],
			filters: [
				{
					sql: `${CUBE}.alertCategory = 'Laws & Regulations' AND ${CUBE}.status!= 'Excluded'`,
				},
			],
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
		publishedDate: {
			sql: `${CUBE}.\`publishedDate\``,
			type: `time`,
		},
		alertCategory: {
			sql: `${CUBE}.\`alertCategory\``,
			type: `string`,
			title: `Alert Category`,
		},
		status: {
			sql: `${CUBE}.\`status\``,
			type: `string`,
			title: `Status`,
		},
		user: {
			sql: `${CUBE}.\`user\``,
			type: `string`,
			title: `user`,
		},
	},

	dataSource: `default`,
});
