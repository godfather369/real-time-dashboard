
import { agencyNamesCollection} from './collections';
import { ALERT_AGENCY_NAMES_CUBE_REFRESH_KEY_TIME  } from './cube-constants';

cube(`AlertAgencyNamesCube`, {
  sql: `SELECT * FROM ${agencyNamesCollection}`,

  sqlAlias : `AgNameCu`,

  refreshKey: {
    every: ALERT_AGENCY_NAMES_CUBE_REFRESH_KEY_TIME ,
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [agencyNames, _id]
    }
  },
  dimensions: {
    agencyNames: {
      sql: `${CUBE}.\`agencyNames\``,
      type: `string`,
      title: `agencyNames`
    },
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true
    }
  },

  dataSource: `default`
});
