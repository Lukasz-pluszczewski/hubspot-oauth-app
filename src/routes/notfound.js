import { ObjectID } from 'mongodb';
import { find, findLast, insert, remove, update } from 'services/mongoDatabaseService';

const healthRoutes = [
  {
    path: '*',
    handlers: {
      get: ({ body, query, params, originalUrl, protocol, xhr, get, req }) => {
        return {
          body: {
            message: 'Request success - route not found',
            body,
            query,
            params,
            originalUrl,
            protocol,
            xhr,
          },
        };
      },
    },
  },
];

export default healthRoutes;
