import notfound from './notfound';
import hubspot from './hubspot';
import hubspotOauth from './hubspotOauth';

const routes = [
  ...hubspotOauth,
  ...hubspot,
  ...notfound,
];

export default routes;
