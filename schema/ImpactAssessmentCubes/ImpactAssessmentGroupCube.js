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
import { alertsActiveFilterSql } from "./sql-queries";

cube(`ImpactsByGroupCube`, {
  sql: `
		SELECT
			impacts._id,
			impacts.tenantId,
			impacts.status,
			impacts.startDate,
			impacts.created,
			groupIds.groups,
			${alertsCollection}.\`info.docStatus\` AS docStatus
		FROM ${impactAssessmentCollection} AS impacts
		INNER JOIN ${impactAssessmentGroupsCollection} AS groupIds
			ON impacts._id = groupIds._id
		INNER JOIN ${regMapGenericCollection} AS Maps
			ON impacts._id = Maps.destObject
			AND impacts.tenantId = Maps.tenantId
			AND Maps.archived = 0
			AND Maps.srcType = "Alert"
			AND Maps.destType = "ImpactAssessment"
		INNER JOIN ${alertsCollection}
			ON Maps.srcObject = ${alertsCollection}._id
			AND Maps.tenantId = ${alertsCollection}.tenantId
		WHERE impacts.archived = 0
			AND ${alertsActiveFilterSql}
	`,

  sqlAlias: `IAGrCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Groups: {
      relationship: `belongsTo`,
      sql: `${CUBE.groups} = ${Groups._id}`,
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
        ImpactsByGroupCube.tenantId,
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
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
    startDate: {
      sql: `${CUBE}.\`startDate\``,
      type: `time`,
    },
    created: {
      sql: `${CUBE}.\`created\``,
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
