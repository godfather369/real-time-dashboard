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
			risks._id,
			configStatus.statusName,
			configStatus.statusId,
			risks.tenantId
		FROM ${risksCollection} AS risks
		INNER JOIN (
			SELECT status, srcObject
			FROM ${regMapStatusCollection}
			WHERE ${regMapStatusCollection}.srcType = "Risk"
				AND ${regMapStatusCollection}.archived = 0
		) AS mapStatus
			ON risks._id = mapStatus.srcObject
		INNER JOIN ${regConfigCollection} AS config
			ON config.tenantId = risks.tenantId
		INNER JOIN (
			SELECT _id AS ID, \`status.risk.id\` AS statusId, \`status.risk.name\` AS statusName
			FROM ${risksByStatusCollection}
		) AS configStatus
			ON config._id = configStatus.ID
			AND configStatus.statusId = mapStatus.status
		WHERE risks.archived = 0
	`,

  sqlAlias: `RiCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

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
      dimensions: [RisksCube.tenantId, RisksCube.status, RisksCube.statusId],
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
