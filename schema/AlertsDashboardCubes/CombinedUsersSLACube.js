import {
  alertsCollection,
  regMapGenericCollection,
  impactAssessmentCollection,
  alertsUsersCollection,
} from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";
import { alertsActiveFilterSqlUnqualified } from "./sql-queries";

cube(`combinedOwnersSLA`, {
  sql: `
    SELECT
      alerts._id,
      own.owners,
      alerts.status,
      alerts.docStatus,
      alerts.created,
      alerts.tenantId,
      CASE WHEN maps.srcObject IS NOT NULL THEN impacts.status ELSE 'No' END AS impactStatus
    FROM (
      SELECT _id, status, \`info.docStatus\` AS docStatus, created, tenantId
      FROM ${alertsCollection}
      WHERE ${alertsActiveFilterSqlUnqualified}
    ) AS alerts
    INNER JOIN ${alertsUsersCollection} own
      ON alerts._id = own._id
    LEFT JOIN ${regMapGenericCollection} maps
      ON maps.srcObject = alerts._id
      AND maps.tenantId = alerts.tenantId
      AND maps.archived = 0
      AND maps.destType = "ImpactAssessment"
      AND maps.srcType = "Alert"
    LEFT JOIN ${impactAssessmentCollection} impacts
      ON impacts._id = maps.destObject
      AND impacts.tenantId = maps.tenantId
    WHERE maps.destObject IS NULL OR impacts._id IS NOT NULL
  `,

  sqlAlias: `comUrsSLACube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Users: {
      relationship: `belongsTo`,
      sql: `${CUBE.owners} = ${Users._id}`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1`,
    },
  },

  preAggregations: {
    comUsSLARollUp: {
      sqlAlias: "comUsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        combinedOwnersSLA.openOpen,
        combinedOwnersSLA.openClosed,
        combinedOwnersSLA.openMissing,
        combinedOwnersSLA.closedOpen,
        combinedOwnersSLA.closedClosed,
        combinedOwnersSLA.closedMissing,
        combinedOwnersSLA.open,
        combinedOwnersSLA.closed,
      ],
      dimensions: [
        Users._id,
        Users.fullName,
        combinedOwnersSLA.tenantId,
        combinedOwnersSLA.docStatus,
      ],
      timeDimension: combinedOwnersSLA.created,
      granularity: `second`,
      buildRangeStart: {
        sql: `SELECT NOW() - interval '365 day'`,
      },
      buildRangeEnd: {
        sql: `SELECT NOW()`,
      },
      refreshKey: {
        every: PRE_AGG_REFRESH_KEY_TIME,
      },
    },
  },

  measures: {
    openOpen: {
      type: `count`,
      filters: [
        {
          sql: `NOT ${AlertStatusCube}.isTerminal AND (${CUBE}.impactStatus = 'New' OR ${CUBE}.impactStatus = 'In Process')`,
        },
      ],
    },
    openClosed: {
      type: `count`,
      filters: [
        {
          sql: `NOT ${AlertStatusCube}.isTerminal AND (${CUBE}.impactStatus = 'Closed')`,
        },
      ],
    },
    openMissing: {
      type: `count`,
      filters: [
        {
          sql: `NOT ${AlertStatusCube}.isTerminal AND (${CUBE}.impactStatus = 'No')`,
        },
      ],
    },
    closedOpen: {
      type: `count`,
      filters: [
        {
          sql: `${AlertStatusCube}.isTerminal AND (${CUBE}.impactStatus = 'New' OR ${CUBE}.impactStatus = 'In Process')`,
        },
      ],
    },
    closedClosed: {
      type: `count`,
      filters: [
        {
          sql: `${AlertStatusCube}.isTerminal AND (${CUBE}.impactStatus = 'Closed')`,
        },
      ],
    },
    closedMissing: {
      type: `count`,
      filters: [
        {
          sql: `${AlertStatusCube}.isTerminal AND (${CUBE}.impactStatus = 'No')`,
        },
      ],
    },
    open: {
      type: `count`,
      filters: [
        {
          sql: `NOT ${AlertStatusCube}.isTerminal`,
        },
      ],
    },
    closed: {
      type: `count`,
      filters: [
        {
          sql: `${AlertStatusCube}.isTerminal`,
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
