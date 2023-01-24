import { MAP_OWNERS_CUBE_REFRESH_KEY_TIME , OWNERS_STATUS_CUBE_PRE_AGG_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MapOwnersCube`, {
  sql: `
  SELECT * FROM (SELECT
  _id,
  owner AS user,
  tenantId,
  'Task' AS type
  FROM ${TasksCube.sql()} as tasksT union all
  SELECT
  Risks._id,
  Users.user AS user,
  Risks.tenantId,
  'Risk' AS type
  FROM ${RisksCube.sql()} AS Risks INNER JOIN ${MapUserCube.sql()} AS Users ON Risks._id = Users.srcObject union all
  SELECT
  Controls._id,
  Users.user AS user,
  Controls.tenantId,
  'Control' AS type
  FROM  ${ControlsCube.sql()} AS Controls INNER JOIN ${MapUserCube.sql()} AS Users ON Controls._id = Users.srcObject
  ) as MapOwners
 `,

  sqlAlias: `MapOwCube`,

  refreshKey: {
    every: MAP_OWNERS_CUBE_REFRESH_KEY_TIME
  },

  joins: {
    Users: {
      relationship: `belongsTo`,
      sql: `TRIM(CONVERT(${CUBE.owner}, CHAR)) = TRIM(CONVERT(${Users._id}, CHAR))`,
    },
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`
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
        MapOwnersCube.total
      ],
      dimensions: [Tenants.tenantId, Users.fullName],
      refreshKey: {
        every: OWNERS_STATUS_CUBE_PRE_AGG_REFRESH_KEY_TIME
      },
    },
  },

  measures: {
    count: {
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
    total: {
      type: `count`,
    },
  },

  dimensions: {
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true
    },
    owner: {
      sql: `${CUBE}.\`user\``,
      type: `string`,
			title : `Owner`
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
			title : `tenant Id`
    },
		type : {
			sql: `${CUBE}.\`type\``,
      type: `string`,
			title : `Item type`
		}
  },

  dataSource: `default`,
});
