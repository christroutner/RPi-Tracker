'use strict';

/*
 * Express Dependencies
 */
var express = require('express');
//var querystring = require("querystring");
var requestHandlers = require("./requestHandlers.js");
var gpsd = require('./lib/gpsd');
var fs = require('fs');


var app = express();
var port = 3000;


var ConvertDMSToDD = function(degrees, minutes, seconds, direction) {
    var dd = degrees + minutes/60 + seconds/(60*60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}

/*
 * Open a JSON file for recording GPS data
 */
var jsonFile = new Object();
jsonFile.fileRead = false;
jsonFile.exists = false;

var today = new Date();
var fileName = today.getFullYear()+'-'+('00'+(today.getMonth()+1)).slice(-2)+'-'+('00'+(today.getDate()+1)).slice(-2)+'.json';

fs.readFile('./data/'+fileName, 'utf8', function(err, data) {
  if (err) {
    //debugger;
    
    //The file doesn't exist, so create the GeoJSON structure from scratch.
    if( err.code == "ENOENT" ) {      
      jsonFile.data = 
        { "type": "FeatureCollection",
          "features": [
            //{ "type": "Feature",
            //  "geometry": {"type": "Point", "coordinates": [102.0, 0.5]},
            //  "properties": {"prop0": "value0"}
            //}
            
            { "type": "Feature",
              "geometry": {
                "type": "LineString",
                "coordinates": []
              },
              "properties": {
                "timestamp": []
              }
            }
           ]
         };
      jsonFile.fileRead = true;
      jsonFile.exists = false;
      
    //Handle unknown errors.
    } else {
      console.log('Error opening the JSON file.');
      throw err;
    }
    
  } else {
    debugger;
    //If the file already exists, the read it in.
    jsonFile.data = JSON.parse(data);
    jsonFile.fileRead = true;
    jsonFile.exists = true;
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


//app.use('/start', requestHandlers.start);
//app.use('/upload', requestHandlers.upload);
app.use('/add_new', requestHandlers.add_new);


/*
//API for sending emails
app.use('/send_email', function(request, response, next) {
  console.log("Request handler 'send_email' was called.");
  console.log("request.query.email: "+request.query.email);
  
  debugger;
  
  if( request.query.email == undefined ) {
    console.log("No data recieved.");
    response.send('Failure! No data recieved by server.');
  }

  var email = request.query.email;
  var subject = request.query.subject;
  var message = request.query.message;
  
  var responseMessage = "<p>Success!<br>" +
      "You've sent the text: <br>"+
      "email: "+email+"<br>"+
      "subject: "+subject+"<br>"+
      "message: "+message+"<br></p>";
  
  response.send(responseMessage);
  
  debugger;
  
  //Send the info along to gmail to transmit the email using NodeMailer.
  var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: gmail_username,
          pass: gmail_password
      }
  }, {
      // default values for sendMail method
      from: gmail_from,
      //headers: {
      //    'My-Awesome-Header': '123'
      //}
  });
  transporter.sendMail({
      to: email,
      subject: subject,
      text: message
  });
  
});
*/

/*
 * Utility function for converting between Degrees, Minutes Seconds (Raw GPS output) and Decimal Degree (Google Maps) format.
 */
/*
var ConvertDMSToDD = function(degrees, minutes, seconds, direction) {
    var dd = degrees + minutes/60 + seconds/(60*60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}
*/

/*
 * GPS Connection
 */
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
  console.log('Connected to GPS');
});

//not going to happen, parse is false
//listener.on('TPV', function(data) {
//  console.log(data);
//});


var coordinateBuffer = []; //Used to collect coordinate and time data between timer events.
var timeStamp = new Date(); //Stores the most recent timestamp from the GPS.
// parse is false, so raw data get emitted.
listener.on('raw', function(data) {
  //debugger;
  //console.log(data);
  
  var nmeaCode = data.slice(1,6);
  
  //Choose a different action based on the incoming NMEA sentence header
  switch(nmeaCode) {
    case "GPZDA":
      //Note Hour, Minute, Second, Microsecond is in UTC format.
      var year = Number(data.slice(23,27));
      var month = Number(data.slice(20,22))-1;
      var day = Number(data.slice(17,19));
      var hour = Number(data.slice(7,9));
      var minute = Number(data.slice(9,11));
      var second = Number(data.slice(11,13));
      var millisecond = Number(data.slice(14,16));
      
      //var gpsDate = new Date(year, month, day, hour, minute, second, millisecond);
      //console.log('GPS Time Stamp: '+gpsDate);
      
      timeStamp = new Date(year, month, day, hour, minute, second, millisecond);
      
      break;
      
    case "GPGGA":
      //debugger;
      
      //North and West Coordinates
      //var lat = data.slice(14,23)+data.slice(24,25);
      //var long = data.slice(26,36)+data.slice(37,38);
      
      //Google Map & GeoJSON Coordinates
      //Have to divide by 100 to get the decimal place in the right spot.
      //Note: I'm making the long negative because I know this is correct for my hemisphere.
      //This should really be algorithmically calculated based on the compass letter that is
      //is contained in data.slice(37,38).
      //var lat = Number(data.slice(14,23))/100;
      //var long = -1*Number(data.slice(26,36))/100;
      
      
      
      //Retrieve Lat and Long, but convert from DMS to DD
      //debugger;
      var lat = ConvertDMSToDD(Number(data.slice(14,16)),Number(data.slice(16,18)),Number(data.slice(19,23))/100,data.slice(24,25));
      var long = ConvertDMSToDD(Number(data.slice(26,29)), Number(data.slice(29,31)), Number(data.slice(32,36))/100, data.slice(37,38));
      
      //console.log(data);
      console.log('Lat: '+data.slice(14,16)+','+data.slice(16,18)+','+data.slice(19,23)+','+data.slice(24,25));
      console.log('Coordinates: '+lat+', '+long);
      
      //Push the newest coordinate into the buffer.
      coordinateBuffer.push(
        [long, lat, 0] //third number is elevation, to be implemented at a later date.
        //{ 
        //  "type": "Feature",
        //  "geometry": {"type": "Point", "coordinates": [long, lat]}
        //}
      );
      
      break;
      
    default:
      //console.log('Rejected '+nmeaCode);
      //console.log(data);
      break;
  }
  
  //console.log(data);
});

listener.watch({class: 'WATCH', nmea: true});

/*
 * Timer event to record GPS data to a file
 */ 
var timeout = 30000; //1000 = 1 second.
var fileSaveCnt = 1; //Number of intervals until the file is saved.

var timerCnt = 0; //Used to track timer calls.
var intervalHandle = setInterval(function() {
  
  //listener.disconnect(function() {
  //    console.log('Disconnected');
  //});
  //listener.unwatch();
  //debugger;
  
  //Increment the counter.
  timerCnt++;
  
  //Average all the lat and longs in the coordinate buffer.
  var lat = 0;
  var long = 0;
  for( var i = 0; i < coordinateBuffer.length; i++ ) {
    long = long+coordinateBuffer[i][0];
    lat = lat+coordinateBuffer[i][1];
  }
  long = long/coordinateBuffer.length;
  lat = lat/coordinateBuffer.length;
  
  //Clear the coordinateBuffer
  coordinateBuffer = [];
  debugger;
  
  //Add the data points to the GeoJSON object (for a point)
  //jsonFile.data.features.push(
  //  { 
  //    "type": "Feature",
  //    "geometry": {"type": "Point", "coordinates": [long, lat]},
  //    "properties": {"timestamp": timeStamp}
  //  }
  //);
  
  //Add the data point to the GeoJSON object (for a LineString)
  //The toFixed() function rounds the decimal places, but turns it into a string, hence the Number() wrapper.
  jsonFile.data.features[0].geometry.coordinates.push([Number(long.toFixed(8)), Number(lat.toFixed(8)), 0.01]);
  jsonFile.data.features[0].properties.timestamp.push(timeStamp);
  
  
  //Update the file every 10 timer events.
  if( timerCnt >= fileSaveCnt ) {
    
    var fileOutput = JSON.stringify(jsonFile.data, null, 4);
    
    if(jsonFile.fileRead) {
      if(jsonFile.exists) {
        //debugger;
        
        fs.writeFile('./data/'+fileName, fileOutput, function (err) {
          if(err) {
            console.log('Error while trying to write file output.');
            console.log(err);
          } else {
            console.log('GPS data file updated. Time Stamp: '+timeStamp);
          }
          
        });
        
      } else {
        //debugger;

        fs.writeFile('./data/'+fileName, fileOutput, function (err) {
          if(err) {
            console.log('Error while trying to write file output.');
            console.log(err);
          } else {
            console.log('GPS data file updated. Time Stamp: '+timeStamp);
          }
          
        });
      }

    }
    
    timerCnt = 0;
  }
  
}, timeout);


/*
 * Start up the Express web server
 */
app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);