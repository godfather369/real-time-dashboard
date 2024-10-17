import {
    alertsCollection,
    regMapGenericCollection,
    alertsGroupsCollection,
  } from "./collections";
  
  import {
    CUBE_REFRESH_KEY_TIME,
    PRE_AGG_REFRESH_KEY_TIME,
  } from "./cube-constants";
  
  cube("QuarterlyAlertsByGroups", {
    sql: `SELECT _id, status, docStatus, created, groups, tenantId, destObject FROM
      (SELECT _id, status, docStatus, created, tenantId, groups FROM 
          (SELECT _id, status, \`info.docStatus\` as docStatus, created, tenantId FROM ${alertsCollection} WHERE ${alertsCollection}.archived=0) as alerts
          INNER JOIN
          (SELECT _id as grpAlertId, groups FROM ${alertsGroupsCollection}) as groupAlerts
          ON groupAlerts.grpAlertId=alerts._id)
      as alertsbygrps LEFT JOIN
      (SELECT srcObject, destObject, tenantId as tntId FROM ${regMapGenericCollection} 
          WHERE ${regMapGenericCollection}.archived=0  AND ${regMapGenericCollection}.destType="ImpactAssessment" AND ${regMapGenericCollection}.srcType="Alert")
      as Maps ON alertsbygrps._id = maps.srcObject`,
  
    sqlAlias: "QAlByGrps",
  
    refreshKey: {
      every: CUBE_REFRESH_KEY_TIME,
    },
  
    joins: {
      Tenants: {
        relationship: `hasOne`,
        sql: `${CUBE.tenantId} = ${Tenants.tenantId}`,
      },
      ImpactAssessmentCube: {
        relationship: `hasOne`,
        sql: `${CUBE.impId}=${ImpactAssessmentCube._id}`,
      },
      Groups: {
        relationship: `hasOne`,
        sql: `${CUBE.groupId}=${Groups._id}`,
      },
    },
  
    preAggregations: {
      quarterlyAlertsByGroupRollUp: {
        sqlAlias: "qrAlByGrp",
        type: `rollup`,
        external: true,
        scheduledRefresh: true,
        measures: [
          QuarterlyAlertsByGroups.applicable,
          QuarterlyAlertsByGroups.following,
          QuarterlyAlertsByGroups.open,
          QuarterlyAlertsByGroups.excluded,
          QuarterlyAlertsByGroups.potentialImp,
          QuarterlyAlertsByGroups.totalCount,
        ],
        dimensions: [QuarterlyAlertsByGroups.groupId, Groups.name, QuarterlyAlertsByGroups.docStatus, Tenants.tenantId],
        timeDimension: QuarterlyAlertsByGroups.created,
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
    },
  
    measures: {
      totalCount: {
        type: `count`,
        title: "Total Count",
      },
      applicable: {
        type: `count`,
        filters: [
          {
            sql: `${CUBE}.status = 'Applicable'`,
          },
        ],
      },
      following: {
        type: `count`,
        filters: [
          {
            sql: `${CUBE}.status= 'Following'`,
          },
        ],
        title: "Following",
      },
      open: {
        type: `count`,
        filters: [
          {
            sql: `${CUBE}.status= 'Unread' OR ${CUBE}.status= 'In Process'`,
          },
        ],
      },
      excluded: {
        type: `count`,
        filters: [
          {
            sql: `${CUBE}.status= 'Excluded'`,
          },
        ],
        title: "Excluded",
      },
      potentialImp: {
        type: `count`,
        filters: [
          {
            sql: `${ImpactAssessmentCube}.impactLevel ='CB - N/A' AND (${CUBE}.status='Applicable' OR ${CUBE}.status='Following')`,
          },
        ],
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
      docStatus: {
        sql: `${CUBE}.\`docStatus\``,
        type: `string`,
      },
      impId: {
        sql: `${CUBE}.\`destObject\``,
        type: `string`,
      },
      groupId: {
        sql: `${CUBE}.\`groups\``,
        type: `string`,
      },
      created: {
        sql: `${CUBE}.\`created\``,
        type: `time`,
      },
      tenantId: {
        sql: `${CUBE}.\`tenantId\``,
        type: `string`,
      },
    },
  
    dataSource: `default`,
  });
  