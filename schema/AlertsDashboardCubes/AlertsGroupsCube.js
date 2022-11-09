import { alertsGroupsCollection } from "./collections";

cube('AlertsGroupsCube', {
    sql: `SELECT * FROM ${alertsGroupsCollection}`,

    sqlAlias: `AlGpCu`,

    joins: {
        Groups: {
            relationship: 'hasOne',
            sql: `TRIM(CONVERT(${CUBE.group}, CHAR))=TRIM(CONVERT(${Groups._id}, CHAR))`
        }
    },

    dimensions: {
        group: {
            sql:`CONVERT (${CUBE}.\`groups\`,CHAR)`,
            type: `string`,
            title: `Groups`
        },
        _id: {
            sql: `CONVERT (${CUBE}.\`_id\`,CHAR)`,
            type: `string`,
            title: `id`
        }
    },
     
    dataSource: `default`
})