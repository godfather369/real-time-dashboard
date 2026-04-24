import {
  regMapStatusUniregJoin,
  regMapStatusUniregJoinCC,
  CorpusJurisdictionJoin,
  RegSiteJurisdictionJoin,
} from "./sql-queries";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

cube(`CoverageByJurisdictionCube`, {
  sql: `
		SELECT 
			_id,
			tenantId,
			displayName,
			status,
			mdIds 
		FROM (
			SELECT 
				_id,
				tenantId,
				repo,
				status,
				mdIds 
			FROM ${regMapStatusUniregJoin}
		) AS RegMapUniregJoin
		LEFT JOIN (
			SELECT 
				id,
				displayName,
				tenantId as tenant 
			FROM ${CorpusJurisdictionJoin}
		) AS CorpJuris
		ON RegMapUniregJoin.repo = CorpJuris.id 
		AND RegMapUniregJoin.tenantId = CorpJuris.tenant
		UNION ALL
		SELECT 
			_id,
			tenantId,
			displayName,
			status,
			mdIds 
		FROM (
			SELECT 
				_id,
				tenantId,
				uid,
				status,
				mdIds 
			FROM ${regMapStatusUniregJoinCC}
		) AS RegMapCC
		LEFT JOIN (
			SELECT 
				regSiteUid,
				displayName,
				tenantId as tenant 
			FROM ${RegSiteJurisdictionJoin}
		) AS SiteJuris
		ON RegMapCC.uid = SiteJuris.regSiteUid 
		AND RegMapCC.tenantId = SiteJuris.tenant
	`,

  sqlAlias: `CvrgByJurCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

  preAggregations: {
    CoverageByJurisdictionRollUp: {
      sqlAlias: "covJurisRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [CoverageByJurisdictionCube.count],
      dimensions: [
        CoverageByJurisdictionCube.jurisdictionName,
        CoverageByJurisdictionCube.status,
        CoverageByJurisdictionCube.mdIds,
        CoverageByJurisdictionCube.tenantId,
      ],
      refreshKey: {
        every: PRE_AGG_REFRESH_KEY_TIME,
      },
    },
  },

  measures: {
    count: {
      sql: `_id`,
      type: `count`,
    },
  },

  dimensions: {
    _id: {
      sql: `_id`,
      type: `string`,
      primaryKey: true,
    },
    tenantId: {
      sql: `tenantId`,
      type: `string`,
    },
    jurisdictionName: {
      sql: `displayName`,
      type: `string`,
    },
    status: {
      sql: `status`,
      type: `string`,
    },
    mdIds: {
      sql: `mdIds`,
      type: `string`,
    },
  },

  dataSource: `default`,
});
