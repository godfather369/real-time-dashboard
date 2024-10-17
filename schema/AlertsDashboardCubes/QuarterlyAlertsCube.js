import { alertsCollection, regMapGenericCollection } from "./collections";

import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube("QuarterlyAlertsCube", {
  sql: `SELECT _id, status, docStatus, created, tenantId, destObject FROM
    (SELECT _id, status, \`info.docStatus\` as docStatus, created, tenantId FROM ${alertsCollection} WHERE ${alertsCollection}.archived=0)
    as alerts LEFT JOIN
    (SELECT srcObject, destObject, tenantId as tntId FROM ${regMapGenericCollection} 
        WHERE ${regMapGenericCollection}.archived=0  AND ${regMapGenericCollection}.destType="ImpactAssessment" AND ${regMapGenericCollection}.srcType="Alert")
    as Maps ON alerts._id = maps.srcObject`,

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
  },

  preAggregations: {
    quarterlyAlertsRollUp: {
      sqlAlias: "qrAlPreAgg",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        QuarterlyAlertsCube.applicable,
        QuarterlyAlertsCube.following,
        QuarterlyAlertsCube.open,
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
      title: "Total Count",
    },
    applicable: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.status = 'Applicable'`,
        },
      ],
    },
    following: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.status= 'Following'`,
        },
      ],
      title: "Following",
    },
    open: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.status= 'Unread' OR ${CUBE}.status= 'In Process'`,
        },
      ],
      title: "Following",
    },
    excluded: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.status= 'Excluded'`,
        },
      ],
      title: "Excluded",
    },
    potentialImp: {
      type: `count`,
      filters: [
        {
          sql: `${ImpactAssessmentCube}.impactLevel ='CB - N/A' AND (${CUBE}.status='Applicable' OR ${CUBE}.status='Following')`,
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
