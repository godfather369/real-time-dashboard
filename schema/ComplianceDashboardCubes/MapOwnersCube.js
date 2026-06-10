import {
  risksCollection,
  tasksCollection,
  controlsCollection,
  requirementsCollection,
  mapUserCollection,
  tasksOwnersCollection,
} from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`MapOwnersCube`, {
  sql: `
		SELECT TaskOwner._id, TaskOwner.owners AS user, task.tenantId, 'Task' AS type
		FROM ${tasksOwnersCollection} AS TaskOwner
		INNER JOIN ${tasksCollection} AS task
			ON task._id = TaskOwner._id
			AND task.archived = 0

		UNION ALL

		SELECT Risks._id, mapUser.user, Risks.tenantId, 'Risk' AS type
		FROM ${risksCollection} AS Risks
		INNER JOIN (
			SELECT user, srcObject
			FROM ${mapUserCollection}
			WHERE ${mapUserCollection}.srcType = "Risk"
				AND ${mapUserCollection}.archived = 0
		) AS mapUser
			ON Risks._id = mapUser.srcObject
		WHERE Risks.archived = 0

		UNION ALL

		SELECT Requirements._id, mapUser.user, Requirements.tenantId, 'Requirement' AS type
		FROM ${requirementsCollection} AS Requirements
		INNER JOIN (
			SELECT user, srcObject
			FROM ${mapUserCollection}
			WHERE ${mapUserCollection}.srcType = "Requirement"
				AND ${mapUserCollection}.archived = 0
		) AS mapUser
			ON Requirements._id = mapUser.srcObject
		WHERE Requirements.archived = 0

		UNION ALL

		SELECT Controls._id, mapUser.user, Controls.tenantId, 'Control' AS type
		FROM ${controlsCollection} AS Controls
		INNER JOIN (
			SELECT user, srcObject
			FROM ${mapUserCollection}
			WHERE ${mapUserCollection}.srcType = "Control"
				AND ${mapUserCollection}.archived = 0
		) AS mapUser
			ON Controls._id = mapUser.srcObject
		WHERE Controls.archived = 0
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
      dimensions: [MapOwnersCube.tenantId, Users.fullName, Users._id],
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
