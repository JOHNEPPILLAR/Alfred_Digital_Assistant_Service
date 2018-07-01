/**
 * Setup includes
 */
const Skills = require('restify-router').Router;
const serviceHelper = require('../../lib/helper.js');
const dateFormat = require('dateformat');

const skill = new Skills();

/**
 * @api {put} /travel/tubestatus Get tube status
 * @apiName tubestatus
 * @apiGroup Travel
 *
 * @apiParam {String} line Tube line i.e. Circle line
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTPS/1.1 200 OK
 *   {
 *      "sucess": "true",
 *      "data": {
 *        "mode": "tube",
 *        "line": "Northern"
 *        "disruptions": "false"
 *      }
 *   }
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTPS/1.1 500 Internal error
 *   {
 *     data: Error message
 *   }
 *
 */
async function tubeStatus(req, res, next) {
  serviceHelper.log('trace', 'tubeStatus', 'tubeStatus API called');

  const { TFLAPIKey } = process.env;

  let { line } = req.body;
  let disruptions = 'false';
  let returnJSON;

  if (typeof line === 'undefined' || line === null || line === '') {
    serviceHelper.log('info', 'tubeStatus', 'Missing param: line');
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, 400, 'Missing param: line');
      next();
    }
    return false;
  }

  try {
    serviceHelper.log('trace', 'tubeStatus', 'Getting data from TFL');
    const url = `https://api.tfl.gov.uk/Line/${line}/Disruption?${TFLAPIKey}`;
    serviceHelper.log('trace', 'tubeStatus', url);
    let apiData = await serviceHelper.requestAPIdata(url);
    apiData = apiData.body;

    if (!serviceHelper.isEmptyObject(apiData)) {
      disruptions = apiData[0].description;
      line = apiData[0].name;
    }

    returnJSON = {
      mode: 'tube',
      line,
      disruptions,
    };

    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, true, returnJSON);
      next();
    }
    return returnJSON;
  } catch (err) {
    serviceHelper.log('error', 'tubeStatus', err);
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, false, err);
      next();
    }
    return err;
  }
}
skill.put('/tubestatus', tubeStatus);

/**
 * @api {put} /travel/nextTube Get tube info for journey
 * @apiName nextTube
 * @apiGroup Travel
 *
 * @apiParam {String} line Tube line i.e. Circle line
 * @apiParam {String} startID Tube line station i.e. London Bridge
 * @apiParam {String} endID Tube line station i.e. London Bridge
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTPS/1.1 200 OK
 *   {
 *      "sucess": "true",
 *      "data": {
 *        "mode": "tube",
 *        "line": "Northern"
 *        "disruptions": "false"
 *        "duration": "00:00"
 *      }
 *   }
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTPS/1.1 500 Internal error
 *   {
 *     data: Error message
 *   }
 *
 */
async function nextTube(req, res, next) {
  serviceHelper.log('trace', 'nextTube', 'nextTube API called');

  const { TFLAPIKey } = process.env;
  const { startID, endID } = req.body;

  let { line } = req.body;
  let duration = 0;
  let disruptions = 'false';
  let returnJSON;

  if (typeof line === 'undefined' || line === null || line === '') {
    serviceHelper.log('info', 'tubeStatus', 'Missing param: line');
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, 400, 'Missing param: line');
      next();
    }
    return false;
  }

  if (typeof startID === 'undefined' || startID === null || startID === '') {
    serviceHelper.log('info', 'tubeStatus', 'Missing param: startID');
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, 400, 'Missing param: startID');
      next();
    }
    return false;
  }

  if (typeof endID === 'undefined' || endID === null || endID === '') {
    serviceHelper.log('info', 'tubeStatus', 'Missing param: endID');
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, 400, 'Missing param: endID');
      next();
    }
    return false;
  }

  try {
    serviceHelper.log('trace', 'tubeStatus', 'Getting data from TFL');
    let url = `https://api.tfl.gov.uk/Line/${line}/Timetable/${startID}/to/${endID}?${TFLAPIKey}`;
    serviceHelper.log('trace', 'tubeStatus', url);
    let apiData = await serviceHelper.requestAPIdata(url);
    apiData = apiData.body;

    if (!serviceHelper.isEmptyObject(apiData)) {
      line = apiData.lineName;
      let tempRoute = apiData.timetable.routes[0].stationIntervals[0].intervals;
      tempRoute = tempRoute.filter(a => a.stopId === endID);
      let { timeToArrival } = tempRoute[0];
      if (typeof timeToArrival === 'undefined') timeToArrival = 0;
      duration = `00:${serviceHelper.zeroFill(timeToArrival, 2)}`;
    }

    serviceHelper.log('trace', 'tubeStatus', 'Get distruptions');
    url = `https://api.tfl.gov.uk/Line/${line}/Disruption?${TFLAPIKey}`;
    serviceHelper.log('trace', 'tubeStatus', url);
    apiData = await serviceHelper.requestAPIdata(url);

    apiData = apiData.body;
    if (!serviceHelper.isEmptyObject(apiData)) {
      disruptions = apiData[0].description;
    }

    returnJSON = {
      mode: 'tube',
      line,
      disruptions,
      duration,
    };

    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, true, returnJSON);
      next();
    }
    return returnJSON;
  } catch (err) {
    serviceHelper.log('error', 'nextTube', err);
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, false, err);
      next();
    }
    return err;
  }
}
skill.put('/nexttube', nextTube);

/**
 * @api {put} /travel/busstatus Get bus status
 * @apiName busstatus
 * @apiGroup Travel
 *
 * @apiParam {String} route bus number i.e. 486
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTPS/1.1 200 OK
 *   {
 *   "sucess": "true",
 *   "data": {
 *       "mode": "bus",
 *       "line": "486",
 *       "disruptions": "false"
 *   }
 *   }
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTPS/1.1 500 Internal error
 *   {
 *     data: Error message
 *   }
 *
 */
async function busStatus(req, res, next) {
  serviceHelper.log('trace', 'busStatus', 'busStatus API called');

  const { TFLAPIKey } = process.env;

  let { route } = req.body;
  let disruptions = 'false';
  let returnJSON;

  if (typeof route === 'undefined' || route === null || route === '') {
    serviceHelper.log('info', 'busStatus', 'Missing param: route');
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, 400, 'Missing param: route');
      next();
    }
    return false;
  }

  try {
    serviceHelper.log('trace', 'busStatus', 'Getting data from TFL');
    const url = `https://api.tfl.gov.uk/Line/${route}/Status?detail=true&${TFLAPIKey}`;
    serviceHelper.log('trace', 'busStatus', url);
    let apiData = await serviceHelper.requestAPIdata(url);
    apiData = apiData.body;

    if (!serviceHelper.isEmptyObject(apiData)) {
      route = apiData[0].name;
      if (!serviceHelper.isEmptyObject(apiData[0].disruptions)) {
        disruptions = apiData[0].disruptions;
      }
    }

    returnJSON = {
      mode: 'bus',
      line: route,
      disruptions,
    };

    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, true, returnJSON);
      next();
    }
    return returnJSON;
  } catch (err) {
    serviceHelper.log('error', 'busStatus', err);
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, false, err);
      next();
    }
    return false;
  }
}
skill.put('/busstatus', busStatus);

/**
 * @api {put} /travel/nextbus Get next bus information
 * @apiName nextbus
 * @apiGroup Travel
 *
 * @apiParam {String} route Bus route i.e. 380
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTPS/1.1 200 OK
 *   {
 *   "sucess": "true",
 *   "data": {
 *       "mode": "bus",
 *       "line": "486",
 *       "destination": "North Greenwich",
 *       "firstTime": "7:51 PM",
 *       "secondTime": "8:03 PM",
 *       "disruptions": "false"
 *   }
 *   }
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTPS/1.1 500 Internal error
 *   {
 *     data: Error message
 *   }
 *
 */
async function nextbus(req, res, next) {
  serviceHelper.log('trace', 'nextbus', 'nextbus API called');

  const { TFLAPIKey } = process.env;
  const busroute = req.body.route;

  let url;
  let returnJSON;
  let atHome;
  let stopPoint = '';

  switch (req.query.atHome) {
    case 'false':
      atHome = false;
      break;
    case 'true':
      atHome = true;
      break;
    default:
      atHome = true;
  }

  if (typeof busroute === 'undefined' || busroute === null || busroute === '') {
    serviceHelper.log('info', 'nextbus', 'Missing param: route');
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, 400, 'Missing param: route');
      next();
    }
    return false;
  }

  switch (busroute) {
    case '9':
      serviceHelper.log('trace', 'nextbus', 'Using Bus no. 9');
      stopPoint = '490013766H'; // Default going to work stop point
      if (!atHome) { stopPoint = '490013766H'; } // Override to coming home stop point - TODO
      url = `https://api.tfl.gov.uk/StopPoint/${stopPoint}/Arrivals?mode=bus&line=9&${TFLAPIKey}`;
      break;
    case '380':
      serviceHelper.log('trace', 'nextbus', 'Using Bus no. 380');
      url = `https://api.tfl.gov.uk/StopPoint/490013012S/Arrivals?mode=bus&line=380&${TFLAPIKey}`;
      break;
    case '486':
      serviceHelper.log('trace', 'nextbus', 'Using Bus no. 486');
      stopPoint = '490001058H'; // Default going to work stop point
      if (!atHome) { stopPoint = '490010374B'; } // Override to coming home stop point
      url = `https://api.tfl.gov.uk/StopPoint/${stopPoint}/Arrivals?mode=bus&line=486&${TFLAPIKey}`;
      break;
    case '161':
      serviceHelper.log('trace', 'nextbus', 'Using Bus no. 161');
      stopPoint = '490010374A'; // Default coming home stop point
      url = `https://api.tfl.gov.uk/StopPoint/${stopPoint}/Arrivals?mode=bus&line=161&${TFLAPIKey}`;
      break;
    default:
      serviceHelper.log('trace', 'nextbus', `Bus no.${busroute} is not supported`);
      if (typeof res !== 'undefined' && res !== null) {
        serviceHelper.sendResponse(res, false, `Bus route ${busroute} is not currently supported`);
        next();
      }
      return false;
  }

  try {
    // Get the bus data
    const params = { query: { route: busroute } };
    const distruptionsJSON = await busStatus(params, null, next);

    serviceHelper.log('trace', 'nextbus', 'Get data from TFL');
    serviceHelper.log('trace', 'nextbus', url);
    let apiData = await serviceHelper.requestAPIdata(url);
    apiData = apiData.body;
    if (serviceHelper.isEmptyObject(apiData)) {
      returnJSON = {
        mode: 'bus',
        line: busroute,
        destination: '',
        firstTime: 'N/A',
        secondTime: 'N/A',
        disruptions: 'N/A',
        error: 'No data was returned from the call to the TFL API',
      };
      serviceHelper.log('error', 'nextbus', 'No data was returned from the call to the TFL API');
      if (typeof res !== 'undefined' && res !== null) {
        serviceHelper.sendResponse(res, false, returnJSON);
        next();
      }
    } else {
      serviceHelper.log('trace', 'nextbus', 'Filter bus stop for only desired route and direction');
      let busData = apiData.filter(a => a.lineId === busroute);
      serviceHelper.log('trace', 'nextbus', 'Sort by time to arrive at staton');
      busData = busData.sort(serviceHelper.GetSortOrder('timeToStation'));

      let numberOfElements = busData.length;
      if (numberOfElements > 2) { numberOfElements = 2; }

      switch (numberOfElements) {
        case 2:
          returnJSON = {
            mode: 'bus',
            line: busData[0].lineName,
            destination: busData[0].destinationName,
            firstTime: serviceHelper.minutesToStop(busData[0].timeToStation),
            secondTime: serviceHelper.minutesToStop(busData[1].timeToStation),
            disruptions: distruptionsJSON.disruptions,
          };
          break;
        default:
          returnJSON = {
            mode: 'bus',
            line: busData[0].lineName,
            destination: busData[0].destinationName,
            firstTime: serviceHelper.minutesToStop(busData[0].timeToStation),
            secondTime: 'N/A',
            disruptions: distruptionsJSON.disruptions,
          };
          break;
      }
      if (typeof res !== 'undefined' && res !== null) {
        serviceHelper.sendResponse(res, true, returnJSON);
        next();
      }
    }
    return returnJSON;
  } catch (err) {
    serviceHelper.log('error', 'nextbus', err);
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, false, err);
      next();
    }
    return err;
  }
}
skill.put('/nextbus', nextbus);

/**
 * @api {put} /travel/nexttrain Get next train information
 * @apiName nexttrain
 * @apiGroup Travel
 *
 * @apiParam {String} train_destination Destination station i.e. CHX
 * @apiParam {String} startFrom Starting station i.e. CTN
 * @apiParam {String} departureTimeOffSet Departure time offset in HH:MM
 * @apiParam {Bool} distruptionOverride Ignore distruption
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTPS/1.1 200 OK
 *   {
 *   "sucess": "true",
 *   "data": {
 *       "mode": "train",
 *       "line": "Thameslink"
 *       "disruptions": "false",
 *       "duration": "00:29",
 *       "departureTime": "10:36",
 *       "departureToDestination": "London Charing Cross",
 *       "arrivalTime": "11:05",
 *       "arrivalDestination": "London Charing Cross",
 *       "status": "early"
 *   }
 *  }
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTPS/1.1 500 Internal error
 *   {
 *     data: Error message
 *   }
 *
 */
async function nextTrain(req, res, next) {
  serviceHelper.log('trace', 'nextTrain', 'nextTrain API called');

  const { transportapiKey } = process.env;
  const { distruptionOverride } = req.body;

  let {
    startFrom, destination, departureTimeOffSet,
  } = req.body;

  if (typeof destination === 'undefined' || destination === null || destination === '') {
    serviceHelper.log('info', 'nextTrain', 'Missing param: destination');
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, 400, 'Missing param: destination');
      next();
    }
    return false;
  }
  destination = destination.toUpperCase();

  if (typeof departureTimeOffSet !== 'undefined' && departureTimeOffSet !== null && departureTimeOffSet !== '') {
    departureTimeOffSet = `PT${departureTimeOffSet}:00`;
  } else {
    departureTimeOffSet = '';
  }

  if (typeof startFrom === 'undefined' || startFrom === null || startFrom === '') {
    serviceHelper.log('info', 'nextTrain', 'Using default start location');
    startFrom = 'CTN';
  }
  startFrom = startFrom.toUpperCase();

  let url = `https://transportapi.com/v3/uk/train/station/${startFrom}/live.json?${transportapiKey}&train_status=passenger&from_offset=${departureTimeOffSet}&calling_at=${destination}`;
  serviceHelper.log('trace', 'nextTrain', url);

  try {
    serviceHelper.log('trace', 'nextTrain', 'Get data from TFL');
    let apiData = await serviceHelper.requestAPIdata(url);
    apiData = apiData.body;

    if (serviceHelper.isEmptyObject(apiData)) {
      serviceHelper.log('error', 'nextTrain', 'No data was returned from the call to the TFL API');
      if (typeof res !== 'undefined' && res !== null) {
        serviceHelper.sendResponse(res, false, 'No data was returned from the call to the TFL API');
        next();
      }
      return false;
    }

    let trainData = apiData.departures.all;

    if (distruptionOverride) {
      serviceHelper.log('trace', 'nextTrain', 'Ignore cancelled trains');
      trainData = trainData.filter(a => a.status !== 'CANCELLED');
    }

    if (serviceHelper.isEmptyObject(trainData)) {
      serviceHelper.log('error', 'nextTrain', 'No trains running');
      const returnJSON = [{
        mode: 'train',
        line: 'N/A',
        disruptions: 'true',
        duration: 'N/A',
        departureTime: 'N/A',
        departureToDestination: 'N/A',
        departurePlatform: 'N/A',
        arrivalTime: 'N/A',
        arrivalDestination: 'N/A',
        status: 'No trains running',
      }];
      if (typeof res !== 'undefined' && res !== null) {
        serviceHelper.sendResponse(res, true, returnJSON);
        next();
      }
      return returnJSON;
    }

    serviceHelper.log('trace', 'nextTrain', 'Sort by departure time');
    trainData = trainData.sort(serviceHelper.GetSortOrder('aimed_departure_time'));

    serviceHelper.log('trace', 'nextTrain', 'Construct JSON');
    const returnJSON = [];
    let trainStations;
    let journey;
    let disruptions = 'false';
    let line;
    let duration = '00:00';
    let departureTime;
    let departureToDestination;
    let departurePlatform;
    let arrivalTime;
    let arrivalDestination;
    let status;

    for (let index = 0; index < trainData.length; index++) {
      line = trainData[index].operator_name;
      departureTime = trainData[index].aimed_departure_time;
      departureToDestination = trainData[index].destination_name;
      departurePlatform = trainData[index].platform;
      status = trainData[index].status.toLowerCase();

      serviceHelper.log('trace', 'nextTrain', 'Check for cancelled train');
      if (trainData[index].status.toLowerCase() === 'it is currently off route' || trainData[index].status.toLowerCase() === 'cancelled') {
        disruptions = 'true';
      }

      serviceHelper.log('trace', 'nextTrain', 'Get stops info');
      url = trainData[index].service_timetable.id;
      trainStations = await serviceHelper.requestAPIdata(url);
      trainStations = trainStations.body.stops;
      serviceHelper.log('trace', 'nextTrain', 'Get arrival time at destination station');
      trainStations = trainStations.filter(a => a.station_code === destination);
      arrivalTime = trainStations[0].aimed_arrival_time;
      arrivalDestination = trainStations[0].station_name;

      serviceHelper.log('trace', 'nextTrain', 'Work out duration');
      duration = serviceHelper.timeDiff(departureTime, arrivalTime);

      serviceHelper.log('trace', 'nextTrain', 'Construct journey JSON');
      journey = {
        mode: 'train',
        line,
        disruptions,
        duration,
        departureTime,
        departureToDestination,
        departurePlatform,
        arrivalTime,
        arrivalDestination,
        status,
      };
      returnJSON.push(journey);

      if ((index + 1) === trainData.length) {
        serviceHelper.log('trace', 'nextTrain', 'Send data back to caller');
        if (typeof res !== 'undefined' && res !== null) {
          serviceHelper.sendResponse(res, true, returnJSON);
          next();
        }
        return returnJSON;
      }
    }
  } catch (err) {
    serviceHelper.log('error', 'nextTrain', err);
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, false, err);
      next();
    }
    return err;
  }
}
skill.put('/nexttrain', nextTrain);

/**
 * @api {put} /travel/planJourney Plan journey from A to B
 * @apiName planJourney
 * @apiGroup Travel
 *
 * @apiParam {String} startPoint Where journey will start from
 * @apiParam {String} stopPoint Where journey will end
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTPS/1.1 200 OK
 *   {
 *   "sucess": "true",
 *   "data": {
 *      "$type": "Tfl.Api.Presentation.Entities.JourneyPlanner.....",
 *      "journeys": [
 *        {
 *           .....
 *        }
 *   }
 *  }
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTPS/1.1 500 Internal error
 *   {
 *     data: Error message
 *   }
 *
 */
async function planJourney(req, res, next) {
  serviceHelper.log('trace', 'planJourney', 'planJourney API called');

  const { TFLAPIKey } = process.env;
  const {
    startPoint, stopPoint, trainBusOverride, trainTubeOverride, trainWalkOverride,
  } = req.body;

  serviceHelper.log('trace', 'planJourney', 'Check params are ok');
  if (typeof startPoint === 'undefined' || startPoint === null || startPoint === '') {
    serviceHelper.log('info', 'planJourney', 'Missing param: startPoint');
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, 400, 'Missing param: startPoint');
      next();
    }
    return false;
  }

  if (typeof stopPoint === 'undefined' || stopPoint === null || stopPoint === '') {
    serviceHelper.log('info', 'planJourney', 'Missing param: stopPoint');
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, 400, 'Missing param: stopPoint');
      next();
    }
    return false;
  }

  serviceHelper.log('trace', 'planJourney', 'Add any default overrides');
  let url = `https://api.tfl.gov.uk/journey/journeyresults/${startPoint}/to/${stopPoint}?${TFLAPIKey}`;
  if (trainBusOverride) url += '&mode=national-rail,bus';
  if (trainTubeOverride) url += '&mode=national-rail,tube';
  if (trainWalkOverride) url += '&mode=national-rail,walking';
  // Param to think about - journeyPreference=LeastTime&

  // Add a 5 minute delay so that results fro TFL are not shown in the past
  let newTime = new Date();
  newTime.setMinutes(newTime.getMinutes() + 5);
  newTime = dateFormat(newTime, 'HHMM');
  url += `&time=${newTime}`;

  try {
    serviceHelper.log('trace', 'planJourney', 'Get data from TFL');
    serviceHelper.log('trace', 'planJourney', url);
    let apiData = await serviceHelper.requestAPIdata(url);
    apiData = apiData.body;
    if (serviceHelper.isEmptyObject(apiData)) {
      serviceHelper.log('error', 'planJourney', 'No data was returned from the call to the TFL API');
      if (typeof res !== 'undefined' && res !== null) {
        serviceHelper.sendResponse(res, false, 'No data was returned from the call to the TFL API');
        next();
      }
      return false;
    }
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, true, apiData);
      next();
    }
    return apiData;
  } catch (err) {
    serviceHelper.log('error', 'planJourney', err);
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, false, err);
      next();
    }
    return err;
  }
}
skill.put('/planjourney', planJourney);

/**
 * @api {put} /travel/getcommute Get commute information
 * @apiName getcommute
 * @apiGroup Travel
 *
 * @apiParam {String} lat
 * @apiParam {String} long
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTPS/1.1 200 OK
 *   {
 *     sucess: 'true'
 *     data: {
 *       "anyDisruptions": false,
 *       "commuteResults": [
 *           ...
 *       ]
 *    }
 *
 * @apiErrorExample {json} Error-Response:
 *   HTTPS/1.1 500 Internal error
 *   {
 *     data: Error message
 *   }
 *
 */
async function getCommute(req, res, next) {
  serviceHelper.log('trace', 'getCommute', 'getCommute API called');

  const journeys = [];
  const {
    user, lat, long, walk,
  } = req.body;

  let anyDisruptions = false;
  let apiData;
  let atHome = true;
  let atJPWork = false;
  let legs = [];

  serviceHelper.log('trace', 'getCommute', 'Checking for params');
  if (typeof user === 'undefined' || user === null || user === '') {
    serviceHelper.log('info', 'getCommute', 'Missing param: user');
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, 400, 'Missing param: user');
      next();
    }
    return false;
  }

  if ((typeof lat === 'undefined' && lat === null && lat === '') ||
      (typeof long === 'undefined' && long === null && long === '')) {
    serviceHelper.log('info', 'getCommute', 'Missing param: lat/long');
    if (typeof res !== 'undefined' && res !== null) {
      serviceHelper.sendResponse(res, 400, 'Missing param: lat/long');
      next();
    }
    return false;
  }

  serviceHelper.log('trace', 'getCommute', 'Find out if caller is at home location');
  atHome = serviceHelper.inHomeGeoFence(lat, long);

  switch (user.toUpperCase()) {
    case 'FRAN':
      serviceHelper.log('trace', 'getCommute', 'User is Fran');
      if (atHome) {
        serviceHelper.log('trace', 'getCommute', 'Current location is close to home');
        // commuteOptions.push({ order: 0, type: 'journey', query: { body: { startPoint: `${lat},${long}`, stopPoint: process.env.FranWorkPostCode, trainWalkOverride: true } } });
      } else {
        serviceHelper.log('trace', 'getCommute', 'Current location is not at home');
        // commuteOptions.push({ order: 0, type: 'journey', query: { body: { startPoint: `${lat},${long}`, stopPoint: process.env.HomePostCode, tubeTrainOverride: true } } });
      }
      break;
    case 'JP':
      serviceHelper.log('trace', 'getCommute', 'User is JP');
      if (atHome) {
        serviceHelper.log('trace', 'getCommute', 'Current location is close to home');
        if (walk === 'true') {
          serviceHelper.log('trace', 'getCommute', 'Walk option selected');
          apiData = await nextTrain({
            body: {
              destination: 'STP', departureTimeOffSet: '00:10',
            },
          }, null, next);


          return;


          if (apiData.disruptions === 'true') {
            serviceHelper.log('trace', 'getCommute', 'Getting backup journey');
            anyDisruptions = 'true';
            legs.push(apiData);
            journeys.push({ legs });
            legs = []; // Clear array

            serviceHelper.log('trace', 'getCommute', '1st leg');
            apiData = await nextTrain({
              body: {
                destination: 'LBG', departureTimeOffSet: '00:10',
              },
            }, null, next);
            if (apiData.disruptions === 'true') anyDisruptions = 'true';
            legs.push(apiData);

            serviceHelper.log('trace', 'getCommute', 'Work out next departure time');
            const timeOffset = serviceHelper.timeDiff(null, apiData.arrivalTime, 5);

            serviceHelper.log('trace', 'getCommute', '2nd leg');
            apiData = await nextTrain({
              body: {
                startFrom: 'LBG', destination: 'STP', departureTimeOffSet: timeOffset,
              },
            }, null, next);
            if (apiData.disruptions === 'true') anyDisruptions = 'true';
          }
          legs.push(apiData);
          journeys.push({ legs });
        }
        serviceHelper.log('trace', 'getCommute', 'Non walk option selected');

        serviceHelper.log('trace', 'getCommute', '1st leg');
        apiData = await nextTrain({
          body: {
            destination: 'LBG', departureTimeOffSet: '00:10',
          },
        }, null, next);
        if (apiData instanceof Error) {
          if (typeof res !== 'undefined' && res !== null) {
            serviceHelper.sendResponse(res, false, apiData.message);
            next();
          }
          return false;
        }
        if (apiData.disruptions === 'true') anyDisruptions = 'true';
        legs.push(apiData);

        serviceHelper.log('trace', 'getCommute', '2nd leg');
        apiData = await nextTube({
          body: {
            line: 'Northern', startID: '940GZZLULNB', endID: '940GZZLUAGL',
          },
        }, null, next);
        if (apiData instanceof Error) {
          if (typeof res !== 'undefined' && res !== null) {
            serviceHelper.sendResponse(res, false, apiData.message);
            next();
          }
          return false;
        }
        if (apiData.disruptions === 'true') anyDisruptions = 'true';
        legs.push(apiData);

        journeys.push({ legs });
      }

      atJPWork = serviceHelper.inJPWorkGeoFence(lat, long);
      if (atJPWork) {
        serviceHelper.log('trace', 'getCommute', 'Current location is close to work');
        if (walk === 'true') {
          serviceHelper.log('trace', 'getCommute', 'Walk from work option selected');
          //    commuteOptions.push({ order: 0, type: 'journey', query: { body: { startPoint: process.env.JPWalkHomeStart, stopPoint: process.env.HomePostCode } } });
        } else {
          //    commuteOptions.push({ order: 0, type: 'journey', query: { body: { startPoint: `${lat},${long}`, stopPoint: process.env.HomePostCode } } });
        }
      }

      // TODO - if not at home or at work

      break;
    default:
      serviceHelper.log('trace', 'getCommute', `User ${user} is not supported`);
      if (typeof res !== 'undefined' && res !== null) {
        serviceHelper.sendResponse(res, false, `User ${user} is not supported`);
        next();
      }
      return false;
  }

  /*
      case 'bus':
        apiData = await nextbus(commuteOption.query, null, next);
        if (apiData.disruptions === 'true') anyDisruptions = 'true';
        apiData.order = commuteOption.order;
        commuteResults.push(apiData);
        break;
      case 'tube':
        apiData = await tubeStatus(commuteOption.query, null, next);
        if (apiData.disruptions === 'true') anyDisruptions = 'true';
        apiData.order = commuteOption.order;
        commuteResults.push(apiData);
        break;
      case 'train':
        apiData = await nextTrain(commuteOption.query, null, next);
        if (apiData.disruptions === 'true') anyDisruptions = 'true';
        apiData.order = commuteOption.order;
        commuteResults.push(apiData);
        break;
      default:
        break;
    }
    return true;
  }));
*/

  const returnJSON = {
    anyDisruptions,
    journeys,
  };

  if (typeof res !== 'undefined' && res !== null) {
    serviceHelper.sendResponse(res, true, returnJSON);
    next();
  } else {
    return returnJSON;
  }
  return null;
}
skill.put('/getcommute', getCommute);

module.exports = skill;
