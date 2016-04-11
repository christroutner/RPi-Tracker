'use strict';

/*
 * Express Dependencies
 */
var express = require('express');
//var querystring = require("querystring");
var requestHandlers = require("./requestHandlers.js");
var gpsd = require('./lib/gpsd');


var app = express();
var port = 3000;



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


// parse is false, so raw data get emitted.
listener.on('raw', function(data) {
  //debugger;
  
  var nmeaCode = data.slice(1,6);
  
  //Choose a different action based on the incoming NMEA sentence header
  switch(nmeaCode) {
    case "GPZDA":
      //Note Hour, Minute, Second, Microsecond is in UTC format.
      var year = Number(data.slice(23,27));
      var month = Number(data.slice(20,22))-1;
      var day = Number(data.slice(17,19));
      var hour = Number(data.slice(7,9));
      var minute = Number(data.slice(10,12));
      var second = Number(data.slice(11,13));
      var millisecond = Number(data.slice(14,16));
      
      var gpsDate = new Date(year, month, day, hour, minute, second, millisecond);
      
      console.log('GPS Time Stamp: '+gpsDate);
      console.log('Minute: '+minute);
      
      break;
      
    case "GPGGA":
      debugger;
      
      break;
      
    default:
      //console.log('Rejected '+nmeaCode);
      console.log(data);
      break;
  }
  
  console.log(data);
});

listener.watch({class: 'WATCH', nmea: true});



/*
 * Start it up
 */
app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);