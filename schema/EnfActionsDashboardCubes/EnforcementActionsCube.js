import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import {
  enforcementActionsCollection,
  enforcementActionsAgencyMapCollection,
} from "./collections";

cube(`EnforcementActionsCube`, {
  sql: `
    SELECT 
      EAalerts._id,
      EAalerts.effectiveDate,
      EAalerts.tenantId,
      EAalerts.\`info.penaltyAmount.currency\`,
      EAalerts.\`info.penaltyAmount.value\`,
      EAalerts.\`info.restitutionAmount.value\`,
      EAagencyMapCube.agencyMap
    FROM (
      SELECT 
        _id,
        effectiveDate,
        tenantId,
        \`info.penaltyAmount.currency\`,
        \`info.penaltyAmount.value\`,
        \`info.restitutionAmount.value\`
      FROM ${enforcementActionsCollection} 
      WHERE ${enforcementActionsCollection}.archived = 0
    ) AS EAalerts 
    LEFT JOIN (
      SELECT _id AS Id, agencyMap 
      FROM ${enforcementActionsAgencyMapCollection}
    ) AS EAagencyMapCube 
    ON EAalerts._id = EAagencyMapCube.Id
  `,

  sqlAlias: `eARep`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    HarmonizedActionTypeCube: {
      relationship: `hasMany`,
      sql: `${CUBE._id} = ${HarmonizedActionTypeCube._id}`,
    },
    RegulationsCube: {
      relationship: `hasMany`,
      sql: `${CUBE._id} = ${RegulationsCube._id}`,
    },
    Agency: {
      relationship: `belongsTo`,
      sql: `${CUBE.agencyMap} = ${Agency._id}`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [tenantId],
    },
    netAmount: {
      sql: `
        COALESCE(CAST(${CUBE}.\`info.penaltyAmount.value\` AS DECIMAL(18,2)), 0) +
        COALESCE(CAST(${CUBE}.\`info.restitutionAmount.value\` AS DECIMAL(18,2)), 0)
      `,
      type: `sum`,
    },
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true,
    },
    effectiveDate: {
      sql: `${CUBE}.\`effectiveDate\``,
      type: `time`,
    },
    currency: {
      sql: `${CUBE}.\`info.penaltyAmount.currency\``,
      type: `string`,
      title: `currency`,
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
    agencyMap: {
      sql: `${CUBE}.\`agencyMap\``,
      type: `string`,
      title: `agencyMap`,
    },
  },
});
