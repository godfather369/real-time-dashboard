const {
  securityContext: { tenantId: tenant_id },
} = COMPILE_CONTEXT;

import {
  impactAssessmentCollection,
  impactAssessmentGroupsCollection,
  regMapGenericCollection,
  alertsCollection,
} from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { alertsActiveFilterSqlUnqualified } from "./sql-queries";

cube(`ImpactsByGroupCube`, {
  sql: `
		SELECT
			impacts._id,
			impacts.tenantId,
			impacts.status,
			impacts.startDate,
			impacts.created,
			groupIds.groups,
			alerts.docStatus
		FROM (
			SELECT _id, tenantId, status, startDate, created
			FROM ${impactAssessmentCollection}
			WHERE ${impactAssessmentCollection}.archived = 0
				AND ${impactAssessmentCollection}.tenantId = "${tenant_id}"
		) AS impacts
		INNER JOIN (
			SELECT _id, groups
			FROM ${impactAssessmentGroupsCollection}
		) AS groupIds
			ON impacts._id = groupIds._id
		INNER JOIN (
			SELECT srcObject, destObject, tenantId
			FROM ${regMapGenericCollection}
			WHERE ${regMapGenericCollection}.archived = 0
				AND ${regMapGenericCollection}.srcType = "Alert"
				AND ${regMapGenericCollection}.destType = "ImpactAssessment"
				AND ${regMapGenericCollection}.tenantId = "${tenant_id}"
		) AS Maps
			ON impacts._id = Maps.destObject
		INNER JOIN (
			SELECT _id, tenantId, \`info.docStatus\` AS docStatus
			FROM ${alertsCollection}
			WHERE tenantId = "${tenant_id}"
				AND ${alertsActiveFilterSqlUnqualified}
		) AS alerts
			ON CAST(Maps.srcObject AS CHAR) = CAST(alerts._id AS CHAR)
	`,

  sqlAlias: `IAGrCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Groups: {
      relationship: `belongsTo`,
      sql: `CAST(${CUBE.groups} AS CHAR) = CAST(${Groups._id} AS CHAR)
				AND ${CUBE}.tenantId = ${Groups}.tenantId`,
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
