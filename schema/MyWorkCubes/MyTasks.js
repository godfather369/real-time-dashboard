const {
	securityContext: { userId },
} = COMPILE_CONTEXT;
import { tasksCollection, regMapStatusCollection, tasksOwnersCollection, tasksGroupsCollection, groupsOfUserCollection } from "./collections";
import { MY_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MyTasks`, {
	sql: `
		SELECT tasks._id, tasks.tenantId, tasks.dueDate, status.status
		FROM (
			SELECT _id AS uid
			FROM ${tasksOwnersCollection}
			WHERE ${tasksOwnersCollection}.owners = "${userId}"

			UNION

			SELECT groupIds._id AS uid
			FROM (
				SELECT functionalRole
				FROM ${groupsOfUserCollection}
				WHERE ${groupsOfUserCollection}._id = "${userId}"
			) AS userGroups
			INNER JOIN (
				SELECT _id, groups
				FROM ${tasksGroupsCollection}
			) AS groupIds
				ON groupIds.groups = userGroups.functionalRole
		) AS users
		INNER JOIN (
			SELECT _id, tenantId, dueDate
			FROM ${tasksCollection}
			WHERE ${tasksCollection}.archived = 0
		) AS tasks
			ON tasks._id = users.uid
		LEFT JOIN (
			SELECT srcObject, status, tenantId AS tntId
			FROM ${regMapStatusCollection}
			WHERE ${regMapStatusCollection}.srcType = "Task"
				AND ${regMapStatusCollection}.archived = 0
		) AS status
			ON status.srcObject = tasks._id
			AND status.tntId = tasks.tenantId
	`,

	sqlAlias: `MyTaCube`,

	refreshKey: {
		every: MY_CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		TaskStatus: {
			relationship: `hasOne`,
			sql: `${CUBE.status} = ${TaskStatus.statusId} AND ${CUBE.tenantId} = ${TaskStatus.tenantId}`,
		},
	},

	measures: {
		overYear: {
			type: `count`,
			filters: [
				{
					sql: `DATEDIFF(CURRENT_TIMESTAMP, ${CUBE}.\`dueDate\`) > 365`,
				},
			],
		},
		overMonth: {
			type: `count`,
			filters: [
				{
					sql: `DATEDIFF(CURRENT_TIMESTAMP, ${CUBE}.\`dueDate\`) > 30`,
				},
			],
		},
		overWeek: {
			type: `count`,
			filters: [
				{
					sql: `DATEDIFF(CURRENT_TIMESTAMP, ${CUBE}.\`dueDate\`) > 7`,
				},
			],
		},
		count: {
			sql: `${overYear} + ${overMonth} +${overWeek}`,
			type: `number`,
		},
	},

	dimensions: {
		_id: {
			sql: `${CUBE}._id`,
			type: `string`,
			primaryKey: true,
		},
		status: {
			sql: `${CUBE}.status`,
			type: `string`,
		},
		tenantId: {
			sql: `${CUBE}.tenantId`,
			type: `string`,
		},
		dueDate: {
			sql: `${CUBE}.\`dueDate\``,
			type: `time`,
		},
		taskStatus: {
			sql: `${CUBE}.\`status.task.name\``,
			type: `string`,
			title: `taskStatus`,
		},
	},

	dataSource: `default`,
});
