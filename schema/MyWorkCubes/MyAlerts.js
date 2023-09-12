const {
	securityContext: { userId },
} = COMPILE_CONTEXT;
import {
	alertsCollection,
	alertsUsersCollection,
	alertsGroupsCollection,
	groupsOfUserCollection,
} from "./collections";
import { MY_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MyAlerts`, {
	sql: `SELECT * FROM ((SELECT _id as UId FROM ${alertsUsersCollection} WHERE ${alertsUsersCollection}.owners="${userId}") UNION SELECT GId as UId FROM (SELECT functionalRole FROM ${groupsOfUserCollection} WHERE users_functionalRole._id="${userId}") as userGroups INNER JOIN (SELECT _id as GId , groups FROM ${alertsGroupsCollection}) as groupIds ON groupIds.groups = userGroups.functionalRole) as Users INNER JOIN (SELECT _id, alertCategory, publishedDate, tenantId, status FROM ${alertsCollection} where ${alertsCollection}.archived=0) as alerts ON alerts._id=Users.UId`,
	sqlAlias: `myAl`,

	refreshKey: {
		every: MY_CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `belongsTo`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
	},

	measures: {
		count: {
			type: `count`,
			drillMembers: [_id],
		},
		bills: {
			type: `count`,
			drillMembers: [_id],
			filters: [
				{
					sql: `${CUBE}.alertCategory = 'Bills' AND ${CUBE}.status!= 'Excluded'`,
				},
			],
		},
		agencyUpdates: {
			type: `count`,
			drillMembers: [_id],
			filters: [
				{
					sql: `${CUBE}.alertCategory = 'News & Publications' AND ${CUBE}.status!= 'Excluded'`,
				},
			],
		},
		regulatoryChanges: {
			type: `count`,
			drillMembers: [_id],
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
	},

	dataSource: `default`,
});
