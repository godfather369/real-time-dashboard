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
	sql: `
		SELECT impacts._id, impacts.tenantId, impacts.status, impacts.created
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
			SELECT _id, tenantId, status, created
			FROM ${impactAssessmentCollection}
			WHERE ${impactAssessmentCollection}.archived = 0
		) AS impacts
			ON impacts._id = Users.UId
	`,
	sqlAlias: `myIASLA`,

	refreshKey: {
		every: MY_CUBE_REFRESH_KEY_TIME,
	},

	joins: {},

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
