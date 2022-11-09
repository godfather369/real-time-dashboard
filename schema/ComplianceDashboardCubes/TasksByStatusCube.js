import { TASK_STATUS_CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { tasksByStatusCollection } from "./collections"

cube(`TasksByStatusCube`, {
  sql: `SELECT * FROM ${tasksByStatusCollection}`,

  sqlAlias :`TskStatCube`,
  
  refreshKey: {
    every: TASK_STATUS_CUBE_REFRESH_KEY_TIME
  },

  dimensions: {
    taskStatus: {
      sql: `${CUBE}.\`status.task.name\``,
      type: `string`,
      title: `Status`
    },
    taskId: {
      sql: `${CUBE}.\`status.task.id\``,
      type: `string`,
      primaryKey: true,
      shown: true
    },
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`
    }
  },

  dataSource: `default`
});
