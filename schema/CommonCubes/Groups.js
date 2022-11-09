import { groupsCollection } from "./collections";
import { USER_CUBE_REFRESH_KEY_TIME } from "./cube-constants";

cube(`Groups`, {
    sql: `SELECT * FROM ${groupsCollection}`,
    sqlAlias: `Grps`, 

    refreshKey: {
        every: USER_CUBE_REFRESH_KEY_TIME
    },
    
    joins: {
        Tenants: {
          relationship: `belongsTo`,
          sql: `${CUBE.tenantId} = ${Tenants.tenantId}`
        }
    },

    measures: {
        count: {
            type: `count`,
            sql: `_id`
        }
    },

    dimensions: {
        _id: {
            sql: `CONVERT(${CUBE}.\`_id\`, CHAR)`,
            type: `string`,
            primaryKey: true,
            shown: true
        },
        fullName: {
            sql: `${CUBE}.\`name\``,
            type: `string`,
            title: `Full Name`
        }
    }
})