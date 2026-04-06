import {
  impactAssessmentCollection,
  impactAssessmentGroupsCollection,
  regMapGenericCollection,
  alertsCollection,
} from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { alertsActiveFilterSql } from "./sql-queries";

cube(`ImpactsByGroupCube`, {
  sql: `
		SELECT 
			_id, 
			tenantId, 
			status, 
			startDate, 
			docStatus, 
			created, 
			groups 
		FROM (
			SELECT 
				_id, 
				tenantId, 
				status, 
				startDate, 
				srcObject, 
				created, 
				groups 
			FROM (
				SELECT 
					_id, 
					tenantId, 
					startDate, 
					created, 
					status, 
					groups 
				FROM (
					SELECT 
						_id, 
						tenantId, 
						startDate, 
						created, 
						status  
					FROM ${impactAssessmentCollection} 
					WHERE ${impactAssessmentCollection}.archived = 0
				) AS impacts 
				INNER JOIN (
					SELECT 
						_id AS Id, 
						groups 
					FROM ${impactAssessmentGroupsCollection}
				) AS groupIds ON impacts._id = groupIds.Id
			) AS UserImpacts 
			INNER JOIN (
				SELECT 
					srcObject, 
					destObject 
				FROM ${regMapGenericCollection} 
				WHERE ${regMapGenericCollection}.archived = 0 
					AND ${regMapGenericCollection}.srcType = "Alert" 
					AND ${regMapGenericCollection}.destType = "ImpactAssessment"
			) AS Maps ON UserImpacts._id = Maps.destObject
		) AS mappedImpacts 
		INNER JOIN (
			SELECT 
				_id AS Id, 
				\`info.docStatus\` AS docStatus 
			FROM ${alertsCollection} 
			WHERE ${alertsActiveFilterSql}
		) AS alerts ON mappedImpacts.srcObject = alerts.Id
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
