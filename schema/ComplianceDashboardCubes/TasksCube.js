import { TASK_CUBE_REFRESH_KEY_TIME , TASKS_CUBE_PRE_AGG_REFRESH_KEY_TIME } from "./cube-constants";
import { tasksCollection } from "./collections";

cube(`TasksCube`, {
  sql: `SELECT * FROM ${tasksCollection} where ${tasksCollection}.archived = 0`,

  extends: Users,

  sqlAlias : `TskCube`,
  
  refreshKey: {
    every: TASK_CUBE_REFRESH_KEY_TIME
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`
    },
    Users: {
      relationship: `belongsTo`,
      sql: `TRIM(CONVERT(${CUBE.owner}, CHAR)) = TRIM(CONVERT(${Users._id}, CHAR))`
    }
  },

	preAggregations: {
    tasksRollUp: {
      sqlAlias: "tRollUp",
      external: true,
      scheduledRefresh: true,
      measures: [TasksCube.count],
      dimensions: [Tenants.tenantId, TasksCube.dueDate],
      refreshKey: {
        every: TASKS_CUBE_PRE_AGG_REFRESH_KEY_TIME
      },
    },
  },

  measures: {
    count: {
      type: `count`,
			drillMembers: [tasks, _id]
    }
  },

  dimensions: {
    tasks: {
      sql: `${CUBE}.\`id\``,
      type: `string`,
      title: `Task`
    },
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true
    },
    archived: {
      sql: `${CUBE}.\`archived\``,
      type: `boolean`,
      title: `archivedTasks`,
    },
		owner: {
      sql: `${CUBE}.\`user\``,
      type: `string`,
			title : `Owner`
    },
		tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`
    },
		dueDate: {
      type: `string`,
      case: {
        when: [
          {
            sql: `DATEDIFF(CURRENT_TIMESTAMP, ${CUBE}.\`dueDate\`) > 365`,
            label: `i18n_LBL_1_OVER_YEAR`
          },
          {
            sql: `DATEDIFF(CURRENT_TIMESTAMP, ${CUBE}.\`dueDate\`) > 30`,
            label: `i18n_LBL_2_OVER_MONTH`
          },
          {
            sql: `DATEDIFF(CURRENT_TIMESTAMP, ${CUBE}.\`dueDate\`) > 7`,
            label: `i18n_LBL_3_OVER_WEEK`
          },
          {
            sql: `DATEDIFF(CURRENT_TIMESTAMP, ${CUBE}.\`dueDate\`) > 1`,
            label: `i18n_LBL_4_OVER_DAY`
          }
        ]
      }
    }
  },

  dataSource: `default`
});
