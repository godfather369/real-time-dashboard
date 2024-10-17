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

cube(`MyAlertsSLA`, {
	sql: `SELECT * FROM ((SELECT _id as UId FROM ${alertsUsersCollection} WHERE ${alertsUsersCollection}.owners="${userId}") UNION SELECT GId as UId FROM (SELECT functionalRole FROM ${groupsOfUserCollection} WHERE users_functionalRole._id="${userId}") as userGroups INNER JOIN (SELECT _id as GId , groups FROM ${alertsGroupsCollection}) as groupIds ON groupIds.groups = userGroups.functionalRole) as Users INNER JOIN (SELECT _id, alertCategory, created, tenantId, status FROM ${alertsCollection} where ${alertsCollection}.archived=0) as alerts ON alerts._id=Users.UId`,
	sqlAlias: `myAlSLA`,

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
						sql: `${CUBE}.status = 'Excluded' OR ${CUBE}.status = 'Following' OR ${CUBE}.status = 'Applicable' OR ${CUBE}.status = 'Duplicate'`,
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
	},

	dataSource: `default`,
});
