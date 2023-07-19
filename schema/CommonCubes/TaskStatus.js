
import {tasksByStatusCollection,regConfigCollection} from './collections';
import { CUBE_REFRESH_KEY_TIME  } from './cube-constants';

cube(`TaskStatus`, {
  sql: `SELECT _id, tenantId, statusId, statusName FROM (SELECT _id, tenantId FROM ${regConfigCollection}) as config INNER JOIN (SELECT _id as ID, \`status.task.id\` as statusId, \`status.task.name\` as statusName FROM ${tasksByStatusCollection}) as taskConfig ON taskConfig.ID=config._id;`,

  sqlAlias: `TaSt`,

  refreshKey: {
    every: CUBE_REFRESH_KEY_TIME ,
  },

  dimensions: {
    _id: {
			sql: `${CUBE}.\`_id\``,
			type: `string`,
			primaryKey: true,
		},
    tenantId: {
			sql: `${CUBE}.\`tenantId\``,
			type: `string`,
		},
		statusId: {
			sql: `${CUBE}.\`statusId\``,
			type: `string`,
		},
    statusName: {
			sql: `${CUBE}.\`statusName\``,
			type: `string`,
		},	
  },

  dataSource: `default`
});
