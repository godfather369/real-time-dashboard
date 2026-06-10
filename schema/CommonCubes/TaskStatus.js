import { tasksByStatusCollection, regConfigCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`TaskStatus`, {
  sql: `
		SELECT config._id, config.tenantId, taskConfig.statusId, taskConfig.statusName
		FROM ${regConfigCollection} AS config
		INNER JOIN (
			SELECT _id AS ID, \`status.task.id\` AS statusId, \`status.task.name\` AS statusName
			FROM ${tasksByStatusCollection}
		) AS taskConfig
			ON taskConfig.ID = config._id
	`,

  sqlAlias: `TaSt`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
    statusId: {
      sql: `${CUBE}.\`statusId\``,
      type: `string`,
    },
    statusName: {
      sql: `${CUBE}.\`statusName\``,
      type: `string`,
    },
  },

  dataSource: `default`,
});
