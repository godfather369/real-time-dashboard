import { alertsCollection, agencyMapCollection } from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`AlertsByAgencyCube`, {
	sql: `SELECT * FROM (SELECT _id, status, tenantId, publishedDate, alertCategory  FROM ${alertsCollection} where ${alertsCollection}.archived=0) as alerts INNER JOIN 
	(SELECT _id as Id , agencyMap FROM ${agencyMapCollection}) as agencies ON alerts._id = agencies.Id`,

	sqlAlias: `AlAgCube`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
		Agency: {
			relationship: `belongsTo`,
			sql: `${CUBE.agencyMap} = ${Agency._id}`,
		},
	},

	preAggregations: {
		alertsByAgenciesRollUp: {
			sqlAlias: "alByAgRP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
				AlertsByAgencyCube.unread,
				AlertsByAgencyCube.applicable,
				AlertsByAgencyCube.following,
				AlertsByAgencyCube.duplicate,
				AlertsByAgencyCube.inProcess,
				AlertsByAgencyCube.totalCount,
			],
			dimensions: [
				Tenants.tenantId,
				AlertsByAgencyCube.alertCategory,
				AlertsByAgencyCube.agencyMap,
				Agency.agencyNames,
				Agency.shortCode,
			],
			timeDimension: AlertsByAgencyCube.publishedDate,
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
		count: {
			type: `count`,
			drillMembers: [_id],
		},
		unread: {
			type: `count`,
			sql: `status`,
			title: `unread`,
			filters: [{ sql: `${CUBE}.status = 'Unread'` }],
		},
		excluded: {
			type: `count`,
			sql: `status`,
			title: `excluded`,
			filters: [{ sql: `${CUBE}.status = 'Excluded'` }],
		},
		applicable: {
			type: `count`,
			sql: `status`,
			title: `Applicable`,
			filters: [{ sql: `${CUBE}.status = 'Applicable'` }],
		},
		inProcess: {
			type: `count`,
			sql: `status`,
			title: `inProcess`,
			filters: [{ sql: `${CUBE}.status = 'In Process'` }],
		},
		following: {
			type: `count`,
			sql: `status`,
			title: `Following`,
			filters: [{ sql: `${CUBE}.status = 'Following'` }],
		},
		duplicate: {
			type: `count`,
			sql: `status`,
			title: `Duplicate`,
			filters: [{ sql: `${CUBE}.status = 'Duplicate'` }],
		},
		totalCount: {
			sql: `${unread} + ${applicable} + ${inProcess} +${following} + ${duplicate}`,
			type: `number`,
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
		agencyMap: {
			sql: `agencyMap`,
			type: `string`,
			title: `agencyMap`,
		},
	},

	dataSource: `default`,
});
