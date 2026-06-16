const mysql = require("mysql2/promise");

const defaultTenantId = "598b984f530bf20f645373d3";
const MAX_CONCURRENT_REFRESH_TENANTS = parseInt(
  process.env.CUBEJS_MAX_REFRESH_TENANTS || "5",
  10
);

module.exports = {
  schemaPath: "schema",
  http: {
    cors: {
      origin: "http://localhost:8080",
    },
  },

  contextToAppId: ({ securityContext }) =>
    `CUBEJS_APP_${securityContext?.tenantId || "default"}`,
  contextToApiScopes: () => ["graphql", "meta", "data", "jobs", "sql"],
  scheduledRefreshContexts: async () => {
    try {
      const connection = await mysql.createConnection({
        host: process.env.CUBEJS_DB_HOST,
        port: parseInt(process.env.CUBEJS_DB_PORT, 10),
        user: process.env.CUBEJS_DB_USER,
        password: process.env.CUBEJS_DB_PASS,
        database: process.env.CUBEJS_DB_NAME,
        ...(process.env.CUBEJS_DB_SSL === "true"
          ? { ssl: { rejectUnauthorized: false } }
          : {}),
      });

      const [rows] = await connection.execute(
        "SELECT _id FROM `RegHub`.`tenants`"
      );
      await connection.end();

      const tenantIds = [
        defaultTenantId,
        ...rows.map((r) => r._id).filter((id) => id !== defaultTenantId),
      ];

      const activeTenants = tenantIds.slice(0, MAX_CONCURRENT_REFRESH_TENANTS);

      return activeTenants.map((tenantId) => ({
        securityContext: { tenantId, userId: "system" },
      }));
    } catch (e) {
      console.error(
        "Failed to fetch tenant IDs for scheduled refresh, falling back to default:",
        e.message
      );
      return [
        { securityContext: { tenantId: defaultTenantId, userId: "system" } },
      ];
    }
  },
};
