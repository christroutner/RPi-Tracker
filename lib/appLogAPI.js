//This library contains code associated with reporting the PM2 log via API. This is the
//same log that would appear on the command line. The command line logging is stored to
//a file by pm2, which is the program that runs the app when the RPi reboots. 
//The API retrieves the last 50 lines of the log file and returns them to the client.

// REQUIRED LIBRARIES
var exec = require('child_process').exec; //Used to execute command line instructions.
var fs = require('fs');

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
    //debugger;
    
    //Command to clear the PM2 log: 'pm2 flush'
    exec('pm2 flush', function(err, stdout, stderr) {
      //debugger;
      
      if (err) {
          console.log('global.appLogAPI.clearLog() child process exited with error code ' + err.code);
          return false;
      }

      return true;
    
    });
  }
  
  //This function is called to backup the existing PM2 log and start another one.
  this.backupLog = function() {
    debugger;
    
    console.log('executing appLogAPI.js/backupLog() to backup PM2 log file.');
    
    //check if the backup directory exists
    fs.access('~/.pm2/logs/bkup', fs.R_OK, function(err) {
      
      //if it doesn't exit, create it.
      if(err) {
        console.log('Creating bkup directory');
        exec(['mkdir ~/.pm2/logs/bkup'], function(err, out, code) {
          debugger;
          
          if(err) {
            throw err;
            return false;
            
          } else {
            globalThis.backupLog(); //Call it again to backup the files, now that the directory has been created.  
          }
        });
        
      } else {
        
        var now = new Date();
        var month = ('00'+(now.getUTCMonth()+1)).slice(-2);
        var day = ('00'+(now.getUTCDate())).slice(-2);
        var year = now.getUTCFullYear().toString().slice(-2);
        var hour = ('00'+now.getUTCHours()).slice(-2);
        var minute = ('00'+now.getUTCMinutes()).slice(-2);
        var seconds = ('00'+now.getUTCSeconds()).slice(-2)
        
        var fileName = year+'-'+month+'-'+day+'-'+hour+'-'+minute+'-'+second;
        
        //if the backup directory exists, copy the old log.
        exec(['cp', '~/.pm2/logs/rpi-tracker-out-0.log', '~/pm2/logs/bkup/'+fileName+'-out.log'], 
             function(err, out, code) {
          debugger;
          
          if(err) {
            console.log('Error copying rpi-tracker-out-0.log.');
            throw err;
            return false;
            
          } else {
            
            console.log('Successfully copied rpi-tracker-out-0.log.');
            
            //Copy the error log too.
            exec(['cp', '~/.pm2/logs/rpi-tracker-error-0.log', '~/pm2/logs/bkup/'+fileName+'-error.log'], 
             function(err, out, code) {
              debugger;
            
              if(err) {
                console.log('Error copying rpi-tracker-error-0.log.');
                throw err;
                return false;
                
              } else {
                console.log('Successfully copied the rpi-tracker-error-0.log.');
                
                //Flush the logs.
                globalThis.clearLog();
                
                return true;
              }
              
            });
          }
          
        } );

      }
      
      
    });
  }
  
  
  return(this);
  
}

exports.Constructor = Constructor;