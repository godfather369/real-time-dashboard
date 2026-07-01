const {
  securityContext: { tenantId: secTenantId },
} = COMPILE_CONTEXT;

import {
  enrichedAlertsCollection,
  enrichedAlertsOwnersCollection,
  alertsByStatusCollection,
  regConfigCollection,
} from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`combinedOwnersSLA`, {
  sql: `
    SELECT
      a.\`_id\`,
      o.\`owners\`,
      a.\`status\`,
      a.\`docStatus\`,
      a.\`created\`,
      a.\`tenantId\`,
      a.\`impactStatus\`,
      sc.\`isTerminal\`
    FROM ${enrichedAlertsCollection} a
    INNER JOIN ${enrichedAlertsOwnersCollection} o
      ON o.\`_id\` = a.\`_id\`
    INNER JOIN (
      SELECT
        \`_id\` AS configId,
        \`status.regChange.id\` AS statusId,
        \`status.regChange.isTerminal\` AS isTerminal
      FROM ${alertsByStatusCollection}
      WHERE \`status.regChange.active\` = 1
        AND \`_id\` IN (
          SELECT _id FROM ${regConfigCollection}
          WHERE tenantId = '${secTenantId}'
        )
    ) AS sc
      ON sc.statusId = a.\`status\`
    WHERE a.\`tenantId\` = '${secTenantId}'
  `,

  sqlAlias: `comSLA`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

  measures: {
    openOpen: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isTerminal = 0 AND (${CUBE}.impactStatus = 'New' OR ${CUBE}.impactStatus = 'In Process')`,
        },
      ],
    },
    openClosed: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isTerminal = 0 AND (${CUBE}.impactStatus = 'Closed')`,
        },
      ],
    },
    openMissing: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isTerminal = 0 AND (${CUBE}.impactStatus = 'No')`,
        },
      ],
    },
    closedOpen: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isTerminal = 1 AND (${CUBE}.impactStatus = 'New' OR ${CUBE}.impactStatus = 'In Process')`,
        },
      ],
    },
    closedClosed: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isTerminal = 1 AND (${CUBE}.impactStatus = 'Closed')`,
        },
      ],
    },
    closedMissing: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isTerminal = 1 AND (${CUBE}.impactStatus = 'No')`,
        },
      ],
    },
    open: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isTerminal = 0`,
        },
      ],
    },
    closed: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isTerminal = 1`,
        },
      ],
    },
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },
    status: {
      sql: `${CUBE}.\`status\``,
      type: `string`,
    },
    docStatus: {
      sql: `${CUBE}.\`docStatus\``,
      type: `string`,
    },
    impactStatus: {
      sql: `${CUBE}.\`impactStatus\``,
      type: `string`,
    },
    isTerminal: {
      sql: `${CUBE}.\`isTerminal\``,
      type: `boolean`,
    },
    owners: {
      sql: `${CUBE}.\`owners\``,
      type: `string`,
      title: `owners`,
    },
    created: {
      sql: `${CUBE}.\`created\``,
      type: `time`,
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
  },
  dataSource: `default`,
});
