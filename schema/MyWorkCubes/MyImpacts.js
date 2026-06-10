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
	sql: `
		SELECT impacts._id, impacts.tenantId, impacts.impactLevelId, impacts.status, impacts.startDate
		FROM (
			SELECT _id AS UId
			FROM ${impactAssessmentOwnersCollection}
			WHERE ${impactAssessmentOwnersCollection}.owners = "${userId}"

			UNION

			SELECT groupIds._id AS UId
			FROM (
				SELECT functionalRole
				FROM ${groupsOfUserCollection}
				WHERE ${groupsOfUserCollection}._id = "${userId}"
			) AS userGroups
			INNER JOIN (
				SELECT _id, groups
				FROM ${impactAssessmentGroupsCollection}
			) AS groupIds
				ON groupIds.groups = userGroups.functionalRole
		) AS Users
		INNER JOIN (
			SELECT _id, tenantId, \`customAttributes.IMPACT_LEVEL\` AS impactLevelId, status, startDate
			FROM ${impactAssessmentCollection}
			WHERE ${impactAssessmentCollection}.archived = 0
		) AS impacts
			ON impacts._id = Users.UId
	`,

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
