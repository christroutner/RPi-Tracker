'use strict';

/*
 * Express Dependencies
 */
var express = require('express');
//var querystring = require("querystring");
var requestHandlers = require("./requestHandlers.js");
var gpsd = require('./lib/gpsd');
var fs = require('fs');
var tokml = require('tokml'); //Used for converting GeoJSON to KML.
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
var debugState = false; //Used to turn verbose debugging off or on.

//Tracker server
var trackerServerIp = '198.199.94.71';
var trackerServerPort = '3000';

var gpsInterface = new GPSInterface.Constructor();
var dataLog = new DataLog.Constructor();
dataLog.helloWorld();

/*
 * Open a JSON file for recording GPS data
 */
var jsonPointTimeStamp = new Object();
jsonPointTimeStamp.fileRead = false;
jsonPointTimeStamp.exists = false;

var jsonLineString = new Object();
jsonLineString.fileRead = false;
jsonLineString.exists = false;

//Generate a file name based on the current date.
var today = new Date();
var fileNameGeoJSONPoint = today.getFullYear()+'-'+('00'+(today.getMonth()+1)).slice(-2)+'-'+('00'+(today.getDate()+1)).slice(-2)+'-PT'+'.json';
var fileNameGeoJSONLineString = today.getFullYear()+'-'+('00'+(today.getMonth()+1)).slice(-2)+'-'+('00'+(today.getDate()+1)).slice(-2)+'-LS'+'.json';
var fileNameKMLPoint = today.getFullYear()+'-'+('00'+(today.getMonth()+1)).slice(-2)+'-'+('00'+(today.getDate()+1)).slice(-2)+'-PT'+'.kml';
var fileNameKMLLineString = today.getFullYear()+'-'+('00'+(today.getMonth()+1)).slice(-2)+'-'+('00'+(today.getDate()+1)).slice(-2)+'-LS'+'.kml';
var docName = today.getFullYear()+'-'+('00'+(today.getMonth()+1)).slice(-2)+'-'+('00'+(today.getDate()+1)).slice(-2)+" Tracking Data";
var docDesc = "Tracking data captured with the Raspberry Pi on "+today.getFullYear()+'-'+('00'+(today.getMonth()+1)).slice(-2)+'-'+('00'+(today.getDate()+1)).slice(-2);

//Read in the log files if they already exists. Otherwise create a new file.
//First log file.
dataLog.readPointFile(fileNameGeoJSONPoint);




//Second log file.
fs.readFile('./data/'+fileNameGeoJSONLineString, 'utf8', function(err, data) {
  if (err) {
    //debugger;
    
    //The file doesn't exist, so create the GeoJSON structure from scratch.
    if( err.code == "ENOENT" ) {    
      
      jsonLineString.data = 
        { 
          "type": "FeatureCollection",
          "features": 
          [

            //This format is used for recording LineString data. More appropriate for a breadcrumb trail.
            { 
              "type": "Feature",
              "geometry": {
                "type": "LineString",
                "coordinates": []
              },
              "properties": {
                //"timestamp": [],
                "name": docName,
                "description": docDesc
              }
            }
         ]
      };
      
      
      //Set flags for file handling.
      jsonLineString.fileRead = true;
      jsonLineString.exists = false;
      
    //Handle unknown errors.
    } else {
      console.log('Error opening the JSON LineString file.');
      throw err;
    }
    
  } else {
    //debugger;
    //If the file already exists, the read it in.
    jsonLineString.data = JSON.parse(data);
    jsonLineString.fileRead = true;
    jsonLineString.exists = true;
  }
});


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

var timeStamp = new Date(); //Stores the most recent timestamp from the GPS.

// parse is false, so only raw data gets emitted.
// This section react to different NMEA sentences as they are generated by GPS.
// Coordinates are collected into a buffer and then averages inside the interval timer event.
listener.on('raw', gpsInterface.readNMEASentences );

listener.watch({class: 'WATCH', nmea: true});
/* END GPS Connection */



/*
 * Timer event to record GPS data to a file
 */ 

//Production
//var timeout = 30000;  //1000 = 1 second.
//var fileSaveCnt = 10; //Number of intervals until the file is saved.

//Testing
var timeout = 15000;  //1000 = 1 second.
var fileSaveCnt = 1; //Number of intervals until the file is saved.

var timerCnt = 0; //Used to track the number of timer calls.

//Create an interval timer to periodically add GPS coordinates to the running log.
//Whenever the interval timer event triggers, all the coordinates that have been collected in the buffer get averaged.
var intervalHandle = setInterval(function() {
  //debugger;
  
  //Used for debugging. This is how you disconnect the listener from the GPS.
  //listener.disconnect(function() {
  //    console.log('Disconnected');
  //});
  //listener.unwatch();
  
  //Increment the counter.
  timerCnt++;
  
  if(debugState)
    console.log('Interval. timerCnt='+timerCnt);
  
  //Average all the lat and longs in the coordinate buffer.
  var lat = 0;
  var long = 0;
  for( var i = 0; i < gpsInterface.coordinateBuffer.length; i++ ) {
    long = long+gpsInterface.coordinateBuffer[i][0];
    lat = lat+gpsInterface.coordinateBuffer[i][1];
  }
  long = long/gpsInterface.coordinateBuffer.length;
  lat = lat/gpsInterface.coordinateBuffer.length;
  
  //Exit if the buffer is full of NaN values.
  if(isNaN(long) || isNaN(lat))
    return;
  
  //Clear the coordinateBuffer
  gpsInterface.coordinateBuffer = [];
  
  //Format the long and lat
  //The toFixed() function rounds the decimal places, but turns it into a string, hence the Number() wrapper.
  var formattedLong = Number(long.toFixed(8));
  var formattedLat = Number(lat.toFixed(8));
  
  //Add the data points to the GeoJSON object (for a Point)
  jsonPointTimeStamp.data.features.push(
    { 
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [formattedLong, formattedLat, 0.01]},
      "properties": {
        "timestamp": timeStamp,
        "name": timeStamp
      }
    }
  );
  
  //Add the data point to the GeoJSON object (for a LineString)
  jsonLineString.data.features[0].geometry.coordinates.push([formattedLong, formattedLat, 0.01]);
  //jsonFile.data.features[0].properties.timestamp.push(timeStamp);
  
  
  //Update the file every fileSaveCnt timer events.
  if( timerCnt >= fileSaveCnt ) {
    
    var filePointTimeStampOutput = JSON.stringify(jsonPointTimeStamp.data, null, 4);
    var fileLineStringOutput = JSON.stringify(jsonLineString.data, null, 4);
    
    //used for debugging.
    console.log('tick...');
    debugger;
    
    //Write out the GeoJSON and KML Point files.
    if(jsonPointTimeStamp.fileRead) {

      fs.writeFile('./assets/logfiles/'+fileNameGeoJSONPoint, filePointTimeStampOutput, function (err) {
        if(err) {
          console.log('Error while trying to write GeoJSON Point file output.');
          console.log(err);
        } else {
          if(debugState)
            console.log('GPS data file updated. Time Stamp: '+timeStamp);
        }

      });

      //Convert the GeoJSON to KML
      var kmlString = tokml(jsonPointTimeStamp.data);
      
      //Write out the KML data
      fs.writeFile('./assets/logfiles/'+fileNameKMLPoint, kmlString, function (err) {
        if(err) {
          console.log('Error while trying to write KML Point file output.');
          console.log(err);
        } else {
          if(debugState)
            console.log('KML GPS data file updated. Time Stamp: '+timeStamp);
        }

      });
      
    }
    
    //Write out the GeoJSON and KML LineString files..
    if(jsonLineString.fileRead) {

      fs.writeFile('./assets/logfiles/'+fileNameGeoJSONLineString, fileLineStringOutput, function (err) {
        if(err) {
          console.log('Error while trying to write GeoJSON LineString file output.');
          console.log(err);
        } else {
          if(debugState)
            console.log('GPS data file updated. Time Stamp: '+timeStamp);
        }

      });

      //Convert the GeoJSON to KML
      kmlString = tokml(jsonLineString.data);
      
      //Write out the KML data
      fs.writeFile('./assets/logfiles/'+fileNameKMLLineString, kmlString, function (err) {
        if(err) {
          console.log('Error while trying to write KML LineString file output.');
          console.log(err);
        } else {
          if(debugState)
            console.log('KML GPS data file updated. Time Stamp: '+timeStamp);
        }

      });
      
    }
    
    //Attempt to send updated file to tracker server.
    /*
    var options = {
      host: trackerServerIp,
      port: trackerServerPort,
      path: '/api/fileupload/create',
      method: 'POST'
    };
    
    http.request(options, function(res) {
      debugger;
    });
    */
    
    
    // BEGIN - TEST CODE FOR SENDING LOGS TO SERVER
    var form = new FormData();
    form.append('file_upload', fs.createReadStream('./assets/logfiles/'+fileNameGeoJSONPoint));
    
    /*
    //form.submit('http://'+trackerServerIp+':'+trackerServerPort+'/api/trackinglogfile/create', function(err, res) {
    form.submit('http://'+trackerServerIp+':'+trackerServerPort+'/api/fileupload/create', function(err, res) {
      debugger;
      //res.resume();
      
      try {
        if(res.statusCode == 200) {
          console.log('tracking log uploaded to server successfully!');
        }
        
      } catch(error) {
        console.error('Problem uploading data to server. Error message:');
        console.error(err.message);
      }
      
      res.resume();
    });
    */
    
    //Trying another method of submission
    var request = http.request({
      method: 'post',
      host: trackerServerIp,
      port: trackerServerPort,
      path: '/api/trackinglogfile/create',
      headers: form.getHeaders()
    });

    form.pipe(request);

    request.on('response', function(res) {
      console.log(res.statusCode);
    });
    
    
    // END - TEST CODE FOR SENDING LOGS TO SERVER
    
    
    
    
    timerCnt = 0;
  }
  
}, timeout);


/*
 * Start up the Express web server
 */
app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);