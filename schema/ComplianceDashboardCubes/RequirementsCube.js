import {
  requirementsCollection,
  regMapStatusCollection,
  requirementsByStatusCollection,
  regConfigCollection,
} from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`RequirementsCube`, {
  sql: `SELECT _id, statusName, statusId, tenantId FROM (SELECT _id, status, tenantId FROM 
	(SELECT _id, tenantId FROM ${requirementsCollection} where ${requirementsCollection}.archived = 0) AS requirements INNER JOIN 
    (SELECT status, srcObject FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.srcType="Requirement" AND ${regMapStatusCollection}.archived=0) as mapStatus ON requirements._id=mapStatus.srcObject) AS requirementStatus INNER JOIN (SELECT tenantId as tenant, statusId, statusName FROM (SELECT _id, tenantId FROM ${regConfigCollection}) as config INNER JOIN (SELECT _id as ID, \`status.requirement.id\` as statusId, \`status.requirement.name\` as statusName  FROM ${requirementsByStatusCollection}) AS configStatus ON config._id=configStatus.ID) as requirementConfig ON requirementConfig.tenant= requirementStatus.tenantId AND requirementConfig.statusId= requirementStatus.status`,

  sqlAlias: `ReCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [_id],
    },
  },

  preAggregations: {
    requirementsRollUp: {
      sqlAlias: "reqRollUp",
      external: true,
      measures: [RequirementsCube.count],
      dimensions: [
        Tenants.tenantId,
        RequirementsCube.status,
        RequirementsCube.statusId,
      ],
      scheduledRefresh: true,
      refreshKey: {
        every: PRE_AGG_REFRESH_KEY_TIME,
      },
    },
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },
    status: {
      sql: `${CUBE}.\`statusName\``,
      type: `string`,
      title: `status`,
    },
    statusId: {
      sql: `${CUBE}.\`statusId\``,
      type: `string`,
      title: `statusId`,
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
  },
  dataSource: `default`,
});
