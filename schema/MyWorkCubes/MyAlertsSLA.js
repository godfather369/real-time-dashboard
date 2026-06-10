const {
  securityContext: { userId },
} = COMPILE_CONTEXT;

import {
  alertsCollection,
  alertsUsersCollection,
  alertsGroupsCollection,
  groupsOfUserCollection,
} from "./collections";
import { MY_CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { alertsActiveFilterSql } from "./sql-queries";

cube(`MyAlertsSLA`, {
  sql: `
    SELECT alerts._id, alerts.alertCategory, alerts.created, alerts.tenantId, alerts.status
    FROM (
      SELECT _id AS UId
      FROM ${alertsUsersCollection}
      WHERE ${alertsUsersCollection}.owners = "${userId}"

      UNION

      SELECT groupIds._id AS UId
      FROM (
        SELECT functionalRole
        FROM ${groupsOfUserCollection}
        WHERE ${groupsOfUserCollection}._id = "${userId}"
      ) AS userGroups
      INNER JOIN (
        SELECT _id, groups
        FROM ${alertsGroupsCollection}
      ) AS groupIds
        ON groupIds.groups = userGroups.functionalRole
    ) AS Users
    INNER JOIN (
      SELECT _id, alertCategory, created, tenantId, status
      FROM ${alertsCollection}
      WHERE ${alertsActiveFilterSql}
    ) AS alerts
      ON alerts._id = Users.UId
  `,
  sqlAlias: `myAlSLA`,

  refreshKey: {
    every: MY_CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1 AND ${AlertStatusCube.isExcluded} != 1`,
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
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },
    statusName: {
      type: `string`,
      sql: `
        CASE
          WHEN ${AlertStatusCube.isTerminal} = TRUE THEN 'Closed'
          WHEN ${AlertStatusCube.isTerminal} = FALSE THEN 'Open'
        END
      `,
    },
    status: {
      sql: `${CUBE}.\`status\``,
      type: `string`,
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
    created: {
      sql: `${CUBE}.\`created\``,
      type: `time`,
    },
  },

  dataSource: `default`,
});
