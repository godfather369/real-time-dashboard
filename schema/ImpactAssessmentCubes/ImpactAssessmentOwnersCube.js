import {
  impactAssessmentCollection,
  impactAssessmentOwnersCollection,
  regMapGenericCollection,
  alertsCollection,
} from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`ImpactsByOwnersCube`, {
  sql: `
    SELECT DISTINCT
      impact_assessments._id AS _id, 
      impact_assessments.tenantId AS tenantId, 
      impact_assessments.status AS status, 
      impact_assessments.startDate AS startDate, 
      impact_assessments.created AS created,
      impact_assessment_owners.owners AS owners,
      alerts.\`info.docStatus\` AS docStatus
    FROM ${impactAssessmentCollection} impact_assessments
    INNER JOIN ${impactAssessmentOwnersCollection} impact_assessment_owners 
      ON impact_assessments._id = impact_assessment_owners._id
    INNER JOIN ${regMapGenericCollection} generic_mappings 
      ON impact_assessments._id = generic_mappings.destObject 
      AND generic_mappings.archived = 0 
      AND generic_mappings.srcType = 'Alert' 
      AND generic_mappings.destType = 'ImpactAssessment'
    INNER JOIN ${alertsCollection} alerts 
      ON generic_mappings.srcObject = alerts._id 
      AND alerts.archived = 0
    WHERE impact_assessments.archived = 0
  `,

  sqlAlias: `IAOwCube`,

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
    impactsByUsersRollUp: {
      sqlAlias: "IAByUsrsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [ImpactsByOwnersCube.count],
      dimensions: [Tenants.tenantId, Users.fullName, Users._id],
      timeDimension: ImpactsByOwnersCube.startDate,
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
    impactsOwnersRollUp: {
      sqlAlias: "IAByAppRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        ImpactsByOwnersCube.count,
        ImpactsByOwnersCube.open,
        ImpactsByOwnersCube.New,
        ImpactsByOwnersCube.inProcess,
        ImpactsByOwnersCube.closed,
      ],
      dimensions: [
        Tenants.tenantId,
        Users.fullName,
        Users._id,
        ImpactsByOwnersCube.docStatus,
      ],
      timeDimension: ImpactsByOwnersCube.created,
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
    count: {
      type: `count`,
      drillMembers: [_id],
    },
    closed: {
      sql: `status`,
      type: "count",
      title: "Closed",
      filters: [
        {
          sql: `${CUBE}.status = 'Closed'`,
        },
      ],
    },
    New: {
      sql: `status`,
      type: "count",
      title: "Open",
      filters: [
        {
          sql: `${CUBE}.status ='New'`,
        },
      ],
    },
    inProcess: {
      sql: `status`,
      type: "count",
      title: "InProcess",
      filters: [
        {
          sql: `${CUBE}.status = 'In Process'`,
        },
      ],
    },
    open: {
      sql: `${inProcess} + ${New}`,
      type: `number`,
      title: "open",
    },
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },
    tenantId: {
      sql: `tenantId`,
      type: `string`,
    },
    startDate: {
      sql: `startDate`,
      type: `time`,
    },
    created: {
      sql: `created`,
      type: `time`,
    },
    owners: {
      sql: `owners`,
      type: `string`,
      title: `owners`,
    },
    status: {
      sql: `status`,
      type: `string`,
    },
    docStatus: {
      sql: `${CUBE}.\`docStatus\``,
      type: `string`,
      title: `Doc Status`,
    },
  },

  dataSource: `default`,
});
