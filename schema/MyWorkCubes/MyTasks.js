const { securityContext } = COMPILE_CONTEXT;
import { tasksCollection, regMapStatusCollection } from "./collections";
import { MY_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MyTasks`, {
	sql: `SELECT _id, status, tenantId, dueDate FROM 
						(SELECT _id, tenantId, dueDate from ${tasksCollection} where ${tasksCollection}.archived=0 AND ${tasksCollection}.user="${securityContext.userId}" AND ${tasksCollection}.tenantId="${securityContext.tenantId}") AS tasks LEFT JOIN 
						(SELECT  srcObject, status FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.srcType="Task") AS status 
        ON status.srcObject=tasks._id`,

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
