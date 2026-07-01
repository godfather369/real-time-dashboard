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

cube(`OpenAlertsOrIAsOwnersSLA`, {
  sql: `
    SELECT
      a.\`_id\` AS \`_id\`,
      o.\`owners\` AS \`owners\`,
      a.\`status\` AS \`status\`,
      a.\`docStatus\` AS \`docStatus\`,
      a.\`created\` AS \`created\`,
      a.\`tenantId\` AS \`tenantId\`,
      a.\`impactStatus\` AS \`impactStatus\`,
      sc.\`isTerminal\` AS \`isTerminal\`,
      sc.\`isExcluded\` AS \`isExcluded\`
    FROM ${enrichedAlertsCollection} a
    INNER JOIN ${enrichedAlertsOwnersCollection} o
      ON o.\`_id\` = a.\`_id\`
    INNER JOIN (
      SELECT
        \`_id\` AS configId,
        \`status.regChange.id\` AS statusId,
        \`status.regChange.isTerminal\` AS isTerminal,
        \`status.regChange.isExcluded\` AS isExcluded
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

  sqlAlias: `opnAlrtIASLA`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

  measures: {
    openAlertsOrIAsCount: {
      type: `sum`,
      sql: `${CUBE}.isTerminal = 0 OR ${CUBE}.impactStatus = 'New' OR ${CUBE}.impactStatus = 'In Process'`,
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
    isExcluded: {
      sql: `${CUBE}.\`isExcluded\``,
      type: `boolean`,
    },
    owners: {
      sql: `${CUBE}.\`owners\``,
      type: `string`,
      title: "owners",
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
