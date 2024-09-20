const {
  securityContext: { userId },
} = COMPILE_CONTEXT;
import {
  regMapStatusCollection,
  mapUserCollection,
  requirementsCollection,
} from "./collections";
import { MY_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MyRequirements`, {
  sql: `SELECT _id, status, tenantId FROM (SELECT _id as id, tenantId as tntId FROM ${requirementsCollection} WHERE ${requirementsCollection}.archived=0) as requirement INNER JOIN (SELECT _id, status, tenantId FROM (SELECT srcObject as _id, tenantId FROM ${mapUserCollection} where ${mapUserCollection}.archived=0 AND ${mapUserCollection}.srcType="Requirement" AND ${mapUserCollection}.user="${userId}")as userMap INNER JOIN (SELECT status, srcObject FROM ${regMapStatusCollection} WHERE ${regMapStatusCollection}.archived=0 AND ${regMapStatusCollection}.srcType="Requirement") as statusMap ON userMap._id=statusMap.srcObject) as mappedRequirement ON mappedRequirement._id=requirement.id AND mappedRequirement.tenantId=requirement.tntId`,

  sqlAlias: `MyReCube`,

  refreshKey: {
    every: MY_CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
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
