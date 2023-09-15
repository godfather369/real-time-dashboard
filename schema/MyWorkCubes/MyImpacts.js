const {
	securityContext: { userId },
} = COMPILE_CONTEXT;
import {
	impactAssessmentCollection,
	impactAssessmentGroupsCollection,
	impactAssessmentOwnersCollection,
	groupsOfUserCollection,
} from "./collections";
import { MY_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MyImpacts`, {
	sql: `SELECT * FROM ((SELECT _id as UId FROM ${impactAssessmentOwnersCollection} WHERE CONVERT(${impactAssessmentOwnersCollection}.owners, CHAR)="${userId}") UNION SELECT GId as UId FROM (SELECT functionalRole FROM ${groupsOfUserCollection} WHERE CONVERT(${groupsOfUserCollection}._id, CHAR)="${userId}") as userGroups INNER JOIN (SELECT _id as GId , groups FROM ${impactAssessmentGroupsCollection}) as groupIds ON CONVERT(groupIds.groups,CHAR) = userGroups.functionalRole) as Users INNER JOIN (SELECT _id, tenantId, impactLevel, status, startDate FROM ${impactAssessmentCollection} where ${impactAssessmentCollection}.archived=0) as impacts ON impacts._id=Users.UId`,

	sqlAlias: `myIA`,

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
		inProcess: {
			type: "count",
			drillMembers: [_id],
			filters: [
				{
					sql: `${CUBE}.status = 'In Process'`,
				},
			],
		},
		New: {
			type: "count",
			drillMembers: [_id],
			filters: [
				{
					sql: `${CUBE}.status ='New'`,
				},
			],
		},
		closed: {
			type: "count",
			drillMembers: [_id],
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
	},

	dataSource: `default`,
});
