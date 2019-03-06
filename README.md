# Czarny api boilerplate 2

### Environment variables
- **PORT** (default: 8080)
- **DB_NAME** (default: 'chooseYourDbNameForThisBoilerplate', you can change the default in config.js)
- **DB_HOST** (default: 'localhost:27017')
- **ADMIN_PASSWORD** - (*required*) password to access API (password must be then added to each request as a "authentication" header)

### Run development build
`ADMIN_PASSWORD=foobarbaz npm run dev`

### Run production build
`ADMIN_PASSWORD=foobarbaz npm run start`


## Simple express
### Usage
```

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

```