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
	sql: `
		SELECT control._id, statusMap.status, userMap.tenantId
		FROM ${controlsCollection} AS control
		INNER JOIN (
			SELECT srcObject AS _id, tenantId
			FROM ${mapUserCollection}
			WHERE ${mapUserCollection}.archived = 0
				AND ${mapUserCollection}.srcType = "Control"
				AND ${mapUserCollection}.user = "${userId}"
		) AS userMap
			ON userMap._id = control._id
		INNER JOIN (
			SELECT status, srcObject
			FROM ${regMapStatusCollection}
			WHERE ${regMapStatusCollection}.archived = 0
				AND ${regMapStatusCollection}.srcType = "Control"
		) AS statusMap
			ON statusMap.srcObject = control._id
		WHERE control.archived = 0
			AND userMap.tenantId = control.tenantId
	`,

	sqlAlias: `MyConCube`,

	refreshKey: {
		every: MY_CUBE_REFRESH_KEY_TIME,
	},

	joins: {
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
