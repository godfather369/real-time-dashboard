import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { risksByStatusCollection } from "./collections";

cube(`RisksByStatusCube`, {
	sql: `SELECT * FROM ${risksByStatusCollection} WHERE ${risksByStatusCollection}.\`status.risk._id\` IS NOT NULL `,

	sqlAlias: `RisByStatCube`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	dimensions: {
		riskStatus: {
			sql: `${CUBE}.\`status.risk.name\``,
			type: `string`,
			title: `Status`,
		},
		riskId: {
			sql: `${CUBE}.\`status.risk.id\``,
			type: `string`,
			primaryKey: true,
			shown: true,
		},
		_id: {
			sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
			type: `string`,
		},
	},
	dataSource: `default`,
});
