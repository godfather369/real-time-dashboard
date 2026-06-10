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
			controls._id,
			configStatus.statusId,
			configStatus.statusName,
			controls.tenantId
		FROM ${controlsCollection} AS controls
		INNER JOIN (
			SELECT status, srcObject
			FROM ${regMapStatusCollection}
			WHERE ${regMapStatusCollection}.srcType = "Control"
				AND ${regMapStatusCollection}.archived = 0
		) AS mapStatus
			ON controls._id = mapStatus.srcObject
		INNER JOIN ${regConfigCollection} AS config
			ON config.tenantId = controls.tenantId
		INNER JOIN (
			SELECT _id AS ID, \`status.control.id\` AS statusId, \`status.control.name\` AS statusName
			FROM ${controlByStatusCollection}
		) AS configStatus
			ON config._id = configStatus.ID
			AND configStatus.statusId = mapStatus.status
		WHERE controls.archived = 0
	`,

  sqlAlias: `ConCube`,

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
    controlsRollUp: {
      sqlAlias: "conRollUp",
      external: true,
      measures: [ControlsCube.count],
      dimensions: [
        ControlsCube.tenantId,
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
