const {
	securityContext
} = COMPILE_CONTEXT;
import { regMapStatusCollection, mapUserCollection } from "./collections";
import { MY_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MyRisks`, {
	sql: `SELECT _id, status, tenantId FROM (SELECT srcObject as _id, tenantId FROM ${mapUserCollection} where ${mapUserCollection}.srcType="Risk" AND ${mapUserCollection}.user="${securityContext.userId}" AND ${mapUserCollection}.tenantId="${securityContext.tenantId}")as userMap INNER JOIN (SELECT status, srcObject FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.srcType="Risk" AND ${regMapStatusCollection}.tenantId="${securityContext.tenantId}") as statusMap ON userMap._id=statusMap.srcObject`,

	sqlAlias: `MyRiCube`,

	refreshKey: {
		every: MY_CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
		RiskStatus: {
			relationship: `hasOne`,
			sql: `${CUBE.status} = ${RiskStatus.statusId}`,
		},
	},

	measures: {
		count: {
			type: `count`,
			drillMembers: [_id],
		},
	},

	dimensions: {
		_id: {
			sql: `${CUBE}._id`,
			type: `string`,
			primaryKey: true,
		},
		status: {
			sql: `${CUBE}.status`,
			type: `string`,
		},
		tenantId: {
			sql: `${CUBE}.tenantId`,
			type: `string`,
		},
	},

	dataSource: `default`,
});
