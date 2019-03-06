import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import forEach from 'lodash/forEach';

const getDefaultConfig = (userConfig, defaultConfig = {
  cors: {
    origin: true,
    credentials: true,
    exposedHeaders: ['Link', 'Jwt'],
  },
  jsonBodyParser: {
    limit: '300kb',
  },
}) => {
  const config = {};
  if (!config) {
    return defaultConfig;
  }

  const { cors = defaultConfig.cors, jsonBodyParser = defaultConfig.jsonBodyParser } = config;

  return {
    cors,
    jsonBodyParser,
  };
};

const mapMethod = method => method.toLowerCase();

const responseMethods = {
  default: 'send',
  json: 'json',
  send: 'send',
  none: null,
};

const getResponseMethod = (format, body) => {
  if (!format) {
    const typeofBody = typeof body;
    if (typeofBody === 'string' || typeofBody === 'number' || typeofBody === 'boolean') {
      return 'send';
    }
    return 'json';
  }

  if (!responseMethods.hasOwnProperty(format)) {
    return responseMethods.default;
  }
  return responseMethods[format];
};

const sendResponse = (res, result) => {
  if (!result) {
    return;
  }

  if (res.headersSent) {
    return console.error("headers already sent")
  }

  const {
    body = null,
    status,
    format,
    redirect = false,
    headers = null,
  } = result;

  const responseMethod = getResponseMethod(format, body);
  if (responseMethod) {
    if (headers) {
      res.set(headers);
    }

    if (redirect) {
      if (status) {
        res.redirect(status, redirect);
      } else {
        res.redirect(redirect);
      }
    } else {
      res.status(status || 200)[responseMethod](body);
    }
  }
};

const createHandler = (additionalParams = {}) => handler => async (req, res, next) => {
  let result;

  try {
    result = await handler({
      body: req.body,
      query: req.query,
      params: req.params,
      originalUrl: req.originalUrl,
      protocol: req.protocol,
      xhr: req.xhr,
      get: headerName => req.get(headerName),
      getHeader: headerName => req.get(headerName),
      next,
      req,
      res,
      ...additionalParams,
    });
  } catch (error) {
    return next(error);
  }

  sendResponse(res, result);
};

const createErrorHandler = (additionalParams = {}) => handler => async (error, req, res, next) => {
  let result;

  try {
    result = await handler(error, {
      body: req.body,
      query: req.query,
      params: req.params,
      originalUrl: req.originalUrl,
      protocol: req.protocol,
      xhr: req.xhr,
      get: req.get,
      next,
      req,
      res,
    });
  } catch (error) {
    return next(error);
  }

  sendResponse(res, result);
};

const simpleExpress = async({
  port,
  routes = [],
  globalMiddlewares = [],
  errorHandlers = [],
  expressMiddlewares = [],
  config: userConfig,
  routeParams = {},
}) => {
  // creating express app
  const app = express();
  app.server = http.createServer(app);

  // applying default middlewares
  const config = getDefaultConfig(userConfig);

  if (config.cors) {
    app.use(cors(config.cors));
  }

  if (config.jsonBodyParser) {
    app.use(bodyParser.json(config.jsonBodyParser));
  }

  const createHandlerWithParams = createHandler(routeParams);
  const createErrorHandlerWithParams = createErrorHandler(routeParams);

  // applying custom express middlewares
  expressMiddlewares.forEach(middleware => app.use(middleware));

  // applying middlewares
  globalMiddlewares.forEach(middleware => {
    app.use(createHandlerWithParams(middleware));
  });

  // applying routes
  routes.forEach(({ handlers, path }) => {
    forEach(handlers, (handler, method) => {
      if (!Array.isArray(handler)) {
        handler = [handler];
      }
      app[mapMethod(method)](path, ...handler.map(createHandlerWithParams));
    });
  });

  // applying error handlers
  errorHandlers.forEach(errorHandler => {
    app.use(createErrorHandlerWithParams(errorHandler));
  });

  // starting actual server
  app.server.listen(port);

  if (!app.server.address()) {
    throw new Error(`App started but it doesn't seem to listen on any port. Check if port ${port} is not already used.`);
  }

  return app;
};

export default simpleExpress;

/*


const port = 8080;
const routes = [
  {
    path: '/',
    handlers: {
      get: ({ body, query, params, originalUrl, protocol, xhr, get, next, req }) => {

        return {
          status: 200,
          body: { foo: 'bar' },
          headers: {
            baz: 'baq',
          },
        };
      },
    },
  },
  {
    path: '/redirect',
    handlers: {
      get: () => ({ redirect: '/' }),
    },
  },
  {
    path: '/authorized',
    handlers: {
      get: [
        ({ get, next }) => {
          const authorizationHeader = getHeader('authorization');
          if (authorizationHeaderValid) {
            return next();
          }

          return {
            status: 401,
            body: 'Unauthorized',
          };
        },
        ({ body }) => {
          return Promise.resolve({
            body: { foo: 'Some sensitive data' },
          });
        },
      ],
    },
  },
];

const expressMiddlewares = [
  cookieParser(),
];

const globalMiddlewares = [
  ({ originalUrl }) => {
    logger.log(originalUrl);
  },
];

const errorHandlers = [
  (error, { body, originalUrl, next }) => {
    if (error instanceof AuthorizationError) {
      return {
        status: 401,
        body: 'Unauthorized',
      };
    }
    next(error);
  },
  error => ({
    status: 500,
    body: 'Something went wrong',
  }),
];

simpleExpress({
  port,
  routes,
  expressMiddlewares,
  globalMiddlewares,
  errorHandlers,
})
  .then(app => console.log(`App started on port ${port}.`))
  .catch(error => console.error('App starting failed', error));

*/
