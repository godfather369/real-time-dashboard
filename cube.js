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
  scheduledRefreshContexts: () => [{}],
};
