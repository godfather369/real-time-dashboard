import {
	alertsCollection,
	alertsGroupsCollection,
	groupCollection,
} from "./collections";
import {
	ALERT_CUBE_REFRESH_KEY_TIME,
	ALERT_CUBE_PRE_AGG_REFRESH_KEY_WORKFLOW,
} from "./cube-constants";

cube(`AlertsByGroupsCube`, {
	sql: `SELECT * FROM 
	(SELECT * FROM (SELECT _id,publishedDate,status,created,tenantId,alertCategory FROM ${alertsCollection} WHERE ${alertsCollection}.archived=0) 
		as alerts INNER JOIN 
	(SELECT _id as Id , groups FROM ${alertsGroupsCollection}) 
	as groupIds on alerts._id = groupIds.Id  )
		as alertsGroupCube
	 INNER JOIN (SELECT _id as grpId , name FROM ${groupCollection}) 
		as groups on alertsGroupCube.groups = groups.grpId`,

	sqlAlias: `AlGrpCube`,

	refreshKey: {
		every: ALERT_CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
	},

	preAggregations: {
		alertsByGroupssRollUp: {
			sqlAlias: "alByGrpsRP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
				AlertsByGroupsCube.unread,
				AlertsByGroupsCube.applicable,
				AlertsByGroupsCube.inProcess,
				AlertsByGroupsCube.following,
				AlertsByGroupsCube.totalCount,
			],
			dimensions: [
				Tenants.tenantId,
				AlertsByGroupsCube.name,
				AlertsByGroupsCube.grpId,
				AlertsByGroupsCube.alertCategory,
			],
			timeDimension: AlertsByGroupsCube.publishedDate,
			granularity: `day`,
			buildRangeStart: {
				sql: `SELECT NOW() - interval '365 day'`,
			},
			buildRangeEnd: {
				sql: `SELECT NOW()`,
			},
			refreshKey: {
				every: ALERT_CUBE_PRE_AGG_REFRESH_KEY_WORKFLOW,
			},
		},
		alertGroupNameRollUp: {
			sqlAlias: "alByGrpsName",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			dimensions: [
				Tenants.tenantId,
				AlertsByGroupsCube.name,
				AlertsByGroupsCube.grpId,
			],
			buildRangeStart: {
				sql: `SELECT NOW() - interval '365 day'`,
			},
			buildRangeEnd: {
				sql: `SELECT NOW()`,
			},
			refreshKey: {
				every: ALERT_CUBE_PRE_AGG_REFRESH_KEY_WORKFLOW,
			},
		},
		alertsGroupApplicabilityRollUp: {
			sqlAlias: "alGByAppRP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
				AlertsByGroupsCube.unread,
				AlertsByGroupsCube.applicable,
				AlertsByGroupsCube.inProcess,
				AlertsByGroupsCube.following,
				AlertsByGroupsCube.excluded,
				AlertsByGroupsCube.open,
				AlertsByGroupsCube.closed,
				AlertsByGroupsCube.totalCount,
			],
			dimensions: [
				Tenants.tenantId,
				AlertsByGroupsCube.grpId,
				AlertsByGroupsCube.name,
			],
			timeDimension: AlertsByGroupsCube.created,
			granularity: `day`,
			buildRangeStart: {
				sql: `SELECT NOW() - interval '365 day'`,
			},
			buildRangeEnd: {
				sql: `SELECT NOW()`,
			},
			refreshKey: {
				every: ALERT_CUBE_PRE_AGG_REFRESH_KEY_WORKFLOW,
			},
		},
	},

	measures: {
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
			filters: [{ sql: `${CUBE}.status =  'Applicable'` }],
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
			filters: [{ sql: `${CUBE}.status =  'Following'` }],
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
			sql: `${unread} + ${applicable} + ${inProcess}+ ${following}`,
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
		grpId: {
			sql: `${CUBE}.\`grpId\``,
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
		groups: {
			sql: `groups`,
			type: `string`,
			title: `groups`,
		},
		name: {
			sql: `name`,
			type: `string`,
			title: `names`,
		},
	},

	dataSource: `default`,
});
