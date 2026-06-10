const {
  securityContext: { tenantId: tenant_id },
} = COMPILE_CONTEXT;

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
import { alertsActiveFilterSqlUnqualified } from "./sql-queries";

cube(`ImpactsByOwnersCube`, {
  sql: `
		SELECT
			impacts._id,
			impacts.tenantId,
			impacts.status,
			impacts.startDate,
			impacts.created,
			ownerIds.owners,
			alerts.docStatus
		FROM (
			SELECT _id, tenantId, status, startDate, created
			FROM ${impactAssessmentCollection}
			WHERE ${impactAssessmentCollection}.archived = 0
				AND ${impactAssessmentCollection}.tenantId = "${tenant_id}"
		) AS impacts
		INNER JOIN (
			SELECT _id, owners
			FROM ${impactAssessmentOwnersCollection}
		) AS ownerIds
			ON impacts._id = ownerIds._id
		INNER JOIN (
			SELECT srcObject, destObject
			FROM ${regMapGenericCollection}
			WHERE ${regMapGenericCollection}.archived = 0
				AND ${regMapGenericCollection}.tenantId = "${tenant_id}"
				AND ${regMapGenericCollection}.srcType = "Alert"
				AND ${regMapGenericCollection}.destType = "ImpactAssessment"
		) AS Maps
			ON impacts._id = Maps.destObject
		INNER JOIN (
			SELECT _id, \`info.docStatus\` AS docStatus
			FROM ${alertsCollection}
			WHERE tenantId = "${tenant_id}"
				AND ${alertsActiveFilterSqlUnqualified}
		) AS alerts
			ON Maps.srcObject = alerts._id
	`,

  sqlAlias: `IAOwCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Users: {
      relationship: `belongsTo`,
      sql: `CAST(${CUBE.owners} AS CHAR) = CAST(${Users._id} AS CHAR)
				AND ${CUBE}.tenantId = ${Users}.tenantId`,
    },
  },

  preAggregations: {
    impactsByUsersRollUp: {
      sqlAlias: "IAByUsrsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [ImpactsByOwnersCube.count],
      dimensions: [ImpactsByOwnersCube.tenantId, Users.fullName, Users._id],
      timeDimension: ImpactsByOwnersCube.startDate,
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
        ImpactsByOwnersCube.tenantId,
        Users.fullName,
        Users._id,
        ImpactsByOwnersCube.docStatus,
      ],
      timeDimension: ImpactsByOwnersCube.created,
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
