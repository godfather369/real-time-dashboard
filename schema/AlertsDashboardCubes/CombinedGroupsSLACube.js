import {
  alertsCollection,
  regMapGenericCollection,
  impactAssessmentCollection,
  impactAssessmentGroupsCollection,
  alertsGroupsCollection,
} from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`combinedGroupsSLA`, {
  sql: `
		SELECT * FROM (
			SELECT 
				srcObject as _id, 
				groups, 
				status, 
				docStatus, 
				created, 
				tenantId, 
				impactStatus 
			FROM (
				SELECT 
					_id, 
					groups, 
					impactStatus, 
					tenantId, 
					srcObject 
				FROM (
					SELECT 
						_id, 
						groups,
						impactStatus, 
						tenantId 
					FROM (
						SELECT 
							_id, 
							groups 
						FROM ${impactAssessmentGroupsCollection}
					) AS impactGroups 
					INNER JOIN (
						SELECT 
							_id AS impactId, 
							status AS impactStatus, 
							tenantId 
						FROM ${impactAssessmentCollection} 
						WHERE ${impactAssessmentCollection}.archived = 0
					) AS impacts ON impacts.impactId = impactGroups._id
				) as groupImpacts 
				INNER JOIN (
					SELECT 
						srcObject, 
						destObject, 
						tenantId as tntId 
					FROM ${regMapGenericCollection} 
					WHERE ${regMapGenericCollection}.archived = 0 
						AND ${regMapGenericCollection}.destType = "ImpactAssessment" 
						AND ${regMapGenericCollection}.srcType = "Alert"
				) as maps ON groupImpacts._id = maps.destObject
					AND (groupImpacts.tenantId) = maps.tntId
			) as mappedImpacts 
			INNER JOIN (
				SELECT 
					alertId, 
					status, 
					docStatus, 
					created, 
					tentId 
				FROM (
					SELECT 
						_id as alertGroupId, 
						groups as alertGroup 
					FROM ${alertsGroupsCollection}
				) as alertGroups 
				INNER JOIN (
					SELECT 
						_id as alertId, 
						status, 
						\`info.docStatus\` as docStatus, 
						created, 
						tenantId as tentId 
					FROM ${alertsCollection} 
					WHERE ${alertsCollection}.archived = 0
				) as alerts ON alerts.alertId = alertGroups.alertGroupId
			) as groupAlerts ON mappedImpacts.srcObject = groupAlerts.alertId
				AND mappedImpacts.tenantId = groupAlerts.tentId
		) AS impactedAlerts 
		
		UNION
		
		SELECT 
			_id, 
			groups, 
			status, 
			docStatus, 
			created, 
			tenantId, 
			"No" as impactStatus 
		FROM (
			SELECT 
				_id, 
				groups, 
				status, 
				docStatus, 
				created, 
				tenantId, 
				destObject 
			FROM (
				SELECT 
					_id, 
					groups, 
					status, 
					docStatus, 
					created, 
					tenantId 
				FROM (
					SELECT 
						_id, 
						groups 
					FROM ${alertsGroupsCollection}
				) as groups 
				INNER JOIN (
					SELECT 
						_id as alertId, 
						status, 
						\`info.docStatus\` as docStatus, 
						created, 
						tenantId 
					FROM ${alertsCollection} 
					WHERE ${alertsCollection}.archived = 0
				) as alerts ON alerts.alertID = groups._id
			) as groupAlerts 
			LEFT JOIN (
				SELECT 
					srcObject, 
					destObject, 
					tenantId as tntId 
				FROM ${regMapGenericCollection} 
				WHERE ${regMapGenericCollection}.archived = 0 
					AND ${regMapGenericCollection}.destType = "ImpactAssessment" 
					AND ${regMapGenericCollection}.srcType = "Alert"
			) as maps ON maps.srcObject = groupAlerts._id
				AND maps.tntId = groupAlerts.tenantId
		) as mappedAlerts 
		WHERE ISNULL(mappedAlerts.destObject) = 1
	`,

  sqlAlias: `comSLA`,

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
      sql: `${CUBE.groups} = ${Groups._id}`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1`,
    },
  },

  preAggregations: {
    comGrSLARollUp: {
      sqlAlias: "comGrRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        combinedGroupsSLA.openOpen,
        combinedGroupsSLA.openClosed,
        combinedGroupsSLA.openMissing,
        combinedGroupsSLA.closedOpen,
        combinedGroupsSLA.closedClosed,
        combinedGroupsSLA.closedMissing,
        combinedGroupsSLA.open,
        combinedGroupsSLA.closed,
      ],
      dimensions: [
        Groups._id,
        Groups.name,
        Tenants.tenantId,
        combinedGroupsSLA.docStatus,
      ],
      timeDimension: combinedGroupsSLA.created,
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
    openOpen: {
      type: `count`,
      filters: [
        {
          sql: `(NOT ${AlertStatusCube}.isTerminal AND NOT ${AlertStatusCube}.isExcluded) AND (${CUBE}.impactStatus = 'New' OR ${CUBE}.impactStatus = 'In Process')`,
        },
      ],
    },
    openClosed: {
      type: `count`,
      filters: [
        {
          sql: `(NOT ${AlertStatusCube}.isTerminal AND NOT ${AlertStatusCube}.isExcluded) AND (${CUBE}.impactStatus = 'Closed')`,
        },
      ],
    },
    openMissing: {
      type: `count`,
      filters: [
        {
          sql: `(NOT ${AlertStatusCube}.isTerminal AND NOT ${AlertStatusCube}.isExcluded) AND (${CUBE}.impactStatus = 'No')`,
        },
      ],
    },
    closedOpen: {
      type: `count`,
      filters: [
        {
          sql: `(${AlertStatusCube}.isTerminal OR ${AlertStatusCube}.isExcluded) AND (${CUBE}.impactStatus = 'New' OR ${CUBE}.impactStatus = 'In Process')`,
        },
      ],
    },
    closedClosed: {
      type: `count`,
      filters: [
        {
          sql: `(${AlertStatusCube}.isTerminal OR ${AlertStatusCube}.isExcluded) AND (${CUBE}.impactStatus = 'Closed')`,
        },
      ],
    },
    closedMissing: {
      type: `count`,
      filters: [
        {
          sql: `(${AlertStatusCube}.isTerminal OR ${AlertStatusCube}.isExcluded) AND (${CUBE}.impactStatus = 'No')`,
        },
      ],
    },
    open: {
      type: `count`,
      filters: [
        {
          sql: `(NOT ${AlertStatusCube}.isTerminal AND NOT ${AlertStatusCube}.isExcluded)`,
        },
      ],
    },
    closed: {
      type: `count`,
      filters: [
        {
          sql: `(${AlertStatusCube}.isTerminal OR ${AlertStatusCube}.isExcluded)`,
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
