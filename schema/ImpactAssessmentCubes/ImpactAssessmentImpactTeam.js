import {
  impactAssessmentCollection,
  impactAssessmentImpactedTeamCollection,
} from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`ImpactsByTeamCube`, {
  sql: `
		SELECT * 
		FROM (
			SELECT 
				_id, 
				tenantId, 
				startDate  
			FROM ${impactAssessmentCollection} 
			WHERE ${impactAssessmentCollection}.archived = 0
		) AS impacts 
		INNER JOIN (
			SELECT 
				_id AS Id, 
				\`customAttributes.I_E_F_IMPACTED_TEAM\` AS team 
			FROM ${impactAssessmentImpactedTeamCollection}
		) AS teamIds 
		ON impacts._id = teamIds.Id
	`,

  sqlAlias: `IAITCube`,

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
    team: {
      sql: `team`,
      type: `string`,
      title: `team`,
    },
  },

  dataSource: `default`,
});
