import {
  regConfigCollection,
  impactAssessmentImpactLevelCollection,
} from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`ImpactsByLevelCube`, {
  sql: `
		SELECT
			impLevelConfig.impLevelId,
			impLevelConfig.impLevel,
			config.tenantId
		FROM ${regConfigCollection} AS config
		INNER JOIN (
			SELECT
				_id AS impLevel_Id,
				\`impactAssessment.extensions.fields.IMPACT_LEVEL.allowed_values.id\` AS impLevelId,
				\`impactAssessment.extensions.fields.IMPACT_LEVEL.allowed_values.name\` AS impLevel
			FROM ${impactAssessmentImpactLevelCollection}
		) AS impLevelConfig
			ON impLevelConfig.impLevel_Id = config._id
	`,

  sqlAlias: `ImpByLevel`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    ImpactAssessmentCube: {
      relationship: `hasMany`,
      sql: `${CUBE.tenantId} = ${ImpactAssessmentCube.tenantId} AND ${CUBE.impactLevelId}=${ImpactAssessmentCube.impactLevel}`,
    },
  },

  preAggregations: {
    impactAssessmentByLevelRollUp: {
      sqlAlias: "iaByLevel",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [ImpactAssessmentCube.count],
      dimensions: [ImpactsByLevelCube.impactLevel, ImpactsByLevelCube.tenantId],
      timeDimension: ImpactAssessmentCube.startDate,
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

  dimensions: {
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
    impactLevelId: {
      sql: `impLevelId`,
      type: `string`,
    },
    impactLevel: {
      sql: `impLevel`,
      type: `string`,
    },
  },

  dataSource: `default`,
});
