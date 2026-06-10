import {
  alertsCollection,
  regMapGenericCollection,
  impactAssessmentCollection,
  alertsUsersCollection,
  alertsByStatusCollection,
  regConfigCollection,
} from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";
import { alertsActiveFilterSqlUnqualified } from "./sql-queries";

cube(`OpenAlertsOrIAsOwnersSLA`, {
  sql: `
    SELECT
      OpenAlertsOrIAs._id,
      OpenAlertsOrIAs.owners,
      OpenAlertsOrIAs.status,
      OpenAlertsOrIAs.docStatus,
      OpenAlertsOrIAs.created,
      OpenAlertsOrIAs.tenantId,
      OpenAlertsOrIAs.impactStatus,
      regChangeConfig.isTerminal
    FROM (
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
    ) AS OpenAlertsOrIAs
    LEFT JOIN (
      SELECT Config.tenantId AS configTenantId, alertsStatusConfig.statusId, alertsStatusConfig.isTerminal
      FROM ${regConfigCollection} AS Config
      INNER JOIN (
        SELECT _id AS configId, \`status.regChange.id\` AS statusId, \`status.regChange.isTerminal\` AS isTerminal
        FROM ${alertsByStatusCollection}
      ) AS alertsStatusConfig
        ON alertsStatusConfig.configId = Config._id
    ) AS regChangeConfig
      ON OpenAlertsOrIAs.tenantId = regChangeConfig.configTenantId
      AND OpenAlertsOrIAs.status = regChangeConfig.statusId
  `,

  sqlAlias: `openOwnersSLA`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Users: {
      relationship: `belongsTo`,
      sql: `${CUBE.owners} = ${Users._id}`,
    },
  },

  preAggregations: {
    openAlertsOrIAsOwnersSLARollUp: {
      sqlAlias: "opOwnSLARP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [OpenAlertsOrIAsOwnersSLA.openAlertsOrIAsCount],
      dimensions: [
        Users._id,
        Users.fullName,
        OpenAlertsOrIAsOwnersSLA.tenantId,
        OpenAlertsOrIAsOwnersSLA.docStatus,
      ],
      timeDimension: OpenAlertsOrIAsOwnersSLA.created,
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
    openAlertsOrIAsCount: {
      type: `sum`,
      sql: `NOT ${CUBE}.isTerminal OR ${CUBE}.impactStatus IN ('New', 'In Process')`,
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
