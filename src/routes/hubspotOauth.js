const hubspotOauth = [
  {
    path: '/',
    handlers: {
      get: async ({ hubspot, fileCache, res }) => {
        res.setHeader('Content-Type', 'text/html');
        res.write(`<h2>Hubspot</h2>`);
        if (await hubspot.isAuthorized()) {
          const accessToken = await hubspot.getAccessToken();
          const { accessTokenData, accessTokenExpireTimestamp } = await fileCache.get();

          const expiresIn = (accessTokenExpireTimestamp - Date.now()) / 1000 / 60 / 60;
          const expiresH = parseInt(expiresIn);
          const expiresM = parseInt((expiresIn - expiresH) * 60)

          res.write(`<h4>Access token: ${accessToken}</h4>`);
          res.write(`<b>Expires in:</b> ${expiresH}h ${expiresM}min<br/>`);
          res.write(`<b>Email:</b> ${accessTokenData && accessTokenData.user}<br/>`);
          res.write(`<b>Domain:</b> ${accessTokenData && accessTokenData.hub_domain}<br/><br/>`);
          res.write(`<a href="connect">Reconnect</a><br/>`);
          res.write(`<a href="disconnect">Disconnect</a>`);
          res.write(`<hr />`);
          res.write(`<a href="hubspot/create?batchSize=100&batches=1">Create 100*1</a><br/>`);
          res.write(`<a href="hubspot/create?batchSize=1000&batches=1">Create 1000*1</a><br/>`);
          res.write(`<a href="hubspot/create?batchSize=1000&batches=2">Create 1000*2</a><br/>`);
          res.write(`<a href="hubspot/create?batchSize=1000&batches=5">Create 1000*5</a><br/>`);
          res.write(`<a href="hubspot/create?batchSize=1000&batches=10">Create 1000*10</a><br/>`);
          res.write(`<b>Batch create url: </b>/hubspot/create?batchSize=1000&batches=10<br/>`);
          res.write(`<a href="hubspot/purgeContacts">Purge contacts</a><br/>`);
        } else {
          res.write(`<h4>Access token:</h4>`);
          res.write(`<a href="connect">Connect</a>`);
        }
        res.end();
      },
    }
  },
  {
    path: '/connect',
    handlers: {
      get: async ({ hubspot }) => {
        console.log('Initiating OAuth 2.0 flow with HubSpot');
        console.log("Step 1: Redirecting user to HubSpot's OAuth 2.0 server");
        console.log('Step 2: User will be prompted for consent by HubSpot');
        return {
          redirect: hubspot.getAuthUrl(),
        };
      },
    }
  },
  {
    path: '/disconnect',
    handlers: {
      get: async ({ fileCache }) => {
        await fileCache.set('refreshToken', null);
        return {
          redirect: '/',
        }
      }
    }
  },
  {
    path: '/oauth-callback',
    handlers: {
      get: async ({ hubspot, fileCache, query, res }) => {
        console.log('Step 3: Handling the request sent by the server');

        await hubspot.handleOauthCallback(query.code)

        return {
          redirect: '/'
        }
      },
    },
  },
];

export default hubspotOauth;
