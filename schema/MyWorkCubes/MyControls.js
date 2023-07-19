import {
	controlsCollection,
	regMapStatusCollection,
	mapUserCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`MyControls`, {
	sql: `SELECT _id, status, user, tenantId FROM 
					(SELECT _id,status, tenantId FROM 
							(SELECT _id, tenantId from ${controlsCollection} where ${controlsCollection}.archived=0) AS controls INNER JOIN 
							(SELECT  srcObject, status, tenantId as tenant FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.archived=0 AND ${regMapStatusCollection}.srcType="Control")
					AS status ON status.srcObject=controls._id AND status.tenant=controls.tenantId) as mapStatus INNER JOIN
					(SELECT srcObject, user, tenantId as tnt FROM ${mapUserCollection} where ${mapUserCollection}.archived=0 AND ${mapUserCollection}.srcType="Control")
				as userMap ON mapStatus._id=userMap.srcObject AND mapStatus.tenantId=userMap.tnt`,

	sqlAlias: `MyConCube`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
		Users: {
			relationship: `belongsTo`,
			sql: `${CUBE.user} = ${Users._id}`,
		},
		ControlStatus: {
			relationship: `hasOne`,
			sql: `${CUBE.status} = ${ControlStatus.statusId} AND ${CUBE.tenantId} = ${ControlStatus.tenantId}`,
		},
	},

	// preAggregations: {
	// 	controlsRollUp: {
	// 		sqlAlias: "controlRP",
	// 		external: true,
	// 		measures: [MyControls.count],
	// 		dimensions: [MyControls.tenantId, ControlStatus.statusName, Users._id],
	// 		scheduledRefresh: true,
	// 		refreshKey: {
	// 			every: PRE_AGG_REFRESH_KEY_TIME,
	// 		},
	// 	},
	// },

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
		user: {
			sql: `${CUBE}.user`,
			type: `string`,
		},
	},

	dataSource: `default`,
});
