
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
  
  this.lastServerDate = undefined;
  this.userId = "57e1a18460390704dc1a10d9";
  
  this.updateServer = function() {
    
    //Only try executing the code below if the a GPS timestamp has been retrieved and the log files have been opened successfully.
    if(global.dataLog.logFileOpened) {

      globalThis.getLastServerDate();
      
      //globalThis.sendLogFile();
  
    }
  };

  //This function attempts to send the GeoJSON point file to the server.
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
  
  //This function queries the server to get the last known upload date the given user name.
  this.getLastServerDate = function() {
    
    if(global.debugState)
      console.log('Requesting user data...');
    
    var request = http.request({
      method: 'get',
      host: globalThis.trackerServerIp,
      port: globalThis.trackerServerPort,
      path: '/api/userdata/'+globalThis.userId,
    });
    
    request.on('response', function(res) {
      debugger;
      
      if(global.debugState)
        console.log('...user data successfully retrieved.');
    });
    
    request.on('error', function(err) {
      //debugger;
      if(global.debugState)
        console.log('...could not communicate with server. '+err.message);
    });
    
  }
  
  return(this);
  
}

exports.Constructor = Constructor;