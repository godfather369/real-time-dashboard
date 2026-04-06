import { alertsCollection, alertMDIDCollection } from "./collections";
import { CUBE_REFRESH_KEY_TIME } from "./cube-constants";
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

  joins: {
    Jurisdiction: {
      relationship: `hasOne`,
      sql: `${CUBE.jurisdiction} = ${Jurisdiction.jurisdictionId}`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1 AND ${AlertStatusCube.isExcluded} = 0`,
    },
  },

  measures: {
    count: {
      sql: `_id`,
      type: `count`,
      title: `Count`,
    },
    introducedDocStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Introduced'`,
        },
      ],
    },
    originDocStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Passed Body of Origin'`,
        },
      ],
    },
    secondBodyStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Passed Second Body'`,
        },
      ],
    },
    sentForSignatureStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Sent for Signature'`,
        },
      ],
    },
    diedStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Died'`,
        },
      ],
    },
    becameLawStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Became Law'`,
        },
      ],
    },
    statuteStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Statute'`,
        },
      ],
    },
    regulationStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Regulation'`,
        },
      ],
    },
    ruleStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Rule' AND ${CUBE}.alertCategory = 'Laws & Regulations'`,
        },
      ],
    },
    proposedRuleStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Proposed Rule' AND ${CUBE}.alertCategory = 'Laws & Regulations'`,
        },
      ],
    },
    agencyUpdateStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.alertCategory = 'News & Publications'`,
        },
      ],
    },
    totalCount: {
      sql: `${introducedDocStatus}+
        ${originDocStatus}+
        ${secondBodyStatus}+
        ${sentForSignatureStatus}+
        ${diedStatus}+
        ${becameLawStatus}+
        ${statuteStatus}+
        ${regulationStatus}+
        ${ruleStatus}+
        ${proposedRuleStatus}+
        ${agencyUpdateStatus}`,
      type: `number`,
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
  },
});
