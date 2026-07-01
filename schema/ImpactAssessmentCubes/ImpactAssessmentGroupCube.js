const {
  securityContext: { tenantId: secTenantId },
} = COMPILE_CONTEXT;

import {
  enrichedAlertsCollection,
  enrichedAlertsGroupsCollection,
} from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`ImpactsByGroupCube`, {
  sql: `
    SELECT
      a.\`_id\`,
      a.\`tenantId\`,
      a.\`impactStatus\` AS \`status\`,
      a.\`created\`,
      a.\`docStatus\`,
      g.\`groups\`
    FROM ${enrichedAlertsCollection} a
    INNER JOIN ${enrichedAlertsGroupsCollection} g
      ON g.\`_id\` = a.\`_id\`
    WHERE a.\`tenantId\` = '${secTenantId}'
      AND a.\`impactStatus\` != 'No'
  `,

  sqlAlias: `IAGrCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

  measures: {
    count: {
      type: `count`,
      drillMembers: [_id],
    },
    closed: {
      sql: `status`,
      type: "count",
      title: "Closed",
      filters: [
        {
          sql: `${CUBE}.status = 'Closed'`,
        },
      ],
    },
    New: {
      sql: `status`,
      type: "count",
      title: "Open",
      filters: [
        {
          sql: `${CUBE}.status ='New'`,
        },
      ],
    },
    inProcess: {
      sql: `status`,
      type: "count",
      title: "InProcess",
      filters: [
        {
          sql: `${CUBE}.status = 'In Process'`,
        },
      ],
    },
    open: {
      sql: `${inProcess} + ${New}`,
      type: `number`,
      title: "open",
    },
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
    created: {
      sql: `${CUBE}.\`created\``,
      type: `time`,
    },
    groups: {
      sql: `groups`,
      type: `string`,
      title: `groups`,
    },
    status: {
      sql: `status`,
      type: `string`,
    },
    docStatus: {
      sql: `${CUBE}.\`docStatus\``,
      type: `string`,
      title: `Doc Status`,
    },
  },

  dataSource: `default`,
});
