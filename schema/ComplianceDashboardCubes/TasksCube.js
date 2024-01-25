import {
	tasksCollection,
	regMapStatusCollection,
	tasksByStatusCollection,
	regConfigCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`TasksCube`, {
	sql: `SELECT _id, statusId, statusName, tenantId, dueDate FROM (SELECT _id, status, tenantId, dueDate FROM 
	(SELECT _id, tenantId, dueDate FROM ${tasksCollection} where ${tasksCollection}.archived = 0) AS tasks INNER JOIN 
    (SELECT status, srcObject FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.srcType="Task" AND ${regMapStatusCollection}.archived=0) as mapStatus ON tasks._id=mapStatus.srcObject) AS taskStatus INNER JOIN (SELECT tenantId as tenant, statusId, statusName FROM (SELECT _id, tenantId FROM ${regConfigCollection}) as config INNER JOIN (SELECT _id as ID, \`status.task.id\` as statusId, \`status.task.name\` as statusName  FROM ${tasksByStatusCollection}) AS configStatus ON config._id=configStatus.ID) as taskConfig ON taskConfig.tenant= taskStatus.tenantId AND taskConfig.statusId= taskStatus.status`,

	sqlAlias: `TaCube`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
	},

	measures: {
		count: {
			type: `count`,
			drillMembers: [_id],
		},
	},

	preAggregations: {
		tasksRollUp: {
			sqlAlias: "taRollUp",
			external: true,
			measures: [TasksCube.count],
			dimensions: [Tenants.tenantId, TasksCube.status, TasksCube.statusId],
			scheduledRefresh: true,
			refreshKey: {
				every: PRE_AGG_REFRESH_KEY_TIME,
			},
		},
		tasksDueRollUp: {
			sqlAlias: "taDueRollUp",
			external: true,
			measures: [TasksCube.count],
			dimensions: [Tenants.tenantId, TasksCube.dueDate],
			scheduledRefresh: true,
			refreshKey: {
				every: PRE_AGG_REFRESH_KEY_TIME,
			},
		},
	},

	dimensions: {
		_id: {
			sql: `${CUBE}.\`_id\``,
			type: `string`,
			primaryKey: true,
		},
		status: {
			sql: `${CUBE}.\`statusName\``,
			type: `string`,
			title: `status`,
		},
		statusId: {
			sql: `${CUBE}.\`statusId\``,
			type: `string`,
			title: `statusId`,
		},
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
		dueDate: {
			type: `string`,
			case: {
				when: [
					{
						sql: `DATEDIFF(CURRENT_TIMESTAMP, ${CUBE}.\`dueDate\`) > 365`,
						label: `i18n_LBL_1_OVER_YEAR`,
					},
					{
						sql: `DATEDIFF(CURRENT_TIMESTAMP, ${CUBE}.\`dueDate\`) > 30`,
						label: `i18n_LBL_2_OVER_MONTH`,
					},
					{
						sql: `DATEDIFF(CURRENT_TIMESTAMP, ${CUBE}.\`dueDate\`) > 7`,
						label: `i18n_LBL_3_OVER_WEEK`,
					},
					{
						sql: `DATEDIFF(CURRENT_TIMESTAMP, ${CUBE}.\`dueDate\`) > 1`,
						label: `i18n_LBL_4_OVER_DAY`,
					},
				],
			},
		},
	},
	dataSource: `default`,
});
