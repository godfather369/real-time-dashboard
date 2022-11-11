import {alertsCollection } from './collections';
import { ALERT_CUBE_REFRESH_KEY_TIME , ALERT_CUBE_PRE_AGG_REFRESH_KEY, ALERT_CUBE_PRE_AGG_REFRESH_KEY_WORKFLOW } from './cube-constants';

cube(`AlertsCube`, {
	sql : `SELECT * FROM  ${alertsCollection} where ${alertsCollection}.archived = 0`,

  sqlAlias: `AlCube`,

  refreshKey: {
    every: ALERT_CUBE_REFRESH_KEY_TIME
  },

  joins: {
		Tenants: {
      relationship: `hasOne`,
      sql :`${CUBE.tenantId} = ${Tenants.tenantId}` 
    },
    CorpusCube: {
      relationship: `belongsTo`,
      sql: `${CUBE.infoRepo}= ${CorpusCube}.id`
    },
    JurisdictionsCube: {
      relationship: `hasOne`,
      sql: `${CUBE.jurisdiction} = ${JurisdictionsCube.jurisdictionId}`
    },
		AlertAgencyNamesCube: {
      relationship: `belongsTo`,
      sql: `${CUBE._id} = ${AlertAgencyNamesCube._id}`
    },
		Users: {
				relationship: `belongsTo`,
				sql: `${CUBE.owners} = ${Users._id}`
		}
  },

  preAggregations: {
    alertsByCorpusAndStatsReportRollUp: {
      sqlAlias: "alByCorpStatRepsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        AlertsCube.unread,
        AlertsCube.applicable,
        AlertsCube.inProcess,
        AlertsCube.totalCount
      ],
      dimensions: [
        Tenants.tenantId,
        AlertsCube.alertCategory,
        CorpusCube.corpusName
      ],
      timeDimension: AlertsCube.publishedDate,
      granularity: `day`,
      buildRangeStart: {
        sql: `SELECT NOW() - interval '365 day'`
      },
      buildRangeEnd: {
        sql: `SELECT NOW()`
      },
      refreshKey: {
        every: ALERT_CUBE_PRE_AGG_REFRESH_KEY
      }
    },
    alertsByAgencyRollUp: {
      sqlAlias: "alByAgencyRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        AlertsCube.unread,
        AlertsCube.applicable,
        AlertsCube.inProcess,
        AlertsCube.totalCount
      ],
      dimensions: [
        Tenants.tenantId,
        AlertsCube.alertCategory,
        AlertAgencyNamesCube.agencyNames
      ],
      timeDimension: AlertsCube.publishedDate,
      granularity: `day`,
      buildRangeStart: {
        sql: `SELECT NOW() - interval '365 day'`
      },
      buildRangeEnd: {
        sql: `SELECT NOW()`
      },
      refreshKey: {
        every: ALERT_CUBE_PRE_AGG_REFRESH_KEY
      },
		},
    feedPerJurisdictionRollUp: {
      sqlAlias: "feedRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        AlertsCube.feedCount
      ],
      dimensions: [
        Tenants.tenantId,
        JurisdictionsCube.displayName,
        AlertsCube.feedName,
        AlertsCube.alertCategory
      ],
      timeDimension: AlertsCube.publishedDate,
      granularity: `month`,
      buildRangeStart: {
        sql: `SELECT NOW() - interval '365 day'`
      },
      buildRangeEnd: {
        sql: `SELECT NOW()`
      },
      refreshKey: {
        every: ALERT_CUBE_PRE_AGG_REFRESH_KEY
      }
    },
    activeBillsByJurisdictionRollUp: {
      sqlAlias: "actBillsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        AlertsCube.unreadBillsCount,
        AlertsCube.applicableBillsCount,
        AlertsCube.inProcessBillsCount,
				AlertsCube.totalBillsCount
      ],
      dimensions: [
        Tenants.tenantId,
        JurisdictionsCube.displayName,
        AlertsCube.alertCategory
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
        every: ALERT_CUBE_PRE_AGG_REFRESH_KEY
      }
    },
		alertRulePerJurisdictionRollUp :{
			sqlAlias: "alRuleJuRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
			measures: [
				AlertsCube.unread,
        AlertsCube.applicable,
        AlertsCube.inProcess,
        AlertsCube.totalCount
      ],
      dimensions: [
        AlertsCube.alertType,
				JurisdictionsCube.displayName
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
        every: ALERT_CUBE_PRE_AGG_REFRESH_KEY
      }
		}
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [alertCategory]
    },
    unread: {
      type: `count`,
      sql: `status`,
      title: `unread`,
      filters: [{ sql: `${CUBE}.status = 'Unread'` }]
    },
    excluded: {
      type: `count`,
      sql: `status`,
      title: `excluded`,
      filters: [{ sql: `${CUBE}.status = 'Excluded'` }]
    },
    applicable: {
      type: `count`,
      sql: `status`,
      title: `Applicable`,
      filters: [{ sql: `${CUBE}.status = 'Applicable'` }]
    },
    inProcess: {
      type: `count`,
      sql: `status`,
      title: `inProcess`,
      filters: [{ sql: `${CUBE}.status = 'In Process'` }]
    },
    totalCount: {
      sql: `${unread} + ${applicable} + ${inProcess}`,
      type: `number`,
      title: "totalCount"
    },
		feedCount: {
      sql: `status`,
      type: `count`,
      title: "In Process Feed count",
      filters: [
        { sql: `${CUBE}.status != 'Excluded' and ${CUBE.srcType} = 'FEED'` }
      ]
    },
		unreadBillsCount: {
      sql: `status`,
      type: `count`,
      title: "Unread Bills count",
      filters: [
        {
          sql: `${CUBE}.status = 'Unread' and ${CUBE.alertCategory} = 'Bills'`
        }
      ]
    },
		inProcessBillsCount: {
      sql: `status`,
      type: `count`,
      title: "In Process Bills count",
      filters: [
        {
          sql: `${CUBE}.status = 'In Process' and ${CUBE.alertCategory} = 'Bills'`
        }
      ]
    },
		applicableBillsCount: {
      sql: `status`,
      type: `count`,
      title: "Applicable Bills count",
      filters: [
        {
          sql: `${CUBE}.status = 'Applicable' and ${CUBE.alertCategory} = 'Bills'`
        }
      ]
    },
		totalBillsCount: {
      sql: `${unreadBillsCount} + ${applicableBillsCount} + ${inProcessBillsCount}`,
      type: `number`,
      title: "billsCount",
    },
  },

  dimensions: {
    jurisdiction: {
      sql: `${CUBE}.\`jurisdiction\``,
      title: `juridiction`,
      type: `string`
    },
    infoRegioncode: {
      sql: `${CUBE}.\`info.regionCode\``,
      type: `string`,
      title: `Info regioncode`
    },
    infoRepo: {
      sql: `${CUBE}.\`info.repo\``,
      type: `string`,
      title: `Info repo`
    },
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true
    },
    owner: {
      sql: `${CUBE}.\`owner\``,
      type: `string`
    },
    status: {
      sql: `${CUBE}.\`status\``,
      type: `string`
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`
    },
    publishedDate: {
      sql: `${CUBE}.\`publishedDate\``,
      type: `time`
    },
    alertCategory: {
      sql: `${CUBE}.\`alertCategory\``,
      type: `string`,
      title: `Alert Category`
    },
    feedName: {
      sql: `${CUBE}.\`meta.feedName\``,
      type: `string`,
      title: `Feed Name`
    },
    srcType: {
      sql: `${CUBE}.\`meta.srcType\``,
      type: `string`,
      title: `Source Type`
    },
    alertType: {
      sql: `${CUBE}.\`alertType\``,
      type: `string`,
      title: `Alert Rule`
    },
		owners: {
      sql: `${CUBE}.\`owners\``,
      type: `string`,
      title: `owners`
    }
  },

  dataSource: `default`,
});
