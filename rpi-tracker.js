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
var FormData = require('form-data');

//Local libraries based on the different featuers of this software
var GPSInterface = require('./lib/gps-interface.js');
var DataLog = require('./lib/data-log.js');


var app = express();
var port = 3000;

/*
 * Global Variables
 */
app.locals.isTracking = false;
global.debugState = false; //Used to turn verbose debugging off or on.

//Tracker server
var trackerServerIp = '198.199.94.71';
var trackerServerPort = '3000';

global.gpsInterface = new GPSInterface.Constructor();
global.dataLog = new DataLog.Constructor();
//dataLog.helloWorld();




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
app.use('/wifiSettings', requestHandlers.wifiSettings);





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
global.getGPSTimestamp = setInterval(function() {
  debugger;
  
  if(global.gpsInterface.timeStamp != undefined) {
    
    console.log('Time stamp retrieved from GPS. Opening log files.')
    
    var timeStamp = global.gpsInterface.timeStamp;
    
    //Generate a file name based on the current date.
    //Dev Note: The RPi date/time can't be trusted. I should update this data with data from the GPS.
    global.dataLog.fileNameGeoJSONPoint = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getDate()+1)).slice(-2)+'-PT'+'.json';
    global.dataLog.fileNameGeoJSONLineString = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getDate()+1)).slice(-2)+'-LS'+'.json';
    global.dataLog.fileNameKMLPoint = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getDate()+1)).slice(-2)+'-PT'+'.kml';
    global.dataLog.fileNameKMLLineString = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getDate()+1)).slice(-2)+'-LS'+'.kml';
    global.dataLog.docName = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getDate()+1)).slice(-2)+" Tracking Data";
    global.dataLog.docDesc = "Tracking data captured with the Raspberry Pi on "+timeStamp.getFullYear()+'-'+('00'+(timeStamp.getMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getDate()+1)).slice(-2);

    //Read in the log files if they already exists. Otherwise create a new file.
    //First log file. 
    global.dataLog.readPointFile();
    //Second log file.
    global.dataLog.readLineStringFile();
    
    clearInterval(global.getGPSTimeStamp);
  }
  
}, 10000);




/* BEGIN - Timer event to record GPS data to a file */ 
//Production
//global.dataLog.timeout = 30000;  //1000 = 1 second.
//global.dataLog.fileSaveCnt = 10; //Number of intervals until the file is saved.

//Testing
global.dataLog.timeout = 15000;  //1000 = 1 second.
global.dataLog.fileSaveCnt = 1; //Number of intervals until the file is saved.

//Create an interval timer to periodically add GPS coordinates to the running log.
//Whenever the interval timer event triggers, all the coordinates that have been collected in the buffer get averaged.
var intervalHandle = setInterval(global.dataLog.logData, global.dataLog.timeout);
/* END - Timer event to record GPS data to a file */ 


/*
 * Start up the Express web server
 */
app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);