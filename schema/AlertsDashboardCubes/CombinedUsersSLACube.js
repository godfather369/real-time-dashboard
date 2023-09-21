import {
	alertsCollection,
	regMapGenericCollection,
	impactAssessmentCollection,
	impactAssessmentOwnersCollection,
	alertsUsersCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`combinedOwnersSLA`, {
	sql: `SELECT * FROM 
	(SELECT srcObject as _id, owners, status, created, tenantId, impactStatus FROM
		(SELECT _id, owners, impactStatus, tenantId, srcObject FROM
			((SELECT _id, owners,impactStatus, tenantId FROM
				(SELECT _id, owners FROM ${impactAssessmentOwnersCollection}) AS impactOwners INNER JOIN
				(SELECT _id AS impactId, status AS impactStatus, tenantId FROM ${impactAssessmentCollection} WHERE ${impactAssessmentCollection}.archived=0) AS impacts ON impacts.impactId= impactOwners._id)) as ownerImpacts INNER JOIN
			(SELECT srcObject, destObject, tenantId as tntId FROM ${regMapGenericCollection} WHERE ${regMapGenericCollection}.archived=0  AND ${regMapGenericCollection}.destType="ImpactAssessment" AND ${regMapGenericCollection}.srcType="Alert") as maps ON ownerImpacts._id=maps.destObject AND ownerImpacts.tenantId=maps.tntId) as mappedImpacts INNER JOIN
		((SELECT alertId, status, created, tentId FROM 
			(SELECT _id as alertOwnerId, owners as alertOwner FROM ${alertsUsersCollection}) as alertOwners INNER JOIN
			(SELECT _id as alertId, status, created, tenantId as tentId FROM ${alertsCollection} WHERE ${alertsCollection}.archived=0) as alerts ON alerts.alertId=alertOwners.alertOwnerId)) as ownerAlerts ON mappedImpacts.srcObject=ownerAlerts.alertId AND  mappedImpacts.tenantId=ownerAlerts.tentId) AS impactedAlerts UNION
	SELECT _id, owners, status, created, tenantId, "No" as impactStatus FROM
	(SELECT _id, owners, status, created, tenantId, destObject FROM
		((SELECT _id, owners, status, created, tenantId FROM 
			(SELECT _id, owners FROM ${alertsUsersCollection}) as owners INNER JOIN
			(SELECT _id as alertId, status, created, tenantId FROM ${alertsCollection} WHERE ${alertsCollection}.archived=0) as alerts ON alerts.alertID=owners._id)) as ownerAlerts LEFT JOIN
		(SELECT srcObject, destObject, tenantId as tntId FROM ${regMapGenericCollection} WHERE ${regMapGenericCollection}.archived=0  AND ${regMapGenericCollection}.destType="ImpactAssessment" AND ${regMapGenericCollection}.srcType="Alert") as maps ON maps.srcObject=ownerAlerts._id AND maps.tntId=ownerAlerts.tenantId) as mappedAlerts where ISNULL(mappedAlerts.destObject)=1`,

	sqlAlias: `comSLA`,

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
			sql: `TRIM(CONVERT(${CUBE.owners}, CHAR)) = TRIM(CONVERT(${Users._id}, CHAR))`,
		},
	},

	preAggregations: {
		comUsSLARollUp: {
			sqlAlias: "comUsRP",
			type: `rollup`,
			external: true,
			scheduledRefresh: true,
			measures: [
				combinedOwnersSLA.openOpen,
				combinedOwnersSLA.openClosed,
				combinedOwnersSLA.openMissing,
				combinedOwnersSLA.closedOpen,
				combinedOwnersSLA.closedClosed,
				combinedOwnersSLA.closedMissing,
				combinedOwnersSLA.open,
				combinedOwnersSLA.closed,
			],
			dimensions: [Users._id, Users.fullName, Tenants.tenantId],
			timeDimension: combinedOwnersSLA.created,
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
		openOpen: {
			type: `count`,
			filters: [
				{
					sql: `(${CUBE}.status = 'Unread' OR ${CUBE}.status = 'In Process') AND (${CUBE}.impactStatus = 'New' OR ${CUBE}.impactStatus = 'In Process')`,
				},
			],
		},
		openClosed: {
			type: `count`,
			filters: [
				{
					sql: `(${CUBE}.status = 'Unread' OR ${CUBE}.status = 'In Process') AND (${CUBE}.impactStatus = 'Closed')`,
				},
			],
		},
		openMissing: {
			type: `count`,
			filters: [
				{
					sql: `(${CUBE}.status = 'Unread' OR ${CUBE}.status = 'In Process') AND (${CUBE}.impactStatus = 'No')`,
				},
			],
		},
		closedOpen: {
			type: `count`,
			filters: [
				{
					sql: `(${CUBE}.status = 'Excluded' OR ${CUBE}.status = 'Following' OR ${CUBE}.status = 'Applicable') AND (${CUBE}.impactStatus = 'New' OR ${CUBE}.impactStatus = 'In Process')`,
				},
			],
		},
		closedClosed: {
			type: `count`,
			filters: [
				{
					sql: `(${CUBE}.status = 'Excluded' OR ${CUBE}.status = 'Following' OR ${CUBE}.status = 'Applicable') AND (${CUBE}.impactStatus = 'Closed')`,
				},
			],
		},
		closedMissing: {
			type: `count`,
			filters: [
				{
					sql: `(${CUBE}.status = 'Excluded' OR ${CUBE}.status = 'Following' OR ${CUBE}.status = 'Applicable') AND (${CUBE}.impactStatus = 'No')`,
				},
			],
		},
		open: {
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.status = 'Unread' OR ${CUBE}.status = 'In Process'`,
				},
			],
		},
		closed: {
			type: `count`,
			filters: [
				{
					sql: `${CUBE}.status = 'Excluded' OR ${CUBE}.status = 'Following' OR ${CUBE}.status = 'Applicable'`,
				},
			],
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
		impactStatus: {
			sql: `${CUBE}.\`impactStatus\``,
			type: `string`,
		},
		owners: {
			sql: `${CUBE}.\`owners\``,
			type: `string`,
			title: `owners`,
		},
		created: {
			sql: `${CUBE}.\`created\``,
			type: `time`,
		},
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
	},
	dataSource: `default`,
});
