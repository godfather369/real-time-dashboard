const {
  securityContext: { userId, tenantId: tenant_id },
} = COMPILE_CONTEXT;
import { regMapStatusCollection, mapUserCollection } from "./collections";
import { MY_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MyRequirements`, {
  sql: `
    SELECT statusMap.srcObject AS _id, statusMap.status, statusMap.tenantId
    FROM (
      SELECT srcObject AS _id
      FROM ${mapUserCollection}
      WHERE ${mapUserCollection}.srcType = "Requirement"
        AND ${mapUserCollection}.user = "${userId}"
        AND ${mapUserCollection}.archived = 0
    ) AS userMap
    INNER JOIN (
      SELECT status, srcObject, tenantId
      FROM ${regMapStatusCollection}
      WHERE ${regMapStatusCollection}.tenantId = "${tenant_id}"
        AND ${regMapStatusCollection}.srcType = "Requirement"
        AND ${regMapStatusCollection}.archived = 0
    ) AS statusMap
      ON userMap._id = statusMap.srcObject
  `,

  sqlAlias: `MyReCube`,

  refreshKey: {
    every: MY_CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    RequirementStatus: {
      relationship: `hasOne`,
      sql: `${CUBE.status} = ${RequirementStatus.statusId} AND ${CUBE.tenantId} = ${RequirementStatus.tenantId}`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [_id],
    },
  },

  dimensions: {
    _id: {
      sql: `${CUBE}._id`,
      type: `string`,
      primaryKey: true,
    },
    status: {
      sql: `${CUBE}.status`,
      type: `string`,
    },
    tenantId: {
      sql: `${CUBE}.tenantId`,
      type: `string`,
    },
  },

  dataSource: `default`,
});
