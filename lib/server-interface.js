/*
 *  This library controls the synchronization between the RPi-Tracker and Crumb Share server.
 *  The basic sync flow looks like this:
 *  updateServer() called by a timer from rpi-tracker.js
 *  updateServer() -> syncWithServer() -> findNextFile() -> sendLogFile() -> checkUpload() -> getLastServerDate()
 *  and the above cycle repeats until all log files have been sent to the server. Once that happens,
 *  syncWithServer() will send the current days log file repeatedly to keep the server updated in real-time.
 */

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
  //this.userId = serverSettings.userId; 
  
  // 2/5/17 CT
  //Sometimes, due to a lot of variables, the sync gets stuck. This counter is used to
  //detect this behavior and for the RPi-Tracker to send the next days log file.
  this.sameServerDate = undefined;
  this.sameServerDateCnt = 0;
  this.forceNextDate = false; //Flag used to signal if the next log file needs to be forced to be uploaded.
  
  this.logFileCnt = 0;
  
  this.syncLog = []; //An array of strings containing the server sync log. This information is displayed in the users UI.
  this.syncInProgress = false;
  
  //This is a high-level function that is called from an Interval in rpi-tracker.js.
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
        //debugger;
        
        //Only continue if the syncInProgress flag is false.
        if(!globalThis.syncInProgress) {
          
          //Set the syncInProgress flag to signal that a file upload is in progress.
          globalThis.syncInProgress = true;
          if(global.debugState)
                console.log('syncInProgress flag set to true.');
          
          globalThis.syncWithServer();
        }
          
        
      }
      
    }
  };

  //This function is called by this.updateServer().
  //This function determins the appropriate log file to send to the server, and uploads it as a GeoJSON file.
  //If the server and client are in-sync, then the current days log file is uploaded to the server to keep it in sync.
  //If the server is more than a day behind the client, then this function will send the next log file needed by the server
  //until the server and client are synced.
  this.syncWithServer = function() {
    debugger;

    console.log('syncWithServer() called...');
    globalThis.syncLog.push('syncWithServer() called...');
    
    //A lot of program logic is determined by comparing the dates between the client (RPi-Tracker) and Crumb Share server.
    //Note: This is 'day', not the 'date'.
    var serverDayStamp = globalThis.Date2DayStamp(globalThis.lastServerDate);
    var clientDayStamp = globalThis.Date2DayStamp(global.gpsInterface.timeStamp);

    //var fileNames = [];
    
    if(global.debugState) {
      console.log('Server\'s last log file: '+globalThis.lastServerDate+', Day stamp: '+serverDayStamp);
      console.log('Client\'s time: '+global.gpsInterface.timeStamp+', Day stamp: '+clientDayStamp);
      
      //Do not change these strings. app.js depends on them to detect when sync is done.
      globalThis.syncLog.push('Server\'s last log file: '+globalThis.lastServerDate);
      globalThis.syncLog.push('Client\'s time: '+global.gpsInterface.timeStamp);
    }

    //If the dates match, the server has already caught up and we only need to send the current days log as it gets updated.
    if(serverDayStamp == clientDayStamp) {
      //debugger;
      
      //Slow down server calls. Restore the timeout frequency of server calls to the original setting.
      //This is most handy when updating the server in real-time. Don't need to make sync calls to the server so frequently.
      globalThis.timeout = globalThis.timeoutSetting;
    
      var fileName = clientDayStamp+'-PT.json';
      
      //Send the client log file to update the server log file.
      globalThis.sendLogFile(fileName);
      

    //The server is more than a day behind and needs any daily log files saved to the client disk.
    //Send log files until the dates match.
    } else {
      debugger;
      
      //generate a filename from the server day stamp
      var fileName = serverDayStamp+'-PT.json';
      
      //get the last timestamp contained in the log file on the server.
      var promiseServerLastTimeStamp = globalThis.getServerLastTimeStamp(fileName);      
      promiseServerLastTimeStamp.then( function(results) {
        debugger;
        
        //get the last timestamp conained the log file on the client.
        var promiseClientLastTimeStamp = globalThis.getLastTimeStamp(fileName);
        promiseClientLastTimeStamp.then( function(results) {
          debugger;
          
          //Is the last timestamp in the log file on the client newer than the last timestamp stored on the server?
          //Yes: Send the current log file

          //No: Find the next file
          
        }, function(error) {
          
          console.error('Error resolving promise for getLastTimeStamp('+fileName+'). Error:', error);
        
          //Clear the sync-in-progress flag so the system can continue to sync the next file.
          globalThis.syncInProgress = false;
          if(global.debugState)
            console.log('syncInProgress flag set to false.');
          
        });
        
      }, function(error) {
        
        console.error('Error resolving promise for getServerLastTimeStamp('+fileName+'). Error:', error);
        
        //Clear the sync-in-progress flag so the system can continue to sync the next file.
        globalThis.syncInProgress = false;
        if(global.debugState)
          console.log('syncInProgress flag set to false.');
        
      });
      
      
      
      
      //OLD CODE
      //Find and send the next file.
      //globalThis.findNextFile();
    }

  };

  //This function iteratively calls itself to increment the logFileCnt until the next available log file is found
  //or the client date matches the server date.
  this.findNextFile = function() {
    //debugger;
    
    if(global.debugState) {
      console.log('Executing findNextFile()');
      //globalThis.syncLog.push('Executing findNextFile()');
    }
    
    var msPerDay = 1000*60*60*24; //number of milliseconds in a day.
      
    //Assumption: server date will always be older than client date.

    var serverDate = globalThis.lastServerDate;
    var gpsDate = global.gpsInterface.timeStamp;
    
    //Calculate the number of days between the server time and client time.
    var numDays = Math.floor((gpsDate.getTime() - serverDate.getTime())/msPerDay);

    console.log('logFileCnt = '+globalThis.logFileCnt+', numDays = '+numDays);
    
    //Loop through each day
    //CT 4/28/17 Changed from < to <= to try and fix sync bug found on 4/27.
    if(globalThis.logFileCnt < numDays) {

      //Create a candidate file name.
      var candidate = globalThis.Date2DayStamp(new Date(serverDate.getTime()+(globalThis.logFileCnt)*msPerDay));
      
      //Retrieve the last time stamp stored in the candidate file.
      //Used to compare the last time stamp in the file with the last time stamp retrieved from the server.
      var promiseLastTimeStamp = globalThis.getLastTimeStamp(candidate+'-PT.json');
      
      //Compare the last timestamp in the current file with the timestamp of the server.
      promiseLastTimeStamp.then( function(result) {
        //debugger;
        
        //if server timestamp is newer (or equal) to the log file's time stamp: 
        //Send the NEXT DAYS log file.
        if(globalThis.lastServerDate >= result) {
          
          //Default behavior.
          if(!globalThis.forceNextDate) {
            var curLogFile = globalThis.Date2DayStamp(new Date(serverDate.getTime()+(globalThis.logFileCnt+1)*msPerDay));
          
          //If the force flag is set, force the next days log file. This only happens when the server has issues processing
          //the last log file. e.g. data is scrubbed or there was an error processing the JSON.
          } else {
            //debugger;
            globalThis.forceNextDate = false;
            var curLogFile = globalThis.Date2DayStamp(new Date(serverDate.getTime()+(globalThis.logFileCnt+2)*msPerDay));
          }
          
        //if server timestamp is older than the log file's time stamp:
        //Send the CURRENT log file.
        } else {
          //debugger; 
          
          //Clear the flag if it's set. Testing showed that this flag does not need to be set if the code enters this path.
          globalThis.forceNextDate = false;
            
          
          var curLogFile = globalThis.Date2DayStamp(new Date(serverDate.getTime()+(globalThis.logFileCnt)*msPerDay));
          
          
          // 2/5/17 CT
          //Sometimes, due to a lot of variables, the sync gets stuck. This counter is used to
          //detect this behavior and for the RPi-Tracker to send the next days log file.
          
          //Initialize the counter, the first time through.
          if( (globalThis.sameServerDate == undefined) || (globalThis.sameServerDateCnt == 0) ) {
            globalThis.sameServerDate = globalThis.lastServerDate;
            globalThis.sameServerDateCnt = 1;
            
          } else {
            
            //If the dates are not equal, then reset the counter.
            if(globalThis.sameServerDate.getTime() != globalThis.lastServerDate.getTime()) {
              globalThis.sameServerDate = globalThis.lastServerDate;
              globalThis.sameServerDateCnt = 0;
              
            //Dates are equal and counter is not zero.
            } else {
              globalThis.sameServerDateCnt++;  //Increment the counter.
              
              //lastServerDate has been stuck in the same time for three passes, force upload of next log file.
              if(globalThis.sameServerDateCnt == 3) {
                debugger;
                curLogFile = globalThis.Date2DayStamp(new Date(serverDate.getTime()+(globalThis.logFileCnt+1)*msPerDay));
                
                globalThis.sameServerDate = globalThis.lastServerDate;
                globalThis.sameServerDateCnt = 0;
                
                if(global.debugState)
                  console.log('Dectected that sync is stuck. Forcing upload of next log file.');
              } else {
                if(global.debugState)
                  console.log('Sync might be stuck. sameServerDateCnt = '+globalThis.sameServerDateCnt);
              }
            }
          }
          
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
            //debugger;
            
            if(global.debugState)
              console.log('fs.access says '+fileName+' exists. Sending to server.');
            globalThis.syncLog.push('fs.access says '+fileName+' exists. Sending to server.');

            //Clear the counter.
            globalThis.logFileCnt = 0; //Reset counter.
            
            //Send the log file to the server.
            globalThis.sendLogFile(fileName);
          
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
        if(error.code != "ENOENT") {          
          debugger;
          console.log('Problem in server-interface.js/findNextFile():');
          console.error('Promise returned by getLastTimeStamp() threw an error!');
          console.error(error.message);
        }
        
        //Increment the counter and try the next file.
        globalThis.logFileCnt++;
        globalThis.findNextFile();
        
      });
      
    //Once the counter runs out, continue uploading the latest data.
    } else {
      //debugger;
      
      //Force the server time stamp to match the client time stamp.
      //This will trigger the upload of the latest data on the next interation of syncWithServer().
      globalThis.lastServerDate = global.gpsInterface.timeStamp;
      
      //Clear the syncInProgress flag.
      globalThis.syncInProgress = false;
      if(global.debugState)
            console.log('syncInProgress flag set to false.');
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

          //Query the server to verify the processing of the log file succeeded.
          //Wait a few seconds to prevent a race condition and give the server time to process the log file.
          setTimeout(function() {globalThis.checkUpload(fileName);}, 3000);

        });

        //If the server does not respond.
        request.on('error', function(err) {
          debugger;
          
          if(global.debugState)
            console.log('...server unreachable. Error: '+err.message);
          globalThis.syncLog.push('...server unreachable. Error: '+err.message);
          
          //Clear the sync-in-progress flag so the system can continue to sync the next file.
          globalThis.syncInProgress = false;
          if(global.debugState)
            console.log('syncInProgress flag set to false.');
        });
      
      //File does not exist.
      } else {
        debugger;
        
        console.error('WARNING: Tried to send file '+fileName+' to server, but it does not exist!');
        globalThis.syncLog.push('WARNING: Tried to send file '+fileName+' to server, but it does not exist!');
        
        //Clear the sync-in-progress flag so the system can continue to sync the next file.
        globalThis.syncInProgress = false;
        if(global.debugState)
          console.log('syncInProgress flag set to false.');
      }
        
    });
  };
  
  //This function queries the server to get the processing status of the uploaded log file.
  //The user GUID is stored in the global variable serverSettings.userId.
  this.checkUpload = function(filename) {
    //debugger;
    
    //Exit if the userId isn't defined.
    if((serverSettings.userId == "") || (serverSettings.userId == undefined))
      return;
    
    if(global.debugState)  
      console.log('Executing checkUpload(). Requesting file status...');
    globalThis.syncLog.push('Executing checkUpload(). Requesting file status...');
    
    //Generate a date string from the file name.
    var month = filename.slice(5,7);
    var day = filename.slice(8,10);
    var year = filename.slice(2,4);
    var filedate = month+day+year;
    
    //Request the file status
    request(globalThis.trackerServerURL+'/api/trackinglogfile/status/'+serverSettings.userId+'/'+filedate, function (error, response, body) {
      
      //If the request was successfull.
      if (!error && response.statusCode == 200) {
        debugger;
        
        //Convert the data from a string into a JSON object.
        var data = JSON.parse(body); //Convert the returned JSON to a JSON string.
        var data = JSON.parse(data.status); //Convert the JSON string into an object.
        
        if(global.debugState)
          console.log('...processing status: '+data.status);
        globalThis.syncLog.push('...processing status: '+data.status);
        
        if(data.status == 'success') {
          
          globalThis.forceNextDate = false;
          
        } else if(data.status == 'error') {
          //debugger;
          
          //Signal that the next log file date needs to be forced.
          globalThis.forceNextDate = true;
        
        } else if(data.status == 'scrubbed') {
          //debugger;
          
          //Signal that the next log file date needs to be forced.
          //globalThis.forceNextDate = true;
          
        } else {
          debugger;
          console.log('...unknown processing status returned: '+data.status);
        }
        
        //Get the updated server timestamp.
        globalThis.getLastServerDate();
        
      } else {
        debugger;
        
        try {
          //Set flag to true to force the upload of the next log file.
          globalThis.forceNextDate = true;
          
          var msg = '...Error returned from server when requesting log file status. Server returned: '+response.statusCode;
          if(global.debugState)
            console.log(msg);
          globalThis.syncLog.push(msg);

          //The the error is a 'not found' type, that means it couldn't find the valid UserData
          if(response.body.indexOf('not found') != -1) {
            msg="Server could not find the record for UserData ID "+serverSettings.userId+".";
            if(global.debugState)
              console.log(msg);
            globalThis.syncLog.push(msg);
          }
          
        //Catch unexpected errors.
        } catch(err) {
          var msg = 'Error in server-interface.js/checkUpload(). Error: '+err.message;
          console.error(msg);
          globalThis.syncLog.push(msg);
        }
        
        //Clear the sync-in-progress flag so the system can continue to sync the next file.
        globalThis.syncInProgress = false;
        if(global.debugState)
          console.log('syncInProgress flag set to false.');
      }

    });
    
  }
  
  //This function calls getServerLogStatus() then returns a promise. When
  //getServerLogStatus() resolves it's promise, this function resolvs its
  //promise with the lastTimeStamp stored on the servers copy of the log file with filename.
  this.getServerLastTimeStamp = function(filename) {
    debugger;
    console.log('getServerLastTimeStamp(), filename = '+filename); //debugging
    
    var promise = new Promise.Promise();
    
    var promiseServerLogStatus = globalThis.getServerLogStatus(filename);
    
    promiseServerLogStatus.then( function(data) {
      debugger;
      
      if(data.lastTimeStamp != undefined)
        promise.resolve(data.lastTimeStamp);
      else
        promise.reject('lastTimeStamp is not defined!');
      
    }, function(error) {
      debugger;
      
      promise.reject(error);
    });
    
    return promise;
  }
  
  //This function queries the server to get the processing status of the uploaded log file with
  //the client-based filename.
  //It returns a promise, and when the promise is resolved, it contains the textArray field for
  //that file, including the filename, processing status, and last timestamp.
  this.getServerLogStatus = function(filename) {
    debugger;
    
    console.log('getServerLogStatus(), filename = '+filename); //debugging
    
    var promise = new Promise.Promise();
    
    //Exit if the userId isn't defined.
    if((serverSettings.userId == "") || (serverSettings.userId == undefined))
      return;
    
    //if(global.debugState)  
    //  console.log('Executing checkUpload(). Requesting file status...');
    //globalThis.syncLog.push('Executing checkUpload(). Requesting file status...');
    
    //Generate a date string from the file name.
    var month = filename.slice(5,7);
    var day = filename.slice(8,10);
    var year = filename.slice(2,4);
    var filedate = month+day+year;
    
    //Request the file status
    request(globalThis.trackerServerURL+'/api/trackinglogfile/status/'+serverSettings.userId+'/'+filedate, 
            function (error, response, body) {
      
      //If the request was successfull.
      if (!error && response.statusCode == 200) {
        debugger;
        
        //Convert the data from a string into a JSON object.
        var data = JSON.parse(body); //Convert the returned JSON to a JSON string.
        var data = JSON.parse(data.status); //Convert the JSON string into an object.
        
        //Resolve with the textArray data.
        promise.resolve(data);
        
      } else {
        debugger;
        
        promise.reject(err);

      }

    });
    
    return promise;
  }
  
  //This function queries the server to get the last known upload date for the given user GUID.
  //This is the timestamp stored in the UserData model.
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
        
        try {
          var msg = '...Error returned from server when requesting user data. Server returned: '+response.statusCode;
          if(global.debugState)
            console.log(msg);
          globalThis.syncLog.push(msg);

          //The the error is a 'not found' type, that means it couldn't find the valid UserData
          if(response.statusMessage.indexOf('not found') != -1) {
            msg="Server could not find the UserData ID "+serverSettings.userId+". Check for typos. If that is not the problem, contact support@crumbshare.com.";
            if(global.debugState)
              console.log(msg);
            globalThis.syncLog.push(msg);
          }
          
        //Catch unexpected errors.
        } catch(err) {
          var msg = 'Error in server-interface.js/getLastServerDate(). Error: '+err.message;
          console.error(msg);
          globalThis.syncLog.push(msg);
        }
      }
      
      
      //Clear the sync-in-progress flag so the system can continue to sync the next file.
      globalThis.syncInProgress = false;
      if(global.debugState)
        console.log('syncInProgress flag set to false.');
      
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
        return;
      } else {
      
        //debugger;
        
        try {
          //Convert JSON string to object
          var fileData = JSON.parse(data);
        } catch(err) {
          console.error('Problem in server-interface.js/getLastTimeStamp(). Could not read '+fileName+'!');
          console.error(err);
          promise.reject(err);
          return;
        }
          
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
    console.log('startSync() called. Beginning synchronization with Crumb Share server...')
    globalThis.syncLog.push('startSync() called. Beginning synchronization with Crumb Share server...');
    
    global.serverInterface.intervalHandle = setInterval(global.serverInterface.updateServer, global.serverInterface.timeout);
    response.send(true);
  }
  
  /******************************************************************************
  Summary:
  startSync()) is the API handler that starts the sync process.
  ******************************************************************************/
  this.stopSync = function(request, response, next) {
    console.log('stopSync() called. Stopping synchronization with Crumb Share server...')
    globalThis.syncLog.push('stopSync() called. Stopping synchronization with Crumb Share server...');
    
    //global.serverInterface.intervalHandle = setInterval(global.serverInterface.updateServer, global.serverInterface.timeout);
    clearInterval(global.serverInterface.intervalHandle);
    response.send(true);
  }
  
  return(this);
  
}

exports.Constructor = Constructor;