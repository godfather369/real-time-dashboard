import  { regMapStatusCollection } from "./collections";
import {  MAP_STATUS_CUBE_REFRESH_KEY_TIME , MAP_STATUS_CUBE_PRE_AGG_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MapStatusCube`, {
  sql: `SELECT * FROM ${regMapStatusCollection} where ${regMapStatusCollection}.archived = 0 `,

  refreshKey: {
    every: MAP_STATUS_CUBE_REFRESH_KEY_TIME 
  },

  sqlAlias: `MapStCube`,

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql :`${CUBE.tenantId} = ${Tenants.tenantId}` 
    },
    Users: {
      relationship: `belongsTo`,
      sql: `TRIM(CONVERT(${CUBE.owner}, CHAR)) = TRIM(CONVERT(${Users._id}, CHAR))`
    },
    RisksCube: {
      relationship: `hasOne`,
      sql: `${CUBE.srcObject}= ${RisksCube._id}`,
    },
    TasksCube: {
      relationship: `hasOne`,
      sql: `${CUBE.srcObject} = ${TasksCube._id}`,
    },
    ControlsCube: {
      relationship: `hasOne`,
      sql: `${CUBE.srcObject}= ${ControlsCube._id}`,
    },
    ControlsByStatusCube: {
      relationship: `hasOne`,
      sql: `${MapStatusCube.status} = ${ControlsByStatusCube.controlId}`,
    },
    RisksByStatusCube: {
      relationship: `hasOne`,
      sql: `${MapStatusCube.status} = ${RisksByStatusCube.riskId}`,
    },
    TasksByStatusCube: {
      relationship: `hasOne`,
      sql: `${MapStatusCube.status} = ${TasksByStatusCube.taskId}`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [status,srcType]
    }
  },

  preAggregations: {
    controlsRollUp: {
      sqlAlias: "conRollUp",
      external: true,
      measures: [MapStatusCube.count],
      dimensions: [Tenants.tenantId,ControlsByStatusCube.controlStatus],
      segments: [MapStatusCube.controlType],
      scheduledRefresh: true,
      refreshKey: {
        every:MAP_STATUS_CUBE_PRE_AGG_REFRESH_KEY_TIME,
      },
    },
    risksRollUp: {
      sqlAlias: "risRollUp",
      external: true,
      measures: [MapStatusCube.count],
      dimensions: [Tenants.tenantId, RisksByStatusCube.riskStatus],
      segments: [MapStatusCube.riskType],
      scheduledRefresh: true,
      refreshKey: {
        every: MAP_STATUS_CUBE_PRE_AGG_REFRESH_KEY_TIME,
      },
    },
    tasksRollUp: {
      sqlAlias: "tskRollUp",
      external: true,
      measures: [MapStatusCube.count],
      dimensions: [Tenants.tenantId, TasksByStatusCube.taskStatus],
      segments: [MapStatusCube.taskType],
      scheduledRefresh: true,
      refreshKey: {
        every: MAP_STATUS_CUBE_PRE_AGG_REFRESH_KEY_TIME,
      },
    },
  },

  segments: {
    riskType: {
      sql: `${CUBE}.\`srcType\` = 'Risk' and ${RisksCube}.archived = 0 and ${ConfigCube.tenantId} = ${MapStatusCube.tenantId} and ${MapStatusCube.status} = ${RisksByStatusCube.riskId}`,
    },
    controlType: {
      sql: `${CUBE}.\`srcType\` = 'Control' and ${ControlsCube}.archived = 0 and ${ConfigCube.tenantId} = ${MapStatusCube.tenantId} and ${MapStatusCube.status} = ${ControlsByStatusCube.controlId}`,
    },
    taskType: {
      sql: `${CUBE}.\`srcType\` = 'Task' and ${TasksCube}.archived = 0 and ${ConfigCube.tenantId} = ${MapStatusCube.tenantId} and ${MapStatusCube.status} = ${TasksByStatusCube.taskId} `,
    },
  },

  dimensions: {
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`,
      primaryKey: true
    },
    status: {
      sql: `${CUBE}.\`status\` `,
      type: `string`,
      title: `Status`
    },
		srcType : {
 			sql: `${CUBE}.\`srcType\``,
      type: `string`,
      title: `Source Type`
		},
    srcObject: {
      sql: `${CUBE}.\`srcObject\``,
      type: `string`,
      title: `Source`
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
  },
  dataSource: `default`
});
