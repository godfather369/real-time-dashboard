import { alertsByStatusCollection, regConfigCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`AlertStatusCube`, {
  sql: `
		SELECT
			CONCAT(config.tenantId, '-', regChangeConfig.statusId) AS _id,
			config.tenantId,
			regChangeConfig.statusId,
			regChangeConfig.statusName,
			regChangeConfig.active,
			regChangeConfig.isTerminal,
			regChangeConfig.isExcluded,
			regChangeConfig.isFollowing,
			regChangeConfig.actionRequired,
			regChangeConfig.class
		FROM ${regConfigCollection} AS config
		INNER JOIN (
			SELECT
				_id AS configId,
				\`status.regChange.id\` AS statusId,
				\`status.regChange.name\` AS statusName,
				\`status.regChange.active\` AS active,
				\`status.regChange.isTerminal\` AS isTerminal,
				\`status.regChange.isExcluded\` AS isExcluded,
				\`status.regChange.actionRequired\` AS actionRequired,
				\`status.regChange.meta.isFollowing\` AS isFollowing,
				\`status.regChange.class\` AS class
			FROM ${alertsByStatusCollection}
		) AS regChangeConfig
			ON regChangeConfig.configId = config._id
		GROUP BY config.tenantId, regChangeConfig.statusId, regChangeConfig.statusName,
			regChangeConfig.active, regChangeConfig.isTerminal, regChangeConfig.isExcluded,
			regChangeConfig.isFollowing, regChangeConfig.actionRequired, regChangeConfig.class
	`,

  sqlAlias: `AlSt`,

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
    class: {
      sql: `${CUBE}.\`class\``,
      type: `string`,
    },
    active: {
      sql: `${CUBE}.\`active\``,
      type: `boolean`,
    },
    isTerminal: {
      sql: `${CUBE}.\`isTerminal\``,
      type: `boolean`,
    },
    isExcluded: {
      sql: `${CUBE}.\`isExcluded\``,
      type: `boolean`,
    },
    isFollowing: {
      sql: `${CUBE}.\`isFollowing\``,
      type: `boolean`,
    },
  },

  dataSource: `default`,
});
