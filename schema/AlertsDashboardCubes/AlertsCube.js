import { alertsCollection } from "./collections";
import {
  CUBE_REFRESH_KEY_TIME,
  PRE_AGG_REFRESH_KEY_TIME,
} from "./cube-constants";

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
		WHERE ${alertsCollection}.archived = 0
	`,

  sqlAlias: `AlCube`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME,
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
    },
    Corpus: {
      relationship: `belongsTo`,
      sql: `${CUBE.infoRepo} = ${Corpus.id}`,
    },
    Jurisdiction: {
      relationship: `hasOne`,
      sql: `${CUBE.jurisdiction} = ${Jurisdiction.jurisdictionId}`,
    },
    AlertStatusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.status} = ${AlertStatusCube.statusId} AND ${CUBE.tenantId} = ${AlertStatusCube.tenantId} AND ${AlertStatusCube.active} = 1 AND ${AlertStatusCube.isExcluded} = 0`,
    },
  },

  preAggregations: {
    alertsByCorpusRollUp: {
      sqlAlias: "alByCorpRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsCube.count],
      dimensions: [
        Tenants.tenantId,
        AlertsCube.alertCategory,
        Corpus.name,
        Corpus.id,
        AlertStatusCube.statusId,
        AlertStatusCube.statusName,
      ],
      timeDimension: AlertsCube.publishedDate,
      granularity: `day`,
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
    alertsByJurisdictionRollUp: {
      sqlAlias: "alByJuDoc",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        AlertsCube.introducedDocStatus,
        AlertsCube.originDocStatus,
        AlertsCube.secondBodyStatus,
        AlertsCube.sentForSignatureStatus,
        AlertsCube.diedStatus,
        AlertsCube.becameLawStatus,
        AlertsCube.statuteStatus,
        AlertsCube.regulationStatus,
        AlertsCube.ruleStatus,
        AlertsCube.proposedRuleStatus,
        AlertsCube.agencyUpdateStatus,
        AlertsCube.totalBillsDocStatusCount,
      ],
      dimensions: [
        Tenants.tenantId,
        Jurisdiction.displayName,
        Jurisdiction.shortName,
        Jurisdiction.jurisdictionId,
        AlertsCube.alertCategory,
        AlertStatusCube.statusId,
        AlertStatusCube.statusName,
        AlertsCube.docStatus,
      ],
      timeDimension: AlertsCube.publishedDate,
      granularity: `day`,
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
    billsByJurisdictionRollUp: {
      sqlAlias: "actBillsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsCube.count],
      dimensions: [
        Tenants.tenantId,
        Jurisdiction.displayName,
        Jurisdiction.shortName,
        Jurisdiction.jurisdictionId,
        AlertsCube.alertCategory,
        AlertStatusCube.statusId,
        AlertStatusCube.statusName,
      ],
      timeDimension: AlertsCube.publishedDate,
      granularity: `day`,
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
    agencyUpdatesDocStatus: {
      sqlAlias: "agencyUpDocRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        AlertsCube.bulletinsReportCount,
        AlertsCube.calendarCount,
        AlertsCube.enfActionsCount,
        AlertsCube.feedDocStatus,
        AlertsCube.infoGuidanceCount,
        AlertsCube.newsPressCount,
        AlertsCube.noticeCount,
        AlertsCube.proposedRuleCount,
        AlertsCube.publicNoticesCount,
        AlertsCube.publicationCommCount,
        AlertsCube.ruleCount,
        AlertsCube.ruleMakingCount,
        AlertsCube.settlementsCount,
        AlertsCube.presidentialDocument,
        AlertsCube.totalAUDocStatusCount,
      ],
      dimensions: [
        Tenants.tenantId,
        Jurisdiction.shortName,
        Jurisdiction.jurisdictionId,
        Jurisdiction.displayName,
        AlertsCube.alertCategory,
        AlertsCube.docStatus,
      ],
      timeDimension: AlertsCube.publishedDate,
      granularity: `day`,
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
    feedPerJurisdictionRollUp: {
      sqlAlias: "feedRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [AlertsCube.feedCount],
      dimensions: [
        Tenants.tenantId,
        Jurisdiction.displayName,
        AlertsCube.feedName,
        AlertsCube.alertCategory,
        AlertStatusCube.statusId,
      ],
      timeDimension: AlertsCube.publishedDate,
      granularity: `month`,
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
    totalBillsDocStatusCount: {
      sql: `${introducedDocStatus} + ${originDocStatus} + ${secondBodyStatus} + ${sentForSignatureStatus} + ${becameLawStatus} + ${diedStatus}`,
      type: `number`,
    },
    bulletinsReportCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Bulletins/Reports'`,
        },
      ],
    },
    calendarCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Calendar'`,
        },
      ],
    },
    enfActionsCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Enforcement Actions'`,
        },
      ],
    },
    feedDocStatus: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Feed'`,
        },
      ],
    },
    infoGuidanceCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Information and Guidance'`,
        },
      ],
    },
    newsPressCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'News/Press Releases'`,
        },
      ],
    },
    noticeCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Notice'`,
        },
      ],
    },
    proposedRuleCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus= 'Proposed Rule'`,
        },
      ],
    },
    publicNoticesCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Public Notices'`,
        },
      ],
    },
    publicationCommCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Publications/Communications'`,
        },
      ],
    },
    ruleCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Rule'`,
        },
      ],
    },
    ruleMakingCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Rulemaking'`,
        },
      ],
    },
    settlementsCount: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Settlements'`,
        },
      ],
    },
    presidentialDocument: {
      sql: `docStatus`,
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.docStatus = 'Presidential Document'`,
        },
      ],
    },
    totalAUDocStatusCount: {
      sql: `${bulletinsReportCount} + ${calendarCount} +
			 ${enfActionsCount} + ${feedDocStatus} 
			 + ${infoGuidanceCount} + ${newsPressCount} + ${noticeCount} 
			 + ${proposedRuleCount} + ${publicNoticesCount} + ${publicationCommCount}
			 + ${ruleCount} + ${ruleMakingCount} + ${settlementsCount} + ${presidentialDocument}`,
      type: `number`,
    },
    feedCount: {
      sql: `status`,
      type: `count`,
      title: "In Process Feed count",
      filters: [{ sql: `${CUBE.srcType} = 'FEED'` }],
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
    infoRepo: {
      sql: `${CUBE}.\`infoRepo\``,
      type: `string`,
      title: `Info repo`,
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
