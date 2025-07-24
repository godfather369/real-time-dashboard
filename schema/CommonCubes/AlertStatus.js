import { alertsByStatusCollection, regConfigCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`AlertStatusCube`, {
  sql: `
		SELECT 
			_id, 
			tenantId, 
			statusId, 
			statusName,
            active,
            isTerminal,
            isExcluded,
            isFollowing,
            class 
		FROM (
			SELECT 
				_id, 
				tenantId 
			FROM ${regConfigCollection}
		) as config 
		INNER JOIN (
			SELECT 
				_id as configId, 
				\`status.regChange.id\` as statusId, 
				\`status.regChange.name\` as statusName,
				\`status.regChange.active\` as active, 
				\`status.regChange.isTerminal\` as isTerminal, 
				\`status.regChange.isExcluded\` as isExcluded,
				\`status.regChange.meta.isFollowing\` as isFollowing,
				\`status.regChange.class\` as class
			FROM ${alertsByStatusCollection}
		) as regChangeConfig 
		ON regChangeConfig.configId = config._id;
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
