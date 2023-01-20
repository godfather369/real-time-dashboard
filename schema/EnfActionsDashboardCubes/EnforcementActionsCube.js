import {
	ENFORCEMENT_CUBE_REFRESH_KEY_TIME,
	ENFORCEMENT_CUBE_PRE_AGG_REFRESH_KEY,
} from "./cube-constants";
import { enforcementActionsCollection } from "./collections";

cube(`EnforcementActionsCube`, {
	sql: `SELECT *  FROM ${enforcementActionsCollection} where ${enforcementActionsCollection}.archived=0 `,

	sqlAlias: `eARep`,

	refreshKey: {
		every: `${ENFORCEMENT_CUBE_REFRESH_KEY_TIME}`,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
		Users: {
			relationship: `belongsTo`,
			sql: `TRIM(CONVERT(${CUBE.owner}, CHAR)) = TRIM(CONVERT(${Users._id}, CHAR))`,
		},
		HarmonizedActionTypeCube: {
			relationship: `hasMany`,
			sql: `${CUBE._id} = ${HarmonizedActionTypeCube._id}`,
		},
		RegulationsCube: {
			relationship: `hasMany`,
			sql: `${CUBE._id} = ${RegulationsCube._id}`,
		},
		EnforcementActionsAgencyNamesCube: {
			relationship: `belongsTo`,
			sql: `${CUBE._id} = ${EnforcementActionsAgencyNamesCube._id}`,
		},
	},

	measures: {
		count: {
			type: `count`,
			drillMembers: [tenantId],
		},
		netAmount: {
			sql: `COALESCE(${CUBE}.\`info.penaltyAmount.value\` + ${CUBE}.\`info.restitutionAmount.value\`, ${CUBE}.\`info.restitutionAmount.value\`, ${CUBE}.\`info.penaltyAmount.value\` , 0) `,
			type: `sum`,
		},
	},

	dimensions: {
		_id: {
			sql: `${CUBE}.\`_id\``,
			type: `string`,
			primaryKey: true,
		},
		effectiveDate: {
			sql: `${CUBE}.\`effectiveDate\``,
			type: `time`,
		},
		currency: {
			sql: `${CUBE}.\`info.penaltyAmount.currency\``,
			type: `string`,
			title: `currency`,
		},
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
	},
});
