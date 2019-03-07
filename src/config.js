const config = {
  port: process.env.PORT || 8080,
  dbName: process.env.DB_NAME || 'chooseYourDbNameForThisBoilerplate',
  dbHost: process.env.DB_HOST || 'localhost:27017',
  password: process.env.ADMIN_PASSWORD,
  APP_ID: process.env.APP_ID,
  HAPI_KEY: process.env.HAPI_KEY,
  USER_ID: process.env.USER_ID,
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  SCOPES: ['contacts'].join(' '),
  REDIRECT_URI: `http://localhost:${process.env.PORT || 8080}/oauth-callback`,
};

export default config;
