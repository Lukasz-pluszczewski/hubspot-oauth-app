import health from './health';
import notfound from './notfound';
import hubspot from './hubspot';
import hubspotOauth from './hubspotOauth';

const routes = [
  ...hubspotOauth,
  ...hubspot,
  ...health,
  ...notfound,
];

export default routes;
