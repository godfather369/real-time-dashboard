import {impactAssessmentCollection} from './collections';
import { IMPACT_ASSESSMENT_CUBE_REFRESH_KEY_TIME, IMPACT_ASSESSMENT_CUBE_PRE_AGG_REFRESH_KEY} from './cube-constants';

cube(`ImpactAssessmentCube`, {
  sql: `SELECT * FROM ${impactAssessmentCollection} where ${impactAssessmentCollection}.archived=0`,

  sqlAlias: `impAsCube`,

  refreshKey: {
    every: IMPACT_ASSESSMENT_CUBE_REFRESH_KEY_TIME
  },

  joins: {
		Tenants: {
      relationship: `hasOne`,
      sql :`${CUBE.tenantId} = ${Tenants.tenantId}` 
    },
		ImpactAssessmentOwnersCube: {
      relationship: `belongsTo`,
      sql: `${CUBE._id} = ${ImpactAssessmentOwnersCube._id}`
    }
  },

  preAggregations: {
    impactAssessmentByStatusRollUp: {
      sqlAlias: "iaByStatus",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        ImpactAssessmentCube.inProcess,
        ImpactAssessmentCube.new,
        ImpactAssessmentCube.closed
      ],
      timeDimension: ImpactAssessmentCube.startDate,
      granularity: `month`,
      buildRangeStart: {
        sql: `SELECT NOW() - interval '365 day'`,
      },
      buildRangeEnd: {
        sql: `SELECT NOW()`,
      },
      refreshKey: {
        every: IMPACT_ASSESSMENT_CUBE_PRE_AGG_REFRESH_KEY
      }
    }
  },

  measures: {
    count: {
      type: `count`
    },
    inProcess: {
      sql: `${CUBE}.\`status\``,
      type: 'count',
      title: "InProcess",
      filters: [
        {
        sql: `${CUBE}.status = 'In Process'`
        }
      ]
    },
    new: {
      sql: `status`,
      type: 'count',
      title: "New",
      filters: [
        {
        sql: `${CUBE}.status ='New'`
        }
      ]
    },
    closed: {
      sql: `status`,
      type: 'count',
      title: "Closed",
      filters: [
        {
        sql: `${CUBE}.status = 'Closed'`
        }
      ]
    }
  },

  dimensions: {
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`
    },
		startDate: {
      sql: `${CUBE}.\`startDate\``,
      type: `time`
    },
		_id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true
    },
    status: {
      sql: `${CUBE}.\`status\``,
      type: `string`
    },
    
  },

  dataSource: `default`,
});
