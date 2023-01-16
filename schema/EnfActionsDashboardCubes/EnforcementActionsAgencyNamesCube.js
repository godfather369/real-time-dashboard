
import {enforcementActionsAgencyNameCollection} from './collections';
import { ENFORCEMENT_CUBE_AGENCY_NAMES_REFRESH_KEY_TIME } from './cube-constants';

cube(`EnforcementActionsAgencyNamesCube`, {
  sql: `SELECT * FROM ${enforcementActionsAgencyNameCollection}`,

  sqlAlias : `EnfAcAgCube`,

  refreshKey: {
    every: ENFORCEMENT_CUBE_AGENCY_NAMES_REFRESH_KEY_TIME,
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
