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

cube(`OpenAlertsOrIAsOwnersSLA`, {
  sql: `
    SELECT
      alert._id              AS _id,
      alertOwners.owners     AS owners,
      alert.status           AS status,
      alert.\`info.docStatus\` AS docStatus,
      alert.created          AS created,
      alert.tenantId         AS tenantId,
      CASE
        WHEN mapping.srcObject IS NULL THEN 'No'      
        ELSE assessment.status                        
      END AS impactStatus
    FROM ${alertsCollection} alert
    JOIN ${alertsUsersCollection} alertOwners
      ON alertOwners._id = alert._id
    LEFT JOIN ${regMapGenericCollection} mapping
      ON mapping.archived = 0
       AND mapping.destType = 'ImpactAssessment'
       AND mapping.srcType  = 'Alert'
       AND mapping.srcObject = alert._id
       AND mapping.tenantId  = alert.tenantId
    LEFT JOIN ${impactAssessmentCollection} assessment
      ON assessment._id     = mapping.destObject
       AND assessment.tenantId = mapping.tenantId
    WHERE alert.archived = 0
      AND (mapping.srcObject IS NULL OR assessment._id IS NOT NULL)
  `,

  sqlAlias: `opnAlrtIASLA`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
    Users: {
      relationship: `belongsTo`,
      sql: `TRIM(CONVERT(${CUBE.owners}, CHAR)) = TRIM(CONVERT(${Users._id}, CHAR))`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1 AND ${AlertStatusCube.isExcluded} = 0`,
    },
  },

  preAggregations: {
    comUsSLARollUp: {
      sqlAlias: "comUsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [OpenAlertsOrIAsOwnersSLA.openAlertsOrIAsCount],
      dimensions: [
        Users._id,
        Users.fullName,
        Tenants.tenantId,
        OpenAlertsOrIAsOwnersSLA.docStatus,
      ],
      timeDimension: OpenAlertsOrIAsOwnersSLA.created,
      granularity: `day`,
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
      sql: `NOT ${AlertStatusCube}.isTerminal OR ${CUBE}.impactStatus IN ('New', 'In Process')`,
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
