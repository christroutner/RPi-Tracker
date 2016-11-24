//This library contains code associated with reporting the PM2 log via API. This is the
//same log that would appear on the command line. The command line logging is stored to
//a file by pm2, which is the program that runs the app when the RPi reboots. 
//The API retrieves the last 50 lines of the log file and returns them to the client.

// REQUIRED LIBRARIES
var exec = require('child_process').exec; //Used to execute command line instructions.

//GLOBAL VARIABLES
var globalThis; //Used in functions below when 'this' loses context.


function Constructor() {

  //Used in functions below when 'this' loses context.
  globalThis = this;
  
  this.coordinateBuffer = [];   //Used to collect coordinate and time data between timer events.
  this.timeStamp = undefined;   //Stores the most recent timestamp from the GPS. 'undefined' should be its initial value;
  
  /******************************************************************************
  Summary:
  getLog() is the API handler that returns the last 50 lines of the log
  ******************************************************************************/
  this.getLog = function(request, response, next) {
    //debugger;

    //console.log('Request Handler getLog() called.');
    
    //Retrieve the last 50 lines of the pm2 log.
    exec('tail --lines=50 ~/.pm2/logs/rpi-tracker-out-0.log', function(err, stdout, stderr) {
      //debugger;
      
      if (err) {
          console.log('global.appLogAPI.getLog() child process exited with error code ' + err.code);
          response.send(false);
      }

      //Return the output of the command.
      response.send(stdout);
    
    });
    
    //response.send(true);
  };
  

  //This funciton is called at startup to clear the old pm2 log.
  this.clearLog = function() {
    debugger;
    
    //Command to clear the PM2 log: 'pm2 flush'
  }
  
  return(this);
  
}

exports.Constructor = Constructor;