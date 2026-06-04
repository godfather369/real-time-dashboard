import { alertsCollection, alertMDIDCollection } from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";
import { alertsActiveFilterSql } from "./sql-queries";

cube(`AlertsByGrpIds`, {
  sql: `
		SELECT 
			_id, 
			alertCategory, 
			publishedDate, 
			tenantId, 
			status, 
			jurisdiction, 
			docStatus, 
			GROUP_CONCAT(MDiD) as MDiD 
		FROM (
			SELECT 
				_id, 
				publishedDate, 
				tenantId, 
				status, 
				jurisdiction, 
				\`info.docStatus\` as docStatus,
				alertCategory 
			FROM ${alertsCollection} 
			WHERE ${alertsActiveFilterSql}
		) as alerts 
		LEFT JOIN (
			SELECT 
				_id as masterId, 
				\`mdInfo._id\` as MDiD 
			FROM ${alertMDIDCollection}
		) as masterData ON alerts._id = masterData.masterId  
		GROUP BY _id
	`,

  sqlAlias: `AlGrpIdCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {},

  preAggregations: {
    alertsByJurisdictionMdRollUp: {
      sqlAlias: "alByJuDocMd",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsByGrpIds.count],
      dimensions: [
        AlertsByGrpIds.tenantId,
        AlertsByGrpIds.jurisdiction,
        AlertsByGrpIds.customDocStatus,
        AlertsByGrpIds.alertCategory,
        AlertsByGrpIds.status,
        AlertsByGrpIds.MDiD,
      ],
      timeDimension: AlertsByGrpIds.publishedDate,
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
      sql: `_id`,
      type: `count`,
      title: `Count`,
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
    MDiD: {
      sql: `CONVERT(${CUBE}.\`MDiD\`,CHAR)`,
      type: `string`,
      title: `MDiD`,
    },
    customDocStatus: {
      sql: `
      CASE
        WHEN ${CUBE}.docStatus = 'Introduced' THEN 'Introduced'

        WHEN ${CUBE}.docStatus = 'Passed Body of Origin' THEN 'Passed Body of Origin'

        WHEN ${CUBE}.docStatus = 'Passed Second Body' THEN 'Passed Second Body'

        WHEN ${CUBE}.docStatus = 'Sent for Signature' THEN 'Sent for Signature'

        WHEN ${CUBE}.docStatus = 'Died' THEN 'Died'

        WHEN ${CUBE}.docStatus = 'Became Law' THEN 'Became Law'

        WHEN ${CUBE}.docStatus = 'Statute' THEN 'Statute'

        WHEN ${CUBE}.docStatus = 'Regulation' THEN 'Regulation'

        WHEN ${CUBE}.docStatus = 'Rule' AND ${CUBE}.alertCategory = 'Laws & Regulations' THEN 'Rule'

        WHEN ${CUBE}.docStatus = 'Proposed Rule' AND ${CUBE}.alertCategory = 'Laws & Regulations' THEN 'Proposed Rule'

        WHEN ${CUBE}.alertCategory = 'News & Publications' THEN 'Agency Update'

      END
    `,
      type: "string",
    },
  },
});
