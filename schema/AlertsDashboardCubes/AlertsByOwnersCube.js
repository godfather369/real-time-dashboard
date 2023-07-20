import { alertsCollection, alertsUsersCollection } from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`AlertsByOwnersCube`, {
	sql: `SELECT * FROM (SELECT _id, status, tenantId, publishedDate, created, alertCategory, \`info.docStatus\` as docStatus  FROM ${alertsCollection} where ${alertsCollection}.archived=0) as alerts INNER JOIN 
	(SELECT _id as Id , owners FROM ${alertsUsersCollection}) as ownerIds ON alerts._id = ownerIds.Id`,

	sqlAlias: `AlOwCube`,

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
			sql: `${CUBE.owners} = ${Users._id}`,
		},
	},

	preAggregations: {
		alertsByUsersRollUp: {
			sqlAlias: "alByUsrsRP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
				AlertsByOwnersCube.unread,
				AlertsByOwnersCube.applicable,
				AlertsByOwnersCube.following,
				AlertsByOwnersCube.inProcess,
				AlertsByOwnersCube.totalCount,
			],
			dimensions: [
				Tenants.tenantId,
				Users.fullName,
				Users._id,
				AlertsByOwnersCube.alertCategory,
			],
			timeDimension: AlertsByOwnersCube.publishedDate,
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
		alertsOwnersRollUp: {
			sqlAlias: "alByAppRP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
				AlertsByOwnersCube.unread,
				AlertsByOwnersCube.applicable,
				AlertsByOwnersCube.following,
				AlertsByOwnersCube.inProcess,
				AlertsByOwnersCube.totalCount,
				AlertsByOwnersCube.open,
				AlertsByOwnersCube.closed,
				AlertsByOwnersCube.excluded,
			],
			dimensions: [Tenants.tenantId, Users.fullName, Users._id, AlertsByOwnersCube.docStatus],
			timeDimension: AlertsByOwnersCube.created,
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
		open: {
			sql: `${unread} +${inProcess}`,
			type: `number`,
			title: "open",
		},
		closed: {
			sql: `${following} +${applicable} + ${excluded}`,
			type: `number`,
			title: "closed",
		},
		totalCount: {
			sql: `${unread} + ${applicable} + ${inProcess} +${following}`,
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
		created: {
			sql: `${CUBE}.\`created\``,
			type: `time`,
		},
		alertCategory: {
			sql: `${CUBE}.\`alertCategory\``,
			type: `string`,
			title: `Alert Category`,
		},
		owners: {
			sql: `owners`,
			type: `string`,
			title: `owners`,
		},
		docStatus: {
			sql: `${CUBE}.\`docStatus\``,
			type: `string`,
			title: `Doc Status`,
		},
	},

	dataSource: `default`,
});
