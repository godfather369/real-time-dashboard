const { securityContext } = COMPILE_CONTEXT;
import { risksByStatusCollection, regConfigCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`RiskStatus`, {
	sql: `SELECT _id, tenantId, statusId, statusName FROM (SELECT _id, tenantId FROM ${regConfigCollection} WHERE ${regConfigCollection}.tenantId="${securityContext.tenantId}") as config INNER JOIN (SELECT _id as ID, \`status.risk.id\` as statusId, \`status.risk.name\` as statusName FROM ${risksByStatusCollection}) as riskConfig ON riskConfig.ID=config._id;`,

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
