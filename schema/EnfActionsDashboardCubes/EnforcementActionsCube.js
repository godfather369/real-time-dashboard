import { CUBE_REFRESH_KEY_TIME , PRE_AGG_REFRESH_KEY_TIME } from "./cube-constants";
import { enforcementActionsCollection, enforcementActionsAgencyMapCollection } from "./collections"

cube(`EnforcementActionsCube`, {
  sql: `SELECT * FROM 
	(SELECT * FROM (SELECT * FROM ${enforcementActionsCollection} where ${enforcementActionsCollection}.archived=0) as EAalerts LEFT JOIN 
	(SELECT _id as Id , agencyMap FROM ${enforcementActionsAgencyMapCollection}) as EAagencyMapCube ON EAalerts._id = EAagencyMapCube.Id ) as EAalertsCubeJoin`,
  
  sqlAlias: `eARep`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME
  },

  joins: {
    Tenants: {
			relationship: `hasOne`,
			sql :`${CUBE.tenantId} = ${Tenants.tenantId}` 
		},
		Users: {
      relationship: `belongsTo`,
      sql: `TRIM(CONVERT(${CUBE.owner}, CHAR)) = TRIM(CONVERT(${Users._id}, CHAR))`
    },
		HarmonizedActionTypeCube : {
			relationship: `hasMany`,
			sql: `${CUBE._id} = ${HarmonizedActionTypeCube._id}`
		},
		RegulationsCube: {
      relationship: `hasMany`,
      sql: `${CUBE._id} = ${RegulationsCube._id}`
    },
    Agency: {
      relationship: `belongsTo`,
      sql: `${CUBE.agencyMap} = ${Agency._id}`
    },
  },

  preAggregations: {
    //roll up for # of enforcement actions and enforcement actions report 
    enforcementActionsAndPenaltiesReportRollUp : {
      sqlAlias: `enfAcPenRepRP`,
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [EnforcementActionsCube.count , EnforcementActionsCube.netAmount],
      dimensions: [
        EnforcementActionsCube.agencyMap,
        Agency.shortCode,
        Agency.agencyNames,
        EnforcementActionsCube.currency,
        Tenants.tenantId
      ],
      timeDimension: EnforcementActionsCube.effectiveDate,
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
    actionsByAgencyRollUpJoin: {
      sqlAlias: `HAGroll`,
      type: `rollup`,
      external: true,
			scheduledRefresh: true,
      measures: [EnforcementActionsCube.count],
      dimensions: [
        EnforcementActionsCube.agencyMap,
        Agency.shortCode,
        Agency.agencyNames,
        HarmonizedActionTypeCube.harmonizedActionType,
        Tenants.tenantId
      ],
      timeDimension: EnforcementActionsCube.effectiveDate,
      granularity: `day`,
      buildRangeStart: {
        sql: `SELECT NOW() - interval '365 day'`
      },
      buildRangeEnd: {
        sql: `SELECT NOW()`
      },
      refreshKey: {
        every: PRE_AGG_REFRESH_KEY_TIME
      }
    },
		authDocImpactedRollUp: {
      sqlAlias: `auDocRoll`,
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [EnforcementActionsCube.count],
      dimensions: [
        RegulationsCube.authoritativeDocuments,
        RegulationsCube.citations,
        RegulationsCube._id,
        Tenants.tenantId
      ],
      timeDimension: EnforcementActionsCube.effectiveDate,
      granularity: `day`,
      refreshKey: {
        every: PRE_AGG_REFRESH_KEY_TIME,
      },
      buildRangeStart: {
        sql: `SELECT NOW() - interval '365 day'`,
      },
      buildRangeEnd: {
        sql: `SELECT NOW()`,
      },
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [tenantId]
    },
    netAmount: {
      sql: `COALESCE(${CUBE}.\`info.penaltyAmount.value\` + ${CUBE}.\`info.restitutionAmount.value\`, ${CUBE}.\`info.restitutionAmount.value\`, ${CUBE}.\`info.penaltyAmount.value\` , 0) `,
      type: `sum`
    }
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true
    },
    effectiveDate: {
      sql: `${CUBE}.\`effectiveDate\``,
      type: `time`
    },
    currency: {
      sql: `${CUBE}.\`info.penaltyAmount.currency\``,
      type: `string`,
			title : `currency`
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`
    },
    agencyMap: {
      sql: `${CUBE}.\`agencyMap\``,
      type: `string`,
      title: `agencyMap`
    }
  }
});
