import { alertsCollection, alertMDIDCollection } from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`AlertsByTopic`, {
	sql: `SELECT * FROM (SELECT _id, status, tenantId, publishedDate, alertCategory  FROM ${alertsCollection} where ${alertsCollection}.archived=0) as alerts INNER JOIN 
	(SELECT _id as Id ,  \`mdInfo._id\` as MDiD, \`mdInfo.name\` as MDName FROM ${alertMDIDCollection}) as TopicIds ON alerts._id = TopicIds.Id`,

	sqlAlias: `AlTopCube`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
	},

	preAggregations: {
		alertsByTopicRollUp: {
			sqlAlias: "alByTopRP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [AlertsByTopic.totalCount],
			dimensions: [
				Tenants.tenantId,
				AlertsByTopic.MDName,
				AlertsByTopic.MDiD,
				AlertsByTopic.alertCategory,
			],
			timeDimension: AlertsByTopic.publishedDate,
			granularity: `day`,
			buildRangeStart: {
				sql: `SELECT NOW() - interval '365 day'`,
			},
			buildRangeEnd: {
				sql: `SELECT NOW()`,
			},
			refreshKey: {
				every: PRE_AGG_REFRESH_KEY_TIME,
			},
		},
	},

	measures: {
		totalCount: {
			sql: `status`,
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.status != "Excluded" `,
				},
			],
			title: "totalCount",
		},
	},

	dimensions: {
		_id: {
			sql: `${CUBE}.\`_id\``,
			type: `string`,
			primaryKey: true,
		},
		status: {
			sql: `${CUBE}.\`status\``,
			type: `string`,
		},
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
		publishedDate: {
			sql: `${CUBE}.\`publishedDate\``,
			type: `time`,
		},
		alertCategory: {
			sql: `${CUBE}.\`alertCategory\``,
			type: `string`,
			title: `Alert Category`,
		},
		MDName: {
			sql: `${CUBE}.\`MDName\``,
			type: `string`,
			title: `MDName`,
		},
		MDiD: {
			sql: `CONVERT(${CUBE}.\`MDiD\`,CHAR)`,
			type: `string`,
			title: `MD Id`,
		},
	},

	dataSource: `default`,
});
