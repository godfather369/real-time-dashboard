import {impactAssessmentImpactedTeamCollection} from './collections';
import { IMPACT_ASSESSMENT_IMPACTED_TEAM_CUBE_REFRESH_KEY_TIME} from './cube-constants';

cube(`ImpactAssessmentImpactedTeamCube`, {
    sql: `SELECT * FROM ${impactAssessmentImpactedTeamCollection} `,
    sqlAlias: `impAsTmCube`,

    refreshKey: {
        every: IMPACT_ASSESSMENT_IMPACTED_TEAM_CUBE_REFRESH_KEY_TIME
    },

    dimensions: {
        id: {
            sql: `${CUBE}.\`_id\``,
            type:`string`
        },
        impactedTeam: {
            sql: `${CUBE}.\`customAttributes.I_E_F_IMPACTED_TEAM\``,
            type: `string`
        }
    },

    dataSource: `default`
  
})
