import { risksByStatusCollection, regConfigCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`RiskStatus`, {
  sql: `
		SELECT config._id, config.tenantId, riskConfig.statusId, riskConfig.statusName
		FROM ${regConfigCollection} AS config
		INNER JOIN (
			SELECT _id AS ID, \`status.risk.id\` AS statusId, \`status.risk.name\` AS statusName
			FROM ${risksByStatusCollection}
		) AS riskConfig
			ON riskConfig.ID = config._id
	`,

  sqlAlias: `RiSt`,

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
