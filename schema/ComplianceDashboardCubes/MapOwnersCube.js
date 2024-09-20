import {
	risksCollection,
	tasksCollection,
	controlsCollection,
	requirementsCollection,
	mapUserCollection,
} from "./collections";
import {
	CUBE_REFRESH_KEY_TIME,
	PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`MapOwnersCube`, {
	sql: `
  SELECT * FROM 
  (SELECT _id, owner AS user, tenantId, 'Task' AS type
  FROM ${tasksCollection} WHERE ${tasksCollection}.archived=0 union all
  SELECT _id, user, tenantId, type FROM (SELECT _id,tenantId,'Risk' AS type FROM ${risksCollection} WHERE ${risksCollection}.archived=0) AS Risks INNER JOIN (SELECT user, srcObject FROM ${mapUserCollection} WHERE ${mapUserCollection}.srcType="Risk" AND ${mapUserCollection}.archived=0) as mapUser ON Risks._id= mapUser.srcObject union all
  SELECT _id, user, tenantId, type FROM (SELECT _id,tenantId,'Requirement' AS type FROM ${requirementsCollection} WHERE ${requirementsCollection}.archived=0) AS Requirements INNER JOIN (SELECT user, srcObject FROM ${mapUserCollection} WHERE ${mapUserCollection}.srcType="Requirement" AND ${mapUserCollection}.archived=0) as mapUser ON Requirements._id= mapUser.srcObject union all
  SELECT _id, user, tenantId, type FROM (SELECT _id,tenantId,'Control' AS type FROM ${controlsCollection} WHERE ${controlsCollection}.archived=0) AS Controls INNER JOIN (SELECT user, srcObject FROM ${mapUserCollection} WHERE ${mapUserCollection}.srcType="Control" AND ${mapUserCollection}.archived=0) as mapUser ON Controls._id= mapUser.srcObject
  ) as MapOwners
 `,

	sqlAlias: `MapOwCube`,

	refreshKey: {
		every: CUBE_REFRESH_KEY_TIME,
	},

	joins: {
		Users: {
			relationship: `belongsTo`,
			sql: `${CUBE.owner} = ${Users._id}`,
		},
		Tenants: {
			relationship: `hasOne`,
			sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
		},
	},

	preAggregations: {
		ownersRollUp: {
			sqlAlias: `oRollUp`,
			external: true,
			scheduledRefresh: true,
			measures: [
				MapOwnersCube.controlCount,
				MapOwnersCube.riskCount,
				MapOwnersCube.taskCount,
				MapOwnersCube.requirementCount,
				MapOwnersCube.total,
			],
			dimensions: [Tenants.tenantId, Users.fullName, Users._id],
			refreshKey: {
				every: PRE_AGG_REFRESH_KEY_TIME,
			},
		},
	},

	measures: {
		total: {
			type: `count`,
			drillMembers: [tenantId],
		},
		taskCount: {
			type: `count`,
			filters: [{ sql: `${CUBE}.type = 'Task'` }],
		},
		riskCount: {
			type: `count`,
			filters: [{ sql: `${CUBE}.type = 'Risk'` }],
		},
		controlCount: {
			type: `count`,
			filters: [{ sql: `${CUBE}.type = 'Control'` }],
		},
		requirementCount: {
			type: `count`,
			filters: [{ sql: `${CUBE}.type = 'Requirement'` }],
		},
	},

	dimensions: {
		_id: {
			sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
			type: `string`,
			primaryKey: true,
		},
		owner: {
			sql: `${CUBE}.\`user\``,
			type: `string`,
			title: `Owner`,
		},
		tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
			title: `tenant Id`,
		},
		type: {
			sql: `${CUBE}.\`type\``,
			type: `string`,
			title: `Item type`,
		},
	},

	dataSource: `default`,
});
