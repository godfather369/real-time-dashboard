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
  sql: `
		SELECT
			tasks._id,
			configStatus.statusId,
			configStatus.statusName,
			tasks.tenantId,
			tasks.dueDate
		FROM ${tasksCollection} AS tasks
		INNER JOIN (
			SELECT status, srcObject
			FROM ${regMapStatusCollection}
			WHERE ${regMapStatusCollection}.srcType = "Task"
				AND ${regMapStatusCollection}.archived = 0
		) AS mapStatus
			ON tasks._id = mapStatus.srcObject
		INNER JOIN ${regConfigCollection} AS config
			ON config.tenantId = tasks.tenantId
		INNER JOIN (
			SELECT _id AS ID, \`status.task.id\` AS statusId, \`status.task.name\` AS statusName
			FROM ${tasksByStatusCollection}
		) AS configStatus
			ON config._id = configStatus.ID
			AND configStatus.statusId = mapStatus.status
		WHERE tasks.archived = 0
	`,

  sqlAlias: `TaCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

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
      dimensions: [TasksCube.tenantId, TasksCube.status, TasksCube.statusId],
      scheduledRefresh: true,
      refreshKey: {
        every: PRE_AGG_REFRESH_KEY_TIME,
      },
    },
    tasksDueRollUp: {
      sqlAlias: "taDueRollUp",
      external: true,
      measures: [TasksCube.count],
      dimensions: [TasksCube.tenantId, TasksCube.dueDate],
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
