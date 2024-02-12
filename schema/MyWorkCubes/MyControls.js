const {
	securityContext: { userId },
} = COMPILE_CONTEXT;

import {
	regMapStatusCollection,
	mapUserCollection,
	controlsCollection,
} from "./collections";
import { MY_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MyControls`, {
	sql: `SELECT _id, status, tenantId FROM (SELECT _id as id, tenantId as tntId FROM ${controlsCollection} WHERE ${controlsCollection}.archived=0) as control INNER JOIN (SELECT _id, status, tenantId FROM (SELECT srcObject as _id, tenantId FROM ${mapUserCollection} where ${mapUserCollection}.archived=0 AND ${mapUserCollection}.srcType="Control" AND ${mapUserCollection}.user="${userId}")as userMap INNER JOIN (SELECT status, srcObject FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.archived=0 AND ${regMapStatusCollection}.srcType="Control") as statusMap ON userMap._id=statusMap.srcObject) as mappedControl ON mappedControl._id=control.id AND mappedControl.tenantId=control.tntId`,

	sqlAlias: `MyConCube`,

	refreshKey: {
		every: MY_CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
		ControlStatus: {
			relationship: `hasOne`,
			sql: `${CUBE.status} = ${ControlStatus.statusId} AND ${CUBE.tenantId} = ${ControlStatus.tenantId}`,
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
