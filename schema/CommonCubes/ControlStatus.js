const { securityContext } = COMPILE_CONTEXT;
import { controlByStatusCollection, regConfigCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`ControlStatus`, {
	sql: `SELECT _id, tenantId, statusId, statusName FROM (SELECT _id, tenantId FROM ${regConfigCollection}  WHERE ${regConfigCollection}.tenantId="${securityContext.tenantId}") as config INNER JOIN (SELECT _id as ID, \`status.control.id\` as statusId, \`status.control.name\` as statusName FROM ${controlByStatusCollection}) as controlConfig ON controlConfig.ID=config._id;`,

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
