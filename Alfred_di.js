/**
 * Setup server
 */
const restify = require('restify');
const dotenv = require('dotenv');
const lightNameHelper = require('./lightNames.js');
const fs = require('fs');
const alfredHelper = require('./helper.js');
const logger = require('winston');

// Get up global vars
global.logger = logger;
global.lightNames = [];
global.lightGroupNames = [];

dotenv.load(); // Load env vars

alfredHelper.setLogger(logger); // Configure the logger

// Restify server Init
const server = restify.createServer({
  name: process.env.APINAME,
  version: process.env.VERSION,
  key: fs.readFileSync('./server.key'),
  certificate: fs.readFileSync('./server.cert'),
});

global.server = server;

/**
 * API Middleware
 */
server.use(restify.plugins.jsonBodyParser({ mapParams: true }));
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser({ mapParams: true }));
server.use(restify.plugins.fullResponse());
server.on('uncaughtException', (request, response, route, error) => {
  logger.error(error.message);
  alfredHelper.sendResponse(response, 'error', error.message);
});

/**
 * Start API server and listen to messqges
 */
server.listen(process.env.PORT, () => {
  logger.info('%s listening to %s', server.name, server.url);
});

/**
 * Check for valid app_key param, if not then return error
 */
server.use((req, res, next) => {
  if (req.query.app_key === process.env.app_key) {
    next();
  } else {
    logger.error(`Invaid app_key: ${req.query.app_key}`);
    alfredHelper.sendResponse(res, 'false', 'There was a problem authenticating you.');
  }
});

/**
 * Setup light & light group names
 */
lightNameHelper.setupLightNames();

/**
 * Configure API end points
 */
const genericRouter = require('./skills/generic/generic.js');
const jokeRouter = require('./skills/joke/joke.js');
const lightRouter = require('./skills/lights/lights.js');
const newsRouter = require('./skills/news/news.js');
const searchRouter = require('./skills/search/search.js');
const settingsRouter = require('./skills/settings/settings.js');
const timeRouter = require('./skills/time/time.js');
const travelRouter = require('./skills/travel/travel.js');
const tvRouter = require('./skills/tv/tv.js');
const weatherRouter = require('./skills/weather/weather.js');

genericRouter.applyRoutes(server);
jokeRouter.applyRoutes(server);
lightRouter.applyRoutes(server, '/lights');
newsRouter.applyRoutes(server);
searchRouter.applyRoutes(server);
settingsRouter.applyRoutes(server, '/settings');
timeRouter.applyRoutes(server);
travelRouter.applyRoutes(server, '/travel');
tvRouter.applyRoutes(server, '/tv');
weatherRouter.applyRoutes(server, '/weather');
