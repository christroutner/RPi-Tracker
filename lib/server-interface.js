
var FormData = require('form-data');
var fs = require('fs');
var http = require('http'); //Used for GET and POST requests

var globalThis; //Used in functions below when 'this' loses context.


function Constructor() {

  //Used in functions below when 'this' loses context.
  globalThis = this;
  
  this.timeout = 15000; //Number of milliseconds between attempts to upload data to the server.
  this.intervalHandle = undefined;
  
  //Tracker server
  this.trackerServerIp = '198.199.94.71';
  this.trackerServerPort = '3000';
  
  this.updateServer = function() {
    
    //Only try executing the code below if the a GPS timestamp has been retrieved and the log files have been opened successfully.
    if(global.dataLog.logFileOpened) {

      globalThis.sendLogFile();
  
    }
  };

  this.sendLogFile = function() {
    if(global.debugState) 
        console.log('Sending log file to server...');
      
      //Create an HTTP form.
      var form = new FormData();
      //Append the log file to the Form.
      form.append('file_upload', fs.createReadStream('./assets/logfiles/'+global.dataLog.fileNameGeoJSONPoint));

      //Create an http request.
      var request = http.request({
        method: 'post',
        host: globalThis.trackerServerIp,
        port: globalThis.trackerServerPort,
        path: '/api/trackinglogfile/create',
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
  
  
  return(this);
  
}

exports.Constructor = Constructor;