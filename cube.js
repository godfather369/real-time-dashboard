module.exports = {
  http: {
    cors: {
      origin: "http://localhost:8080",
    },
  },
  contextToAppId: ({ securityContext }) =>
    `CUBEJS_APP_${securityContext?.tenantId || "default"}_${securityContext?.userId || "default"}`,
};
