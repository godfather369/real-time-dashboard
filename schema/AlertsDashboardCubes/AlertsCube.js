import { alertsCollection, } from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";
import { alertsActiveFilterSql } from "./sql-queries";

cube(`AlertsCube`, {
  sql: `
		SELECT 
			_id, 
			alertCategory, 
			publishedDate, 
			tenantId, 
			status, 
			\`info.repo\` as infoRepo, 
			\`info.docStatus\` as docStatus, 
			\`meta.srcType\` as srcType, 
			\`meta.feedName\` as feed, 
			jurisdiction 
		FROM ${alertsCollection} 
		WHERE ${alertsActiveFilterSql}
	`,

  sqlAlias: `AlCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

  preAggregations: {
    alertsCubeRollUp: {
      sqlAlias: "alCubeRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsCube.count],
      dimensions: [
        AlertsCube.tenantId,
        AlertsCube.alertCategory,
        AlertsCube.status,
        AlertsCube.corpusId,
        AlertsCube.docStatus,
        AlertsCube.jurisdiction,
        AlertsCube.srcType,
      ],
      timeDimension: AlertsCube.publishedDate,
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
    status: {
      sql: `${CUBE}.\`status\``,
      type: `string`,
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
    publishedDate: {
      sql: `${CUBE}.\`publishedDate\``,
      type: `time`,
    },
    alertCategory: {
      sql: `${CUBE}.\`alertCategory\``,
      type: `string`,
      title: `Alert Category`,
    },
    corpusId: {
      sql: `${CUBE}.\`infoRepo\``,
      type: `string`,
      title: `Corpus ID`,
    },
    docStatus: {
      sql: `${CUBE}.\`docStatus\``,
      type: `string`,
      title: `Doc Status`,
    },
    jurisdiction: {
      sql: `${CUBE}.\`jurisdiction\``,
      title: `juridiction`,
      type: `string`,
    },
    srcType: {
      sql: `${CUBE}.\`srcType\``,
      type: `string`,
      title: `Source Type`,
    },
    feedName: {
      sql: `${CUBE}.\`feed\``,
      type: `string`,
      title: `Feed Name`,
    },
  },

  dataSource: `default`,
});
