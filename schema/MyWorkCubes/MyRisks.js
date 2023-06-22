import {
	risksCollection,
	regMapStatusCollection,
	mapUserCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`MyRisks`, {
	sql: `SELECT _id, status, user, tenantId FROM 
	(SELECT _id,status, tenantId FROM 
		(SELECT _id, tenantId from ${risksCollection} where ${risksCollection}.archived=0) AS risks 
        LEFT JOIN (SELECT  srcObject, status FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.archived=0 AND ${regMapStatusCollection}.srcType="Risk") AS status 
        ON status.srcObject=risks._id) as mapStatus INNER JOIN
	(SELECT srcObject, user FROM ${mapUserCollection} where ${mapUserCollection}.archived=0 AND ${mapUserCollection}.srcType="Risk") as userMap 
        ON mapStatus._id=userMap.srcObject`,

	sqlAlias: `MyRiCube`,

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
		RisksByStatusCube: {
			relationship: `hasOne`,
			sql: `${CUBE.status} = ${RisksByStatusCube.riskId}`,
		},
	},

	preAggregations: {
		risksRollUp: {
			sqlAlias: "riskRP",
			external: true,
			measures: [MyRisks.count],
			dimensions: [MyRisks.tenantId, RisksByStatusCube.riskStatus, Users._id],
			scheduledRefresh: true,
			refreshKey: {
				every: PRE_AGG_REFRESH_KEY_TIME,
			},
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
		user: {
			sql: `${CUBE}.user`,
			type: `string`,
		},
	},

	dataSource: `default`,
});
