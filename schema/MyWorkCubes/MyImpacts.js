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
	sql: `SELECT * FROM ((SELECT _id as UId FROM ${impactAssessmentOwnersCollection} WHERE ${impactAssessmentOwnersCollection}.owners="${userId}") UNION SELECT GId as UId FROM (SELECT functionalRole FROM ${groupsOfUserCollection} WHERE ${groupsOfUserCollection}._id="${userId}") as userGroups INNER JOIN (SELECT _id as GId , groups FROM ${impactAssessmentGroupsCollection}) as groupIds ON groupIds.groups = userGroups.functionalRole) as Users INNER JOIN (SELECT _id, tenantId, \`customAttributes.IMPACT_LEVEL\` as impactLevelId, status, startDate FROM ${impactAssessmentCollection} where ${impactAssessmentCollection}.archived=0) as impacts ON impacts._id=Users.UId`,

	sqlAlias: `myIA`,

	refreshKey: {
		every: MY_CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		ImpactsByLevelCube: {
			relationship: `hasMany`,
			sql: `${CUBE.tenantId} = ${ImpactsByLevelCube.tenantId} AND ${CUBE.impactLevelId}=${ImpactsByLevelCube.impactLevelId}`,
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
		impactLevelId: {
			sql: `impactLevelId`,
			type: `string`,
		},
		status: {
			sql: `status`,
			type: `string`,
		},
	},

	dataSource: `default`,
});
