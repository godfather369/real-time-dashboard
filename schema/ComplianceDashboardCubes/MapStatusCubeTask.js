import  { regMapStatusCollection , tasksCollection  } from "./collections";
import {  MAP_STATUS_CUBE_REFRESH_KEY_TIME , MAP_STATUS_CUBE_PRE_AGG_REFRESH_KEY_TIME } from "./cube-constants";

cube(`MapStatusCubeTask`, {
  sql: `SELECT status   , tenantId , _id  FROM
		  (SELECT _id ,srcObject,status,tenantId FROM ${regMapStatusCollection} 
			where  ${regMapStatusCollection}.archived = 0
			and ${regMapStatusCollection}.srcType = 'Task') AS MapStatusCube   
			INNER JOIN (SELECT  _id as id FROM ${tasksCollection} where 
			${tasksCollection}.archived = 0) 
			AS  TasksCube ON   TasksCube.id = MapStatusCube.srcObject `,

  refreshKey: {
    every: MAP_STATUS_CUBE_REFRESH_KEY_TIME 
  },

  sqlAlias: `MapStCube`,

  joins: {
    Tenants: {
      relationship: `hasOne`,
      sql :`${CUBE.tenantId} = ${Tenants.tenantId}` 
    }
  },

  measures: {
    count: {
      type: `count`,
    }
  },

  preAggregations: {
    tasksRollUp: {
      sqlAlias: "tskRollUp",
      external: true,
      measures: [MapStatusCubeTask.count],
      dimensions: [Tenants.tenantId , MapStatusCubeTask.status],
      scheduledRefresh: true,
      refreshKey: {
        every: MAP_STATUS_CUBE_PRE_AGG_REFRESH_KEY_TIME,
      },
    },
  },

  dimensions: {
    _id: {
      sql: `${CUBE}.\`_id\``,
      type: `string`,
      primaryKey: true
    },
    status: {
      sql: `${CUBE}.\`status\` `,
      type: `string`,
      title: `Status`
    },
    tenantId: {
      sql: `${CUBE}.\`tenantId\``,
      type: `string`,
    },
  },
  dataSource: `default`
});
