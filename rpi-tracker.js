'use strict';

/*
 * Express Dependencies
 */
var express = require('express');
//var querystring = require("querystring");
var requestHandlers = require("./requestHandlers.js");
var gpsd = require('./lib/gpsd');
var fs = require('fs');
var http = require('http'); //Used for GET and POST requests
var Promise = require('node-promise');


//Local libraries based on the different featuers of this software
var serverSettings = require('./assets/server_settings.json');
var GPSInterface = require('./lib/gps-interface.js');
var DataLog = require('./lib/data-log.js');
var ServerInterface = require('./lib/server-interface.js');
var WifiInterface = require('./lib/wifi.js');
var AppLogAPI = require('./lib/appLogAPI.js');


var app = express();
var port = 80;

/*
 * Global Variables
 */
app.locals.isTracking = false;

//Dev Note: I should make debugState a local varible in each library, so that I can turn debugging on
//for specific featuers like WiFi, GPS, data logging, server interface, etc.
global.debugState = true; //Used to turn verbose debugging off or on.



global.gpsInterface = new GPSInterface.Constructor();
global.dataLog = new DataLog.Constructor();
global.serverInterface = new ServerInterface.Constructor();
global.wifiInterface = new WifiInterface.Constructor();
global.appLogAPI = new AppLogAPI.Constructor();
//dataLog.helloWorld();

//Clear the PM2 log before starting anything else.
if(!global.appLogAPI.clearLog())
  console.log('Error trying to clear the PM2 log!');


/*
 * Use Handlebars for templating
 */
var exphbs = require('express3-handlebars');
var hbs;

// For gzip compression
//app.use(express.compress());

/*
 * Config for Production and Development
 */
app.engine('handlebars', exphbs({
    // Default Layout and locate layouts and partials
    defaultLayout: 'main',
    layoutsDir: 'views/layouts/',
    partialsDir: 'views/partials/'
}));

// Locate the views
app.set('views', __dirname + '/views');

// Locate the assets
app.use(express.static(__dirname + '/assets'));


// Set Handlebars
app.set('view engine', 'handlebars');



/*
 * Routes
 */
//Allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Index Page
app.get('/', function(request, response, next) {
    response.render('index');
});

//Request Handler/Webserver functions
app.use('/listLogFiles', requestHandlers.listLogFiles);
app.use('/queryTracking', requestHandlers.queryTracking);
app.use('/wifiSettings', global.wifiInterface.wifiSettings);
app.use('/saveSettings', requestHandlers.saveSettings);
app.use('/getLog', global.appLogAPI.getLog);
app.use('/syncLog', global.serverInterface.getSyncLog);
app.use('/startSync', global.serverInterface.startSync);
app.use('/stopSync', global.serverInterface.stopSync);
app.use('/updateSoftware', requestHandlers.updateSoftware);


/* BEGIN GPS Connection */
//Create a GPSD listener.
var listener = new gpsd.Listener({
    port: 2947,
    hostname: 'localhost',
    logger:  {
        info: function() {},
        warn: console.warn,
        error: console.error
    },
    parse: false
});

listener.connect(function() {  
  //Dev Note: This message gets displayed weather or not the device was actually able to connect to the GPS. I need a way to write out to the console
  //weather the GPS was successful or not.
  console.log('Connected to GPS');
  app.locals.isTracking = true;
});

//Save the listener to the Express app locals so I can access it in the request handlers.
app.locals.listener = listener;

// parse is false, so only raw data gets emitted.
// This section react to different NMEA sentences as they are generated by GPS.
// Coordinates are collected into a buffer and then averages inside the interval timer event.
listener.on('raw', global.gpsInterface.readNMEASentences );

listener.watch({class: 'WATCH', nmea: true});
/* END GPS Connection */


/*
 * Open a JSON file for recording GPS data
 */
//This interval function checks every 10 second to see if valid time stamps are coming from the GPS.
//Once a valid time stamp arrives, it is used to generate the file names for the log files and opens or creates those log files.
var getGPSTimeStamp = setInterval(function() {
  //debugger;
  
  if(global.gpsInterface.timeStamp != undefined) {

    var timeStamp = global.gpsInterface.timeStamp;
    
    console.log('Time stamp retrieved from GPS: '+timeStamp+'. Opening log files.')
    
    //Generate a file name based on the current date.
    //Dev Note: The RPi date/time can't be trusted. I should update this data with data from the GPS.
    global.dataLog.fileNameGeoJSONPoint = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2)+'-PT'+'.json';
    global.dataLog.fileNameGeoJSONLineString = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2)+'-LS'+'.json';
    global.dataLog.fileNameKMLPoint = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2)+'-PT'+'.kml';
    global.dataLog.fileNameKMLLineString = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2)+'-LS'+'.kml';
    global.dataLog.docName = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2)+" Tracking Data";
    global.dataLog.docDesc = "Tracking data captured with the Raspberry Pi on "+timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2);
    
    //Read in the log files if they already exists. Otherwise create a new file.
    //First log file. 
    global.dataLog.readPointFile();
    //Second log file.
    global.dataLog.readLineStringFile();

    //Clear the interval once we've successfully retrieved the timestamp and opened the log files.
    clearInterval(getGPSTimeStamp);
    
    //Signal to global.dataLog.logData() that data can now be logged to the log files.
    global.dataLog.logFileOpened = true;
  }
  
}, 10000);




/* BEGIN - Timer event to record GPS data to a file */ 
//Production
global.dataLog.timeout = serverSettings.gpsDataLogTimeout;  //1000 = 1 second. 
global.dataLog.fileSaveCnt = serverSettings.gpsFileSaveTimeoutCnt; //Number of intervals until the file is saved.

//Testing
//global.dataLog.timeout = 15000;  //1000 = 1 second.
//global.dataLog.fileSaveCnt = 1; //Number of intervals until the file is saved.

//Create an interval timer to periodically add GPS coordinates to the running log.
//Whenever the interval timer event triggers, all the coordinates that have been collected in the buffer get averaged.
var intervalHandle = setInterval(global.dataLog.logData, global.dataLog.timeout);
/* END - Timer event to record GPS data to a file */ 


 /* BEGIN - SERVER INTERFACE FOR LOGGING TO SERVER */
//Skip this code if the serverInterface is not even set up.
//if(global.serverInterface != undefined) {
//  global.serverInterface.intervalHandle = setInterval(global.serverInterface.updateServer, global.serverInterface.timeout);
//}
/* END - SERVER INTERFACE FOR LOGGING TO SERVER */


//Determine if previous settings need to be restored if the device has been rebooted several times with rebootConfirmationNeeded set to true.
if(serverSettings.rebootConfirmationNeeded == "true") {
  global.wifiInterface.restoreCheck();
}


/* Start up the Express web server */
app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);

