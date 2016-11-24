//This library contains code associated with reporting the PM2 log via API. This is the
//same log that would appear on the command line. The command line logging is stored to
//a file by pm2, which is the program that runs the app when the RPi reboots. 
//The API retrieves the last 50 lines of the log file and returns them to the client.

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
    debugger;

    console.log('Request Handler getLog() called.');
    
    response.send(true);
  }
  

  
  return(this);
  
}

exports.Constructor = Constructor;