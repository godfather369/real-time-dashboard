module.exports = {
  schemaPath: "schema",
  http: {
    cors: {
      origin: "http://localhost:8080",
    },
  },
  contextToAppId: ({ securityContext }) =>
    `CUBEJS_APP_${securityContext.tenantId}`,
  contextToApiScopes: () => ["graphql", "meta", "data", "jobs"],
  scheduledRefreshContexts: () => [
    {
      securityContext: {
        tenantId: "598b984f530bf20f645373d3",
        userId: "system",
      },
    },
  ],
};
