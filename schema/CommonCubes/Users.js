import { userCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`Users`, {
	sql: `SELECT _id , fullName , tenantId FROM ${userCollection} where ${userCollection}.archived=0`,
	sqlAlias: `usrs`,

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
			drillMembers: [fullName, tenantId, _id],
		},
	},

	dimensions: {
		_id: {
			sql: `${CUBE}.\`_id\``,
			type: `string`,
			primaryKey: true,
			shown: true,
		},
		fullName: {
			sql: `${CUBE}.\`fullName\``,
			type: `string`,
		},
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
	},

	dataSource: `default`,
});
