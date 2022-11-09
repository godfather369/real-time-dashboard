import { CONTROL_STATUS_CUBE_REFRESH_KEY_TIME } from "./cube-constants";
import { controlByStatusCollection } from "./collections";

cube(`ControlsByStatusCube`, {
	
  sql: `SELECT * FROM ${controlByStatusCollection}`,

  refreshKey: {
    every: CONTROL_STATUS_CUBE_REFRESH_KEY_TIME
  },

  sqlAlias : `ConByStatCube`,

  dimensions: {
    controlStatus: {
      sql: `${CUBE}.\`status.control.name\``,
      type: `string`,
      title: `Status`
    },
    controlId: {
      sql: `${CUBE}.\`status.control.id\``,
      type: `string`,
      primaryKey: true,
      shown: true
    },
    _id: {
      sql: `CONVERT(${CUBE}.\`_id\`,CHAR)`,
      type: `string`
    },
  },
  
  dataSource: `default`,
});
