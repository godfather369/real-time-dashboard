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

cube(`MyImpactsSLA`, {
	sql: `SELECT * FROM ((SELECT _id as UId FROM ${impactAssessmentOwnersCollection} WHERE CONVERT(${impactAssessmentOwnersCollection}.owners, CHAR)="${userId}") UNION SELECT GId as UId FROM (SELECT functionalRole FROM ${groupsOfUserCollection} WHERE CONVERT(${groupsOfUserCollection}._id, CHAR)="${userId}") as userGroups INNER JOIN (SELECT _id as GId , groups FROM ${impactAssessmentGroupsCollection}) as groupIds ON CONVERT(groupIds.groups,CHAR) = userGroups.functionalRole) as Users INNER JOIN (SELECT _id, tenantId, status, created FROM ${impactAssessmentCollection} where ${impactAssessmentCollection}.archived=0) as impacts ON impacts._id=Users.UId`,
	sqlAlias: `myIASLA`,

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
	},

	dataSource: `default`,
});
