const {
	securityContext: { userId },
} = COMPILE_CONTEXT;
import {
	regMapStatusCollection,
	mapUserCollection,
	risksCollection,
} from "./collections";
import { MY_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MyRisks`, {
	sql: `SELECT _id, status, tenantId FROM (SELECT _id as id, tenantId as tntId FROM ${risksCollection} WHERE ${risksCollection}.archived=0) as risk INNER JOIN (SELECT _id, status, tenantId FROM (SELECT srcObject as _id, tenantId FROM ${mapUserCollection} where ${mapUserCollection}.archived=0 AND ${mapUserCollection}.srcType="Risk" AND ${mapUserCollection}.user="${userId}")as userMap INNER JOIN (SELECT status, srcObject FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.archived=0 AND ${regMapStatusCollection}.srcType="Risk") as statusMap ON userMap._id=statusMap.srcObject) as mappedRisk ON mappedRisk._id=risk.id AND mappedRisk.tenantId=risk.tntId`,

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
			sql: `${CUBE.status} = ${RiskStatus.statusId} AND ${CUBE.tenantId} = ${RiskStatus.tenantId}`,
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
