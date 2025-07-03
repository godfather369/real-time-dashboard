import {
  controlsCollection,
  regMapStatusCollection,
  controlByStatusCollection,
  regConfigCollection,
} from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`ControlsCube`, {
  sql: `
		SELECT 
			_id, 
			statusId, 
			statusName, 
			tenantId 
		FROM (
			SELECT 
				_id, 
				status, 
				tenantId 
			FROM (
				SELECT 
					_id, 
					tenantId 
				FROM ${controlsCollection} 
				WHERE ${controlsCollection}.archived = 0
			) AS controls 
			INNER JOIN (
				SELECT 
					status, 
					srcObject 
				FROM ${regMapStatusCollection} 
				WHERE ${regMapStatusCollection}.srcType = "Control" 
					AND ${regMapStatusCollection}.archived = 0
			) AS mapStatus ON controls._id = mapStatus.srcObject
		) AS controlStatus 
		INNER JOIN (
			SELECT 
				tenantId AS tenant, 
				statusId, 
				statusName 
			FROM (
				SELECT 
					_id, 
					tenantId 
				FROM ${regConfigCollection}
			) AS config 
			INNER JOIN (
				SELECT 
					_id AS ID, 
					\`status.control.id\` AS statusId, 
					\`status.control.name\` AS statusName  
				FROM ${controlByStatusCollection}
			) AS configStatus ON config._id = configStatus.ID
		) AS controlConfig ON controlConfig.tenant = controlStatus.tenantId 
			AND controlConfig.statusId = controlStatus.status
	`,

  sqlAlias: `ConCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [_id],
    },
  },

  preAggregations: {
    controlsRollUp: {
      sqlAlias: "conRollUp",
      external: true,
      measures: [ControlsCube.count],
      dimensions: [
        Tenants.tenantId,
        ControlsCube.status,
        ControlsCube.statusId,
      ],
      scheduledRefresh: true,
      refreshKey: {
        every: PRE_AGG_REFRESH_KEY_TIME,
      },
    },
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },
    status: {
      sql: `${CUBE}.\`statusName\``,
      type: `string`,
      title: `status`,
    },
    statusId: {
      sql: `${CUBE}.\`statusId\``,
      type: `string`,
      title: `statusId`,
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
  },
  dataSource: `default`,
});
