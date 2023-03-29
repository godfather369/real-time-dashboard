import {
  impactAssessmentCollection,
  impactAssessmentGroupsCollection,
  groupCollection
} from "./collections";
import {
  IMPACT_ASSESSMENT_CUBE_REFRESH_KEY_TIME,
  IMPACT_ASSESSMENT_IMPACTED_TEAM_CUBE_PRE_AGG_REFRESH_KEY
} from "./cube-constants";

cube(`ImpactAssessmentGroupCube`, {
  sql: `SELECT * FROM 
	(SELECT * FROM (SELECT _id, created,tenantId,status FROM ${impactAssessmentCollection} WHERE ${impactAssessmentCollection}.archived=0) 
		as impactAssesment LEFT JOIN 
	(SELECT _id as Id , groups FROM ${impactAssessmentGroupsCollection}) 
	as groupIds on impactAssesment._id = groupIds.Id  )
		as impactGroupCube
	 INNER JOIN (SELECT _id as grpId , name FROM ${groupCollection}) 
		as groups on impactGroupCube.groups = groups.grpId`,

  sqlAlias: `ImpGrpCube`,

  refreshKey: {
    every: IMPACT_ASSESSMENT_CUBE_REFRESH_KEY_TIME
  },

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql: `${CUBE.tenantId} = ${Tenants.tenantId}`
    }
  },

  preAggregations: {
    ImpactsByGroupssRollUp: {
      sqlAlias: "ImpByGrpsRP",
      type: `rollup`,
      external: true,
      scheduledRefresh: true,
      measures: [
        ImpactAssessmentGroupCube.open,
        ImpactAssessmentGroupCube.New,
        ImpactAssessmentGroupCube.inProcess,
        ImpactAssessmentGroupCube.closed
      ],
      dimensions: [Tenants.tenantId, ImpactAssessmentGroupCube.name],
      timeDimension: ImpactAssessmentGroupCube.created,
      granularity: `day`,
      buildRangeStart: {
        sql: `SELECT NOW() - interval '365 day'`
      },
      buildRangeEnd: {
        sql: `SELECT NOW()`
      },
      refreshKey: {
        every: IMPACT_ASSESSMENT_IMPACTED_TEAM_CUBE_PRE_AGG_REFRESH_KEY
      }
    }
  },

  measures: {
    New :{
			sql: `status`,
			type: "count",
			title: "New",
			filters: [
				{
					sql: `${CUBE}.status ='New'`,
				},
			],
		},
		open : {
			sql: `${inProcess} + ${New}`,
      type: `number`,
      title: "open"
		},
    inProcess: {
			sql: `status`,
			type: "count",
			title: "InProcess",
			filters: [
				{
					sql: `${CUBE}.status = 'In Process'`,
				},
			],
		},
    closed: {
			sql: `status`,
			type: "count",
			title: "Closed",
			filters: [
				{
					sql: `${CUBE}.status = 'Closed'`,
				},
			],
		}
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`
    },
    created: {
      sql: `${CUBE}.\`created\``,
      type: `time`
    },
    name: {
      sql: `${CUBE}.\`name\``,
      type: `string`,
      title: `names`
    }
  },

  dataSource: `default`
});
