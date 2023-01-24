
import { impactAssessmentOwnersCollection} from './collections';
import { IMPACT_ASSESSMENT_CUBE_REFRESH_KEY_TIME } from './cube-constants';

cube(`ImpactAssessmentOwnersCube`, {
  sql: `SELECT * FROM ${impactAssessmentOwnersCollection}`,

  sqlAlias : `ImAsOwnCube`,

  refreshKey: {
    every: IMPACT_ASSESSMENT_CUBE_REFRESH_KEY_TIME ,
  },

	joins :{
		Users: {
				relationship: `belongsTo`,
				sql: `TRIM(CONVERT(${CUBE.owners}, CHAR)) = TRIM(CONVERT(${Users._id}, CHAR))`
		},
	},

  dimensions: {
    owners: {
      sql: `${CUBE}.\`owners\``,
      type: `string`,
      title: `owners`
    },
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true
    }
  },

  dataSource: `default`
});
