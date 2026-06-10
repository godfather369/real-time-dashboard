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
	sql: `
		SELECT risk._id, statusMap.status, userMap.tenantId
		FROM ${risksCollection} AS risk
		INNER JOIN (
			SELECT srcObject AS _id, tenantId
			FROM ${mapUserCollection}
			WHERE ${mapUserCollection}.archived = 0
				AND ${mapUserCollection}.srcType = "Risk"
				AND ${mapUserCollection}.user = "${userId}"
		) AS userMap
			ON userMap._id = risk._id
		INNER JOIN (
			SELECT status, srcObject
			FROM ${regMapStatusCollection}
			WHERE ${regMapStatusCollection}.archived = 0
				AND ${regMapStatusCollection}.srcType = "Risk"
		) AS statusMap
			ON statusMap.srcObject = risk._id
		WHERE risk.archived = 0
			AND userMap.tenantId = risk.tenantId
	`,

	sqlAlias: `MyRiCube`,

	refreshKey: {
		every: MY_CUBE_REFRESH_KEY_TIME,
	},

	joins: {
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
