import {
  alertsCollection,
  regMapGenericCollection,
  impactAssessmentCollection,
  alertsGroupsCollection,
} from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`OpenAlertsOrIAsGroupsSLA`, {
  sql: `SELECT 
    mappedImpacts.srcObject AS _id, 
    groupAlerts.groups AS groups, 
    groupAlerts.status, 
    groupAlerts.docStatus,       
    groupAlerts.created, 
    groupAlerts.tenantId, 
    mappedImpacts.impactStatus
FROM 
    (SELECT 
        groupImpacts._id AS impactId, 
        groupImpacts.impactStatus, 
        groupImpacts.tenantId, 
        maps.srcObject
    FROM 
        (SELECT 
            impacts._id, 
            impacts.status AS impactStatus, 
            impacts.tenantId
        FROM 
            ${impactAssessmentCollection} AS impacts
        ) AS groupImpacts
    INNER JOIN 
        (SELECT srcObject, destObject, tenantId AS tntId 
         FROM ${regMapGenericCollection} 
         WHERE archived = 0 
         AND destType = "ImpactAssessment" 
         AND srcType = "Alert"
        ) AS maps
    ON 
        CONVERT(groupImpacts._id, CHAR) = CONVERT(maps.destObject, CHAR) 
        AND groupImpacts.tenantId = maps.tntId
    ) AS mappedImpacts
INNER JOIN 
    (SELECT 
        alerts._id, 
        groups.groups, 
        alerts.status, 
        alerts.docStatus,       
        alerts.created, 
        alerts.tenantId
    FROM 
        (SELECT _id, groups FROM ${alertsGroupsCollection}) AS groups
    INNER JOIN 
        (SELECT _id, status, \`info.docStatus\` AS docStatus, created, tenantId 
         FROM ${alertsCollection} 
         WHERE archived = 0
        ) AS alerts
    ON 
        alerts._id = groups._id
    ) AS groupAlerts
ON 
    CONVERT(mappedImpacts.srcObject, CHAR) = CONVERT(groupAlerts._id, CHAR) 
    AND mappedImpacts.tenantId = groupAlerts.tenantId

UNION

-- Non-Impacted Alerts
SELECT 
    groups._id, 
    groups.groups, 
    alerts.status, 
    alerts.docStatus,       
    alerts.created, 
    alerts.tenantId, 
    "No" AS impactStatus
FROM 
    (SELECT _id, groups FROM ${alertsGroupsCollection}) AS groups
INNER JOIN 
    (SELECT _id, status, \`info.docStatus\` AS docStatus, created, tenantId 
     FROM ${alertsCollection} 
     WHERE archived = 0
    ) AS alerts
ON 
    alerts._id = groups._id
LEFT JOIN 
    (SELECT srcObject, destObject, tenantId AS tntId 
     FROM ${regMapGenericCollection} 
     WHERE archived = 0 
     AND destType = "ImpactAssessment" 
     AND srcType = "Alert"
    ) AS maps
ON 
    maps.srcObject = groups._id 
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
    Groups: {
      relationship: `belongsTo`,
      sql: `TRIM(CONVERT(${CUBE.groups}, CHAR)) = TRIM(CONVERT(${Groups._id}, CHAR))`,
    },
  },

  preAggregations: {
    comGrSLARollUp: {
      sqlAlias: "comGrRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [OpenAlertsOrIAsGroupsSLA.openAlertsOrIAsCount],
      dimensions: [Groups._id, Groups.name, Tenants.tenantId, OpenAlertsOrIAsGroupsSLA.docStatus
      ],
      timeDimension: OpenAlertsOrIAsGroupsSLA.created,
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
    groups: {
      sql: `${CUBE}.\`groups\``,
      type: `string`,
      title: `groups`,
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
