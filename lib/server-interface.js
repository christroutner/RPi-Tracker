
var FormData = require('form-data');
var fs = require('fs');
var http = require('http'); //Used for GET and POST requests
var request = require('request'); //Used for CURL requests.

var globalThis; //Used in functions below when 'this' loses context.


function Constructor() {

  //Used in functions below when 'this' loses context.
  globalThis = this;
  
  this.timeout = 15000; //Number of milliseconds between attempts to upload data to the server.
  this.intervalHandle = undefined;
  
  //Tracker server
  this.trackerServerIp = '198.199.94.71';
  this.trackerServerPort = '3000';
  this.trackerServerURL = 'http://'+this.trackerServerIp+':'+this.trackerServerPort;
  
  this.lastServerDate = undefined;
  this.userId = "57e1a18460390704dc1a10d9";
  
  this.logFileCnt = 0;
  
  //This is a generalized function that is called from by an Interval in rpi-tracker.js.
  //The purpose of this function is to kick off the processes necessary to update the GPS data on the server.
  this.updateServer = function() {
    
    //Only try executing the code below if the a GPS timestamp has been retrieved and the log files have been opened successfully.
    if(global.dataLog.logFileOpened) {

      if(globalThis.lastServerDate == undefined) {
        globalThis.getLastServerDate();
      
      } else {
        debugger;
        
        globalThis.syncWithServer();
        
        debugger;
        
        //If the the fileNames array is empty, send the file for the current day.
        //if(fileNames.length == 0) {
        //  globalThis.sendLogFile(global.dataLog.fileNameGeoJSONPoint);
        
        //Loop through the fileNames array until all files have been sent.
        //} else {
          
        //}
        
      }
      
      //globalThis.sendLogFile();
  
    }
  };

  //This function is called by this.updateServer().
  //This function returns an array of strings containing the file names that need to be uploaded to the server.
  this.syncWithServer = function() {
    debugger;

    var serverDayStamp = globalThis.Date2DayStamp(globalThis.lastServerDate);
    var clientDayStamp = globalThis.Date2DayStamp(global.gpsInterface.timeStamp);

    //var fileNames = [];
    
    if(global.debugState) {
      console.log('Server\'s last log file: '+globalThis.lastServerDate);
      console.log('Client\'s time: '+global.gpsInterface.timeStamp);
    }

    //If the dates match.
    if(serverDayStamp == clientDayStamp) {
      debugger;
      
      var fileName = clientDayStamp+'-PT.json';
      
      //Send the client log file to update the server log file.
      globalThis.sendLogFile(fileName);
      

    //The server is more than a day behind and needs any intermediate daily log files.
    } else {
      //Send log files until the dates match.
      debugger;
      
      var msPerDay = 1000*60*60*24; //number of milliseconds in a day.
      
      //Assumption: server date will always be older than client date.
      
      //Calculate the number of days between the server time and client time.
      var numDays = Math.floor((global.gpsInterface.timeStamp.getTime() - globalThis.lastServerDate.getTime())/msPerDay);
      
      //Loop through each day
      //for(var i=0; i<numDays;i++) {
      if(globalThis.logFileCnt < numDays) {
        
        var curLogFile = globalThis.Date2DayStamp(new Date(globalThis.lastServerDate.getTime()+globalThis.logFileCnt*msPerDay));
        var fileName = curLogFile+'-PT.json';
                                                  
        //If the file exists for this day, upload it to the server.
        //Send the log file from client to server if it exists.
        fs.access('./assets/logfiles/'+fileName, fs.R_OK, function(err) {
          debugger;

          if(!err) {
            console.log('fs.access says '+fileName+' exists. Sending to server.');
            globalThis.sendLogFile(fileName);
          } else {
            console.log('fs.access says '+fileName+' does NOT exist.');
          }

          //Increment the counter
          globalThis.logFileCnt++;
        });
                                                  
                                                  
      //If it does not exist, continue uploading the latest data.
      } else {
        
        //Force the server time stamp to match the client time stamp.
        //This will trigger the upload of the latest data on the next interation.
        globalThis.lastServerDate = global.gpsInterface.timeStamp;
      }
    }
  
      
//GENERATE AN ARRAY OF FILE NAMES TO BE SENT TO SERVER
      /*
      //String formatting variables.
      var firstPart = serverDayStamp.slice(0,8);
      var serverDay = Number(serverDayStamp.slice(-2));
      var clientDay = Number(clientDayStamp.slice(-2));
      var dayDiff = clientDay - serverDay;

      //Loop through the number of days difference between the log files.
      //for(var i=0; i < dayDiff; i++) {
      if(globalThis.logFileCnt < dayDiff) {

        if(global.debugState)
          console.log('logFileCnt = '+globalThis.logFileCnt);

        //Format the second part of the file name.
        var secondPart = '00'+(serverDay+globalThis.logFileCnt);
        secondPart = secondPart.slice(-2);

        var fileName = firstPart+secondPart+'-PT.json';

        //Send the log file from client to server if it exists.
        fs.access('./assets/logfiles/'+fileName, fs.R_OK, function(err) {
          debugger;

          if(!err) {
            console.log('fs.access says '+fileName+' exists.');
            globalThis.sendLogFile(fileName);
          } else {
            console.log('fs.access says '+fileName+' does NOT exist.');
          }

        });
        */
        /*
        fs.exists('./assets/logfiles/'+fileName, function(exists) {
          if(exists) {
            debugger;

            if(global.debugState)
              console.log('file '+fileName+' exists.');

            //globalThis.sendLogFile(fileName);
          }
        });

        fs.open('./assets/logfiles/'+fileName, 'r', function(err, fd) {
          debugger;

          if(!err) {
            console.log('fs.open says '+fileName+' exists.');
          } else {
            console.log('fs.open says '+fileName+' does NOT exist.');
          }

        });
        */

        //globalThis.logFileCnt++;
      //}

    //}

  };
  
  //This function attempts to send the GeoJSON point file to the server.
  this.sendLogFile = function(fileName) {
    
    if(global.debugState) 
      console.log('Sending log file to server...');
      
    //Create an HTTP form.
    var form = new FormData();
    //Append the log file to the Form.
    form.append('file_upload', fs.createReadStream('./assets/logfiles/'+fileName));

    //Create an http request.
    var request = http.request({
      method: 'post',
      host: globalThis.trackerServerIp,
      port: globalThis.trackerServerPort,
      //path: '/api/trackinglogfile/create',
      path: '/api/trackinglogfile/create/'+globalThis.userId,
      headers: form.getHeaders()
    });

    //Pipe the form into the http request.
    form.pipe(request);

    //If the server responds.
    request.on('response', function(res) {
      console.log('...server responded with '+res.statusCode);
    });

    //If the server does not respond.
    request.on('error', function(err) {
      if(global.debugState)
        console.log('...server unreachable.')
    });
  };
  
  //This function queries the server to get the last known upload date the given user name.
  this.getLastServerDate = function() {
    
    //Exit if the userId isn't defined.
    if((globalThis.userId == "") || (globalThis.userId == undefined))
      return;
    
    if(global.debugState)  
      console.log('Requesting user data...');
    
    //Request the user data
    request(globalThis.trackerServerURL+'/api/userdata/'+globalThis.userId, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        debugger;
        
        if(global.debugState)
          console.log('...user data successfully retrieved.');
        
        //Convert the body into a JSON object.
        var data = JSON.parse(body);
        
        //Get the lastServerDate.
        globalThis.lastServerDate = new Date(data.geodata.lastDate);
        
        if(global.debugState)
          console.log('Server date format: '+data.geodata.lastDate);
        
      }
      
      if(error)
        console.log('...Got error: '+error.message);
    })
    
  };
  
  //This function takes a Date object as input and returns a day stamp string in the format of YYYY-MM-DD
  this.Date2DayStamp = function(date) {
    //debugger;
    
    //Error handling
    if(typeof(date) != "object")
      return "";
    
    try {
      var dayStamp = date.getFullYear()+'-'+('00'+(date.getMonth()+1)).slice(-2)+'-'+('00'+(date.getDate())).slice(-2);
    } catch(err) {
      var dayStamp = "";
    }
    
    return dayStamp;
    
  };
  
  return(this);
  
}

exports.Constructor = Constructor;