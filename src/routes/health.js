const healthRoutes = [
  {
    path: '/health',
    handlers: {
      get: ({ body, query, params, originalUrl, protocol, xhr, get, req }) => {
        return {
          body: {
            status: 'healthy',
          },
        };
      },
    },
  },
];

export default healthRoutes;
