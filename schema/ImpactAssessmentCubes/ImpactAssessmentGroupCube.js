import {
  impactAssessmentCollection,
  impactAssessmentGroupsCollection,
  regMapGenericCollection,
  alertsCollection,
} from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`ImpactsByGroupCube`, {
  sql: `
    SELECT DISTINCT
      impact_assessments._id AS _id, 
      impact_assessments.tenantId AS tenantId, 
      impact_assessments.status AS status, 
      impact_assessments.startDate AS startDate, 
      impact_assessments.created AS created,
      impact_assessment_groups.groups AS groups,
      alerts.\`info.docStatus\` AS docStatus
    FROM ${impactAssessmentCollection} impact_assessments
    INNER JOIN ${impactAssessmentGroupsCollection} impact_assessment_groups 
      ON impact_assessments._id = impact_assessment_groups._id
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

  sqlAlias: `IAGrCube`,

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
    impactsGroupsRollUp: {
      sqlAlias: "IAByAppRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        ImpactsByGroupCube.count,
        ImpactsByGroupCube.open,
        ImpactsByGroupCube.New,
        ImpactsByGroupCube.inProcess,
        ImpactsByGroupCube.closed,
      ],
      dimensions: [
        Tenants.tenantId,
        Groups.name,
        Groups._id,
        ImpactsByGroupCube.docStatus,
      ],
      timeDimension: ImpactsByGroupCube.created,
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
    groups: {
      sql: `groups`,
      type: `string`,
      title: `groups`,
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
