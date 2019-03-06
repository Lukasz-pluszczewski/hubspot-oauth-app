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
