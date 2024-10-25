const {
	securityContext: { userId },
} = COMPILE_CONTEXT;
import { tasksCollection, regMapStatusCollection, tasksOwnersCollection, tasksGroupsCollection, groupsOfUserCollection } from "./collections";
import { MY_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MyTasks`, {
	sql: `SELECT *
		FROM (
				(
					SELECT _id AS uid
					FROM ${tasksOwnersCollection}
					WHERE ${tasksOwnersCollection}.owners = "${userId}"
				)
				UNION
				SELECT gid AS uid
				FROM (
						SELECT functionalrole
						FROM ${groupsOfUserCollection}
						WHERE ${groupsOfUserCollection}._id = "${userId}"
					) AS usergroups
				INNER JOIN (
						SELECT _id AS gid, groups
						FROM ${tasksGroupsCollection}
					) AS groupids
				ON groupids.groups = usergroups.functionalrole
			) AS users
		INNER JOIN (
				SELECT _id, status, tenantid, duedate
				FROM (
						SELECT _id, tenantid, duedate
						FROM ${tasksCollection}
						WHERE ${tasksCollection}.archived = 0
					) AS tasks
				LEFT JOIN (
						SELECT srcobject, status, tenantid AS tntid
						FROM ${regMapStatusCollection}
						WHERE ${regMapStatusCollection}.srctype = "Task"
						AND ${regMapStatusCollection}.archived = 0
					) AS status
				ON status.srcobject = tasks._id
				AND status.tntid = tasks.tenantid
			) AS tasks
		ON tasks._id = users.uid`,

	sqlAlias: `MyTaCube`,

	refreshKey: {
		every: MY_CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
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
