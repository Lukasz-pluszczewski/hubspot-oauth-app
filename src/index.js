import checkPassword from 'middleware/checkPassword';
import config from './config';
import routes from './routes';
import errorHandlers from './errorHandlers';

import createHubspot from 'services/hubspotService';
import createFileCache from 'services/FileCache';

import simpleExpress from 'services/simpleExpress';

(async function() {
  const fileCache = await createFileCache({});
  const hubspot = await createHubspot(fileCache);

  simpleExpress({
    port: config.port,
    routes,
    errorHandlers,
    globalMiddlewares: [
      checkPassword(config.password),
    ],
    routeParams: { hubspot, fileCache },
  })
    .then(app => console.log(`Started on port ${app.server.address().port}`))
    .catch(error => console.error('Error', error));
})();

/*
const app = express();
  app.server = http.createServer(app);

  app.use(cors({
    origin: true,
    credentials: true,
    exposedHeaders: config.corsHeaders,
  }));

  const db = await createDatabase();

  app.use(checkPassword(config.password));
  app.use(bodyParser.json({ limit: config.bodyLimit }), api({ db }));

  // starting actual server
  app.server.listen(config.port);

  console.log(`Started on port ${app.server.address().port}`); // eslint-disable-line no-console

 */