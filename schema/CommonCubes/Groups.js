import { groupCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`Groups`, {
	sql: `SELECT _id , name , tenantId FROM ${groupCollection} where ${groupCollection}.archived=0`,
	sqlAlias: `grps`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `belongsTo`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
	},

	measures: {
		count: {
			type: `count`,
			drillMembers: [ tenantId,  _id],
		},
	},

	dimensions: {
		_id: {
			sql: `${CUBE}.\`_id\``,
			type: `string`,
			primaryKey: true,
			shown: true,
		},
		name: {
			sql: `${CUBE}.\`name\``,
			type: `string`,
		},
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
	},

	dataSource: `default`,
});
