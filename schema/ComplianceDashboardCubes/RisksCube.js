import {
  risksCollection,
  regMapStatusCollection,
  risksByStatusCollection,
  regConfigCollection,
} from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`RisksCube`, {
  sql: `
		SELECT 
			_id, 
			statusName, 
			statusId, 
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
				FROM ${risksCollection} 
				WHERE ${risksCollection}.archived = 0
			) AS risks 
			INNER JOIN (
				SELECT 
					status, 
					srcObject 
				FROM ${regMapStatusCollection} 
				WHERE ${regMapStatusCollection}.srcType = "Risk" 
					AND ${regMapStatusCollection}.archived = 0
			) AS mapStatus 
				ON risks._id = mapStatus.srcObject
		) AS riskStatus 
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
					\`status.risk.id\` AS statusId, 
					\`status.risk.name\` AS statusName  
				FROM ${risksByStatusCollection}
			) AS configStatus 
				ON config._id = configStatus.ID
		) AS riskConfig 
			ON riskConfig.tenant = riskStatus.tenantId 
			AND riskConfig.statusId = riskStatus.status
	`,

  sqlAlias: `RiCube`,

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
    risksRollUp: {
      sqlAlias: "risRollUp",
      external: true,
      measures: [RisksCube.count],
      dimensions: [Tenants.tenantId, RisksCube.status, RisksCube.statusId],
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
