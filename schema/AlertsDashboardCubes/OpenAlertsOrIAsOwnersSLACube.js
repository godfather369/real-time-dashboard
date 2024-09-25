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
  sql: `SELECT 
    mappedImpacts.srcObject AS _id, 
    ownerAlerts.owners AS owners, 
    ownerAlerts.status, 
    ownerAlerts.docStatus,       
    ownerAlerts.created, 
    ownerAlerts.tenantId, 
    mappedImpacts.impactStatus
FROM 
    (SELECT 
        ownerImpacts._id AS impactId, 
        ownerImpacts.impactStatus, 
        ownerImpacts.tenantId, 
        maps.srcObject
    FROM 
        (SELECT 
            impacts._id, 
            impacts.status AS impactStatus, 
            impacts.tenantId
        FROM 
            ${impactAssessmentCollection} AS impacts
        ) AS ownerImpacts
    INNER JOIN 
        (SELECT srcObject, destObject, tenantId AS tntId 
         FROM ${regMapGenericCollection} 
         WHERE archived = 0 
         AND destType = "ImpactAssessment" 
         AND srcType = "Alert"
        ) AS maps
    ON 
        CONVERT(ownerImpacts._id, CHAR) = CONVERT(maps.destObject, CHAR) 
        AND ownerImpacts.tenantId = maps.tntId
    ) AS mappedImpacts
INNER JOIN 
    (SELECT 
        alerts._id, 
        owners.owners, 
        alerts.status, 
        alerts.docStatus,       
        alerts.created, 
        alerts.tenantId
    FROM 
        (SELECT _id, owners FROM ${alertsUsersCollection}) AS owners
    INNER JOIN 
        (SELECT _id, status, \`info.docStatus\` AS docStatus, created, tenantId 
         FROM ${alertsCollection} 
         WHERE archived = 0
        ) AS alerts
    ON 
        alerts._id = owners._id
    ) AS ownerAlerts
ON 
    CONVERT(mappedImpacts.srcObject, CHAR) = CONVERT(ownerAlerts._id, CHAR) 
    AND mappedImpacts.tenantId = ownerAlerts.tenantId

UNION

-- Non-Impacted Alerts
SELECT 
    owners._id, 
    owners.owners, 
    alerts.status, 
    alerts.docStatus,       
    alerts.created, 
    alerts.tenantId, 
    "No" AS impactStatus
FROM 
    (SELECT _id, owners FROM ${alertsUsersCollection}) AS owners
INNER JOIN 
    (SELECT _id, status, \`info.docStatus\` AS docStatus, created, tenantId 
     FROM ${alertsCollection} 
     WHERE archived = 0
    ) AS alerts
ON 
    alerts._id = owners._id
LEFT JOIN 
    (SELECT srcObject, destObject, tenantId AS tntId 
     FROM ${regMapGenericCollection} 
     WHERE archived = 0 
     AND destType = "ImpactAssessment" 
     AND srcType = "Alert"
    ) AS maps
ON 
    maps.srcObject = owners._id 
    AND maps.tntId = alerts.tenantId
WHERE 
    ISNULL(maps.destObject) = 1`,

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
  },

  preAggregations: {
    comUsSLARollUp: {
      sqlAlias: "comUsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [OpenAlertsOrIAsOwnersSLA.openAlertsOrIAsCount],
      dimensions: [Users._id, Users.fullName, Tenants.tenantId, OpenAlertsOrIAsOwnersSLA.docStatus],
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
      sql: `(${CUBE}.status IN ('Unread', 'In Process') OR ${CUBE}.impactStatus IN ('New', 'In Process'))`,
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
