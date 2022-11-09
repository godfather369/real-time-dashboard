
import { alertsUsersCollection} from './collections';
import { ALERT_CUBE_REFRESH_KEY_TIME } from './cube-constants';

cube(`AlertsOwnersCube`, {
  sql: `SELECT * FROM ${alertsUsersCollection}`,

  sqlAlias : `AgOwCu`,

  refreshKey: {
    every: ALERT_CUBE_REFRESH_KEY_TIME ,
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
