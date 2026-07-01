const {
  securityContext: { tenantId: secTenantId },
} = COMPILE_CONTEXT;

import {
  enrichedAlertsCollection,
  enrichedAlertsGroupsCollection,
  alertsByStatusCollection,
  regConfigCollection,
} from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube("QuarterlyAlertsByGroups", {
  sql: `
    SELECT
      a.\`_id\`,
      a.\`status\`,
      a.\`docStatus\`,
      a.\`created\`,
      g.\`groups\`,
      a.\`tenantId\`,
      a.\`impactLevel\`,
      sc.\`isTerminal\`,
      sc.\`isExcluded\`,
      sc.\`isFollowing\`,
      sc.\`actionRequired\`
    FROM ${enrichedAlertsCollection} a
    INNER JOIN ${enrichedAlertsGroupsCollection} g
      ON g.\`_id\` = a.\`_id\`
    INNER JOIN (
      SELECT
        \`_id\` AS configId,
        \`status.regChange.id\` AS statusId,
        \`status.regChange.isTerminal\` AS isTerminal,
        \`status.regChange.isExcluded\` AS isExcluded,
        \`status.regChange.actionRequired\` AS actionRequired,
        \`status.regChange.meta.isFollowing\` AS isFollowing
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

  sqlAlias: "QAlByGrps",

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

  measures: {
    totalCount: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isExcluded != 1`,
        },
      ],
    },
    following: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isFollowing = 1 AND ${CUBE}.isExcluded != 1`,
        },
      ],
      title: "Following",
    },
    open: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isTerminal = 0 AND ${CUBE}.isExcluded != 1`,
        },
      ],
    },
    applicable: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.actionRequired = 1 AND ${CUBE}.isTerminal = 1 AND ${CUBE}.isExcluded != 1`,
        },
      ],
    },
    excluded: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.isExcluded = 1`,
        },
      ],
      title: "Excluded",
    },
    potentialImp: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.impactLevel = 'CB - N/A'
            AND ${CUBE}.isExcluded != 1
            AND (${CUBE}.isTerminal = 1 OR ${CUBE}.isFollowing = 1)`,
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
    impactLevel: {
      sql: `${CUBE}.\`impactLevel\``,
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
    isFollowing: {
      sql: `${CUBE}.\`isFollowing\``,
      type: `boolean`,
    },
    actionRequired: {
      sql: `${CUBE}.\`actionRequired\``,
      type: `boolean`,
    },
    groupId: {
      sql: `${CUBE}.\`groups\``,
      type: `string`,
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
