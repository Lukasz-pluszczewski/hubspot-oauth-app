import axios from 'axios';
import log from 'all-log';
import request from 'request-promise-native';
import config from '../config';

const { APP_ID, HAPI_KEY, USER_ID, CLIENT_ID, CLIENT_SECRET, port } = config;

const SCOPES = ['contacts'].join(' ');
const REDIRECT_URI = `http://localhost:${port}/oauth-callback`;

const authUrl =
  'https://app.hubspot.com/oauth/authorize' +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` + // app's client ID
  `&scope=${encodeURIComponent(SCOPES)}` + // scopes being requested by the app
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`; // where to send the user after the consent page

const makeRequestWithHapiKey = async (url, method, data = null, additionalOptions = {}) => {
  return axios({
    method: method,
    url: url.replace('APP_ID', APP_ID).replace('HAPI_KEY', HAPI_KEY).replace('USER_ID', USER_ID),
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...additionalOptions,
  });
};
const makeRequestWithToken = async (url, method, data, accessToken, additionalOptions = {}) => {
  return axios({
    method: method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    data,
    ...additionalOptions,
  });
};

const exchangeForTokens = async (exchangeProof, fileCache) => {
  try {
    const responseBody = await request.post('https://api.hubapi.com/oauth/v1/token', {
      form: exchangeProof
    });
    // Usually, this token data should be persisted in a database and associated with
    // a user identity.
    const tokens = JSON.parse(responseBody);
    console.log('Exchange for tokens body', tokens);

    const { data } = await axios({
      method: 'get',
      url: `https://api.hubapi.com/oauth/v1/access-tokens/${tokens.access_token}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await fileCache.set({
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      accessTokenExpireTimestamp: Math.round(Date.now() + (tokens.expires_in * 0.75 * 1000)),
      accessTokenData: data,
    });

    console.log('  > Received an access token and refresh token');
    return tokens.access_token;
  } catch (e) {
    console.error(`  > Error exchanging ${exchangeProof.grant_type} for access token`);
    return JSON.parse(e.response.body);
  }
};

const hubspotService = (fileCache) => {
  const hubspotServiceInstance = {
    makeRequest: async (url, method, data, sendWithToken = false, additionalOptions = {}) => {
      const accessToken = sendWithToken && await hubspotServiceInstance.getAccessToken()
      return (accessToken
        ? makeRequestWithToken(url, method, data, accessToken, additionalOptions)
        : makeRequestWithHapiKey(url, method, data, additionalOptions))
        .then(results => {
          // log('Hubspot request success', method, url);
          return { data: results.data, status: results.status };
        })
        .catch(error => {
          log('Hubspot request failed', {
            data: error.response.data,
            status: error.response.status,
            headers: error.response.headers,
          });
          return Promise.reject(error);
        })
    },
    handleOauthCallback: async (code) => {
      // Received a user authorization code, so now combine that with the other
      // required values and exchange both for an access token and a refresh token
      if (code) {
        console.log('  > Received an authorization token');

        const authCodeProof = {
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          code: code
        };

        // Step 4
        // Exchange the authorization code for an access token and refresh token
        console.log('Step 4: Exchanging authorization code for an access token and refresh token');
        const token = await exchangeForTokens(authCodeProof, fileCache);
        if (token.message) {
          throw new Error(token.message);
        }

      }
      return false;
    },
    refreshAccessToken: async () => {
      console.log('will refresh access token');
      const refreshTokenProof = {
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        refresh_token: await fileCache.get('refreshToken'),
      };
      return await exchangeForTokens(refreshTokenProof, fileCache);
    },
    getAccessToken: async () => {
      // If the access token has expired, retrieve
      // a new one using the refresh token
      const expireTimestamp = await fileCache.get('accessTokenExpireTimestamp');

      if (expireTimestamp < Date.now()) {
        console.log('Refreshing expired access token');
        await hubspotServiceInstance.refreshAccessToken();
      }
      return fileCache.get('accessToken');
    },
    isAuthorized: async () => {
      const refreshToken = await fileCache.get('refreshToken');
      return !!refreshToken
    },
    getAuthUrl: () => authUrl,
  };

  return hubspotServiceInstance;
};

export default hubspotService;