import {
	tasksCollection,
	regMapStatusCollection,
	tasksByStatusCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`MyTasks`, {
	sql: `SELECT DISTINCT _id, status, owner, tenantId, dueDate,\`status.task.name\` FROM (SELECT _id, status, owner, tenantId, dueDate FROM 
		(SELECT _id, tenantId, owner, dueDate from ${tasksCollection} where ${tasksCollection}.archived=0) AS tasks 
        LEFT JOIN (SELECT  srcObject, status FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.archived=0 AND ${regMapStatusCollection}.srcType="Task") AS status 
        ON status.srcObject=tasks._id) as myTasks INNER JOIN (SELECT \`status.task.id\`, \`status.task.name\` FROM ${tasksByStatusCollection}) as taskId ON taskID.\`status.task.id\`=myTasks.status`,

	sqlAlias: `MyTaCube`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
		Users: {
			relationship: `belongsTo`,
			sql: `${CUBE.owner} = ${Users._id}`,
		},
	},

	preAggregations: {
		tasksRollUp: {
			sqlAlias: "taskRP",
			external: true,
			measures: [MyTasks.overYear, MyTasks.overMonth, MyTasks.overWeek],
			dimensions: [MyTasks.tenantId, MyTasks.taskStatus, Users._id],
			scheduledRefresh: true,
			refreshKey: {
				every: PRE_AGG_REFRESH_KEY_TIME,
			},
		},
	},

	measures: {
		count: {
			type: `count`,
			drillMembers: [_id],
		},
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
		owner: {
			sql: `${CUBE}.owner`,
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
