
var FormData = require('form-data');
var fs = require('fs');
var http = require('http'); //Used for GET and POST requests
var request = require('request'); //Used for CURL requests.
var Promise = require('node-promise'); //Promises to handle asynchonous callbacks.

var serverSettings = require('../assets/server_settings.json');

var globalThis; //Used in functions below when 'this' loses context.


function Constructor() {

  //Used in functions below when 'this' loses context.
  globalThis = this;
  
  //this.timeoutSetting = 60000*3;
  this.timeoutSetting = 30000;
  this.timeout = this.timeoutSetting; //Number of milliseconds between attempts to upload data to the server.
  this.intervalHandle = undefined;
  
  //Tracker server
  this.trackerServerIp = serverSettings.trackerServerIp;
  this.trackerServerPort = serverSettings.trackerServerPort;
  this.trackerServerURL = 'http://'+this.trackerServerIp+':'+this.trackerServerPort;
  
  this.lastServerDate = undefined;
  //this.userId = "57e1a18460390704dc1a10d9";
  //this.userId = serverSettings.userId; //Remove this line. Use serverSettings global variable directly.
  
  this.logFileCnt = 0;
  
  this.syncLog = []; //An array of strings containing the server sync log. This information is displayed in the users UI.
  
  //This is a generalized function that is called from by an Interval in rpi-tracker.js.
  //The purpose of this function is to kick off the processes necessary to update the GPS data on the server.
  this.updateServer = function() {
    
    console.log('updateServer() called at '+new Date());
    globalThis.syncLog.push('updateServer() called at '+new Date());
    
    //Only try executing the code below if the a GPS timestamp has been retrieved and the log files have been opened successfully.
    if(global.dataLog.logFileOpened) {

      //Retrieve the last server timestamp before trying to upload any files.
      if(globalThis.lastServerDate == undefined) {
        
        globalThis.getLastServerDate();
      
      } else {
        debugger;
        
        globalThis.syncWithServer();
        
      }
      
    }
  };

  //This function is called by this.updateServer().
  //This function determins the appropriate log file to send to the server, and uploads it as a GeoJSON file.
  //If the server and client are in-sync, then the current days log file is uploaded to the server to keep it in sync.
  //If the server is more than a day behind the client, then this function will send the next log file needed by the server
  //until the server and client are synced.
  this.syncWithServer = function() {
    //debugger;

    console.log('syncWithServer() called...');
    globalThis.syncLog.push('syncWithServer() called...');
    
    var serverDayStamp = globalThis.Date2DayStamp(globalThis.lastServerDate);
    var clientDayStamp = globalThis.Date2DayStamp(global.gpsInterface.timeStamp);

    //var fileNames = [];
    
    if(global.debugState) {
      console.log('Server\'s last log file: '+globalThis.lastServerDate);
      console.log('Client\'s time: '+global.gpsInterface.timeStamp);
      globalThis.syncLog.push('Server\'s last log file: '+globalThis.lastServerDate);
      globalThis.syncLog.push('Client\'s time: '+global.gpsInterface.timeStamp);
    }

    //If the dates match, the server has already caught up and we only need to send the current days log as it gets updated.
    if(serverDayStamp == clientDayStamp) {
      //debugger;
      
      //Slow down server calls. Restore the timeout frequency of server calls to the original setting.
      globalThis.timeout = globalThis.timeoutSetting;
//      clearInterval(globalThis.intervalHandle);
//      globalThis.intervalHandle = setInterval(globalThis.updateServer, globalThis.timeout);
      
      var fileName = clientDayStamp+'-PT.json';
      
      //Send the client log file to update the server log file.
      globalThis.sendLogFile(fileName);
      

    //The server is more than a day behind and needs any daily log files saved to the client disk.
    //Send log files until the dates match.
    } else {
      
      //Increase the frequency of server calls until the client and server have synced.
      //globalThis.timeout = 10000;
//      clearInterval(globalThis.intervalHandle);
//      globalThis.intervalHandle = setInterval(globalThis.updateServer, globalThis.timeout);
     
      //Find and send the next file.
      globalThis.findNextFile();
    }

  };

  //This function iteratively calls itself to increment the logFileCnt until the next available log file is found
  //or the client date matches the server date.
  this.findNextFile = function() {
    //debugger;
    
    if(global.debugState) {
      console.log('Executing findNextFile()');
      globalThis.syncLog.push('Executing findNextFile()');
    }
    
    var msPerDay = 1000*60*60*24; //number of milliseconds in a day.
      
    //Assumption: server date will always be older than client date.

    var serverDate = globalThis.lastServerDate;
    var gpsDate = global.gpsInterface.timeStamp;
    
    //Calculate the number of days between the server time and client time.
    var numDays = Math.floor((gpsDate.getTime() - serverDate.getTime())/msPerDay);

    //Loop through each day
    if(globalThis.logFileCnt < numDays) {

      //Create a candidate file name.
      var candidate = globalThis.Date2DayStamp(new Date(serverDate.getTime()+(globalThis.logFileCnt)*msPerDay));
      
      //Open the candidate file in order to compare the last time stamp in the file with the last time stamp retrieved from the server.
      var promiseLastTimeStamp = globalThis.getLastTimeStamp(candidate+'-PT.json');
      
      //Compare the last timestamp in the current file with the timestamp of the server.
      promiseLastTimeStamp.then( function(result) {
        debugger;
        
        //if server timestamp is newer or equal to the log file's time stamp, send the next days log file.
        if(globalThis.lastServerDate >= result) {
          var curLogFile = globalThis.Date2DayStamp(new Date(serverDate.getTime()+(globalThis.logFileCnt+1)*msPerDay));
        //if server timestamp is older, send the current log file.
        } else {
          var curLogFile = globalThis.Date2DayStamp(new Date(serverDate.getTime()+(globalThis.logFileCnt)*msPerDay));
        }
        
        //Generate the full file name.
        var fileName = curLogFile+'-PT.json';

        //If the file exists for this day, upload it to the server.
        //Send the log file from client to server if it exists.
        fs.access('./assets/logfiles/'+fileName, fs.R_OK, function(err) {
          //debugger;

          //Increment the counter
          globalThis.logFileCnt++;

          //The file exists.
          if(!err) {
            debugger;
            
            if(global.debugState)
              console.log('fs.access says '+fileName+' exists. Sending to server.');
            globalThis.syncLog.push('fs.access says '+fileName+' exists. Sending to server.');

            //Send the log file to the server.
            globalThis.sendLogFile(fileName);
            
            //Clear the counter.
            globalThis.logFileCnt = 0; //Reset counter.
          
          //The file does not exist.
          } else {
            if(global.debugState)
              console.log('fs.access says '+fileName+' does NOT exist.');
            globalThis.syncLog.push('fs.access says '+fileName+' does NOT exist.');

            //Iteratively call this function until the next file is found.
            globalThis.findNextFile();
          }


        });
        
      //An error occured trying to analyize the candidate log file.
      }, function(error) {
        //debugger;
        
        //If the file doesn't exist, then increment the counter and try the next file.
        if(error.code == "ENOENT") {
          globalThis.logFileCnt++;
          globalThis.findNextFile();
          
        //Any other error is unexpected and is reported to the console.
        } else {
          debugger;
          console.error('Promise returned by getLastTimeStamp() threw an error!');
          console.error(error.message);
        }
        
      });
      
    //Once the counter runs out, continue uploading the latest data.
    } else {
      //Force the server time stamp to match the client time stamp.
      //This will trigger the upload of the latest data on the next interation.
      globalThis.lastServerDate = global.gpsInterface.timeStamp;
    }

  };
  
  //This function attempts to send the GeoJSON point file to the server.
  //Input is a string representing the filename of the log file to be sent.
  this.sendLogFile = function(fileName) {
    
    if(global.debugState)
      console.log('Executing sendLogFile('+fileName+')');
    globalThis.syncLog.push('Executing sendLogFile('+fileName+')');
    
    //Check if the file exists.
    fs.access('./assets/logfiles/'+fileName, fs.R_OK, function(err) {
    
      //No error, file exists.
      if(!err) {
      
        if(global.debugState) 
          console.log('Sending log file to server...');
        globalThis.syncLog.push('Sending log file to server...');

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
          path: '/api/trackinglogfile/create/'+serverSettings.userId,
          headers: form.getHeaders()
        });

        //Pipe the form into the http request.
        form.pipe(request);

        //If the server responds.
        request.on('response', function(res) {
          console.log('...server responded with '+res.statusCode);
          globalThis.syncLog.push('...server responded with '+res.statusCode);

          //Get the updated server timestmap, but wait 2 seconds to prevent a race condition.
          setTimeout(globalThis.getLastServerDate, 2000);
        });

        //If the server does not respond.
        request.on('error', function(err) {
          if(global.debugState)
            console.log('...server unreachable. Error: '+err.message);
          globalThis.syncLog.push('...server unreachable. Error: '+err.message);
        });
      
      //File does not exist.
      } else {
        //debugger;
        console.error('WARNING: Tried to send file '+fileName+' to server, but it does not exist!');
        globalThis.syncLog.push('WARNING: Tried to send file '+fileName+' to server, but it does not exist!');
      }
        
    });
  };
  
  //This function queries the server to get the last known upload date for the given user GUID.
  //The user GUID is stored in the global variable serverSettings.userId.
  this.getLastServerDate = function() {
    
    //Exit if the userId isn't defined.
    if((serverSettings.userId == "") || (serverSettings.userId == undefined))
      return;
    
    if(global.debugState)  
      console.log('Executing getLastServerDate(). Requesting user data...');
    globalThis.syncLog.push('Executing getLastServerDate(). Requesting user data...');

    //Request the user data
    request(globalThis.trackerServerURL+'/api/userdata/'+serverSettings.userId, function (error, response, body) {
      
      //If the request was successfull.
      if (!error && response.statusCode == 200) {
        //debugger;
        
        if(global.debugState)
          console.log('...user data successfully retrieved.');
        globalThis.syncLog.push('...user data successfully retrieved.');
        
        //Convert the data from a string into a JSON object.
        var data = JSON.parse(body);
        
        //Get the lastServerDate.
        globalThis.lastServerDate = new Date(data.geodata.lastDate);
        
        if(global.debugState)
          console.log('Server date format: '+data.geodata.lastDate);
        globalThis.syncLog.push('Server date format: '+data.geodata.lastDate);
        
      } else {
        debugger;
        var msg = '...Error returned from server when requesting user data. Server says: '+response.body;
        if(global.debugState)
          console.log(msg);
        globalThis.syncLog.push(msg);
        
        //The the error is a 'not found' type, that means it couldn't find the valid UserData
        if(response.body.indexOf('not found') != -1) {
          msg="Server could not find the UserData ID. Check for typos. If that is not the problem, contact support@crumbshare.com.";
          if(global.debugState)
            console.log(msg);
          globalThis.syncLog.push(msg);
        }
      }
      
      //Couldn't connect to the server.
      if(error) {
        if(global.debugState)
          console.log('Could not connect to server. Error: '+error.message);
        globalThis.syncLog.push('Could not connect to server. Error: '+error.message);
      }
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
  
  //This function is called by findNextFile. The input is the filename of a log file and the function returns a Promise.
  //When the callback resolves, it returns the last time stamp in that log file.
  //If the callback is rejected, the error message is returned.
  this.getLastTimeStamp = function(fileName) {
    //debugger;
    console.log('getLastTimeStamp(), fileName = '+fileName); //debugging
    
    
    var promise = new Promise.Promise();
    
    //Read in log file
    fs.readFile(global.dataLog.logFilePath+ fileName, 'utf8', function(err, data) { 
      if(err) {
        //Pass on the error message.
        promise.reject(err);
      } else {
      
        debugger;
        
        //Convert JSON string to object
        var fileData = JSON.parse(data);
        
        //Get the last time stamp
        var lastEntry = fileData.features.length - 1;
        var lastTimeStamp = new Date(fileData.features[lastEntry].properties.timestamp);
        console.log('lastTimeStamp = '+fileData.features[lastEntry].properties.timestamp); //debugging
        
        //Resolve with the last time stamp.
        promise.resolve(lastTimeStamp);
      }
    })
                
    return promise;
  };
  
  /******************************************************************************
  Summary:
  getSyncLog() is the API handler that returns the contents of the syncLog[] array.
  ******************************************************************************/
  this.getSyncLog = function(request, response, next) {
    //console.log('getSyncLog() called.')
    response.send(globalThis.syncLog);
  }
  
  /******************************************************************************
  Summary:
  startSync()) is the API handler that starts the sync process.
  ******************************************************************************/
  this.startSync = function(request, response, next) {
    console.log('startSync() called. Beginning synchronization with Map Tracks server...')
    globalThis.syncLog.push('startSync() called. Beginning synchronization with Map Tracks server...');
    
    global.serverInterface.intervalHandle = setInterval(global.serverInterface.updateServer, global.serverInterface.timeout);
    response.send(true);
  }
  
  /******************************************************************************
  Summary:
  startSync()) is the API handler that starts the sync process.
  ******************************************************************************/
  this.stopSync = function(request, response, next) {
    console.log('stopSync() called. Stopping synchronization with Map Tracks server...')
    globalThis.syncLog.push('stopSync() called. Stopping synchronization with Map Tracks server...');
    
    //global.serverInterface.intervalHandle = setInterval(global.serverInterface.updateServer, global.serverInterface.timeout);
    clearInterval(global.serverInterface.intervalHandle);
    response.send(true);
  }
  
  return(this);
  
}

exports.Constructor = Constructor;