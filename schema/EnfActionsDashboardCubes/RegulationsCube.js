import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { regulationsCollection } from "./collections";

cube(`RegulationsCube`, {
	sql: `SELECT \`info.regulations.title\`, \`info.regulations.document_number\`, _id, \`info.regulations._id\` FROM ${regulationsCollection}`,
	sqlAlias: `ReglCube`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	measures: {
		count: {
			type: `count`,
			drillMembers: [authoritativeDocuments, _id],
		},
	},

	dimensions: {
		authoritativeDocuments: {
			sql: `${CUBE}.\`info.regulations.title\``,
			type: `string`,
			title: `AuthoritativeDocuments`,
		},
		citations: {
			sql: `${CUBE}.\`info.regulations.document_number\``,
			type: `string`,
			title: `Citations`,
		},
		_id: {
			sql: `${CUBE}._id`,
			type: `string`,
			primaryKey: true,
		},
		id: {
			sql: `${CUBE}.\`info.regulations._id\``,
			type: `string`,
			title: `id`,
		},
	},

	dataSource: `default`,
});
