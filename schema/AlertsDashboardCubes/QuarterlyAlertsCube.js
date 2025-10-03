import { alertsCollection, regMapGenericCollection } from "./collections";

import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube("QuarterlyAlertsCube", {
  sql: `
    SELECT 
      _id, 
      status, 
      docStatus, 
      created, 
      tenantId, 
      destObject 
    FROM (
      SELECT 
        _id, 
        status, 
        \`info.docStatus\` as docStatus, 
        created, 
        tenantId 
      FROM ${alertsCollection} 
      WHERE ${alertsCollection}.archived = 0
    ) as alerts 
    LEFT JOIN (
      SELECT 
        srcObject, 
        destObject, 
        tenantId as tntId 
      FROM ${regMapGenericCollection} 
      WHERE ${regMapGenericCollection}.archived = 0 
        AND ${regMapGenericCollection}.destType = "ImpactAssessment" 
        AND ${regMapGenericCollection}.srcType = "Alert"
    ) as Maps ON CONVERT(alerts._id,CHAR) = CONVERT(Maps.srcObject,CHAR)
  `,

  sqlAlias: "QrAl",

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
    ImpactAssessmentCube: {
      relationship: `hasOne`,
      sql: `${CUBE.impId}=${ImpactAssessmentCube._id}`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1`,
    },
  },

  preAggregations: {
    quarterlyAlertsRollUp: {
      sqlAlias: "qrAlPreAgg",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        QuarterlyAlertsCube.following,
        QuarterlyAlertsCube.open,
        QuarterlyAlertsCube.applicable,
        QuarterlyAlertsCube.excluded,
        QuarterlyAlertsCube.potentialImp,
        QuarterlyAlertsCube.totalCount,
      ],
      dimensions: [Tenants.tenantId, QuarterlyAlertsCube.docStatus],
      timeDimension: QuarterlyAlertsCube.created,
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
    totalCount: {
      type: `count`,
      filters: [
        {
          sql: `${AlertStatusCube}.isExcluded!=1`,
        },
      ],
    },
    following: {
      type: `count`,
      filters: [
        {
          sql: `${AlertStatusCube}.isFollowing = 1 AND ${AlertStatusCube}.isExcluded != 1`,
        },
      ],
      title: "Following",
    },
    open: {
      type: `count`,
      filters: [
        {
          sql: `${AlertStatusCube}.isTerminal = 0 AND ${AlertStatusCube}.isExcluded != 1`,
        },
      ],
    },
    applicable: {
      type: `count`,
      filters: [
        {
          sql: `${AlertStatusCube}.actionRequired = 1 AND ${AlertStatusCube}.isTerminal = 1 AND ${AlertStatusCube}.isExcluded != 1`,
        },
      ],
    },
    excluded: {
      type: `count`,
      filters: [
        {
          sql: `${AlertStatusCube}.isExcluded= 1`,
        },
      ],
      title: "Excluded",
    },
    potentialImp: {
      type: `count`,
      filters: [
        {
          sql: `${ImpactAssessmentCube}.impactLevel = 'CB - N/A' 
            AND ${AlertStatusCube}.isExcluded != 1 
            AND (${AlertStatusCube}.isTerminal = 1 OR ${AlertStatusCube}.isFollowing = 1)`,
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
    impId: {
      sql: `${CUBE}.\`destObject\``,
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
