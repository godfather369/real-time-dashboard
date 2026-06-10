import { controlByStatusCollection, regConfigCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`ControlStatus`, {
  sql: `
		SELECT config._id, config.tenantId, controlConfig.statusId, controlConfig.statusName
		FROM ${regConfigCollection} AS config
		INNER JOIN (
			SELECT _id AS ID, \`status.control.id\` AS statusId, \`status.control.name\` AS statusName
			FROM ${controlByStatusCollection}
		) AS controlConfig
			ON controlConfig.ID = config._id
	`,

  sqlAlias: `CoSt`,

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
