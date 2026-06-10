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
  sql: `
    SELECT
      requirements._id,
      configStatus.statusName,
      configStatus.statusId,
      requirements.tenantId
    FROM ${requirementsCollection} AS requirements
    INNER JOIN (
      SELECT status, srcObject
      FROM ${regMapStatusCollection}
      WHERE ${regMapStatusCollection}.srcType = "Requirement"
        AND ${regMapStatusCollection}.archived = 0
    ) AS mapStatus
      ON requirements._id = mapStatus.srcObject
    INNER JOIN ${regConfigCollection} AS config
      ON config.tenantId = requirements.tenantId
    INNER JOIN (
      SELECT _id AS ID, \`status.requirement.id\` AS statusId, \`status.requirement.name\` AS statusName
      FROM ${requirementsByStatusCollection}
    ) AS configStatus
      ON config._id = configStatus.ID
      AND configStatus.statusId = mapStatus.status
    WHERE requirements.archived = 0
  `,

  sqlAlias: `ReCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

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
        RequirementsCube.tenantId,
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
