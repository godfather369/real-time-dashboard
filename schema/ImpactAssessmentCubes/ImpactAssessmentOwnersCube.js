const {
  securityContext: { tenantId: secTenantId },
} = COMPILE_CONTEXT;

import {
  enrichedAlertsCollection,
  enrichedAlertsOwnersCollection,
} from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`ImpactsByOwnersCube`, {
  sql: `
    SELECT
      a.\`_id\`,
      a.\`tenantId\`,
      a.\`impactStatus\` AS \`status\`,
      a.\`created\`,
      a.\`docStatus\`,
      o.\`owners\`
    FROM ${enrichedAlertsCollection} a
    INNER JOIN ${enrichedAlertsOwnersCollection} o
      ON o.\`_id\` = a.\`_id\`
    WHERE a.\`tenantId\` = '${secTenantId}'
      AND a.\`impactStatus\` != 'No'
  `,

  sqlAlias: `IAOwCube`,

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
    owners: {
      sql: `owners`,
      type: `string`,
      title: `owners`,
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
