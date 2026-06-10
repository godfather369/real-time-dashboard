import {
  requirementsByStatusCollection,
  regConfigCollection,
} from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`RequirementStatus`, {
  sql: `
    SELECT config._id, config.tenantId, requirementConfig.statusId, requirementConfig.statusName
    FROM ${regConfigCollection} AS config
    INNER JOIN (
      SELECT _id AS ID, \`status.requirement.id\` AS statusId, \`status.requirement.name\` AS statusName
      FROM ${requirementsByStatusCollection}
    ) AS requirementConfig
      ON requirementConfig.ID = config._id
  `,

  sqlAlias: `ReSt`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
    statusId: {
      sql: `${CUBE}.\`statusId\``,
      type: `string`,
    },
    statusName: {
      sql: `${CUBE}.\`statusName\``,
      type: `string`,
    },
  },

  dataSource: `default`,
});
