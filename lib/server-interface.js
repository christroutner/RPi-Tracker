
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
    
    if(global.dataLog.logFileOpened) {



      // BEGIN - TEST CODE FOR SENDING LOGS TO SERVER
  
      if(global.debugState) console.log('Sending data to server...');
      
      var form = new FormData();
      form.append('file_upload', fs.createReadStream('./assets/logfiles/'+global.dataLog.fileNameGeoJSONPoint));

      //Trying another method of submission
      var request = http.request({
        method: 'post',
        host: globalThis.trackerServerIp,
        port: globalThis.trackerServerPort,
        path: '/api/trackinglogfile/create',
        headers: form.getHeaders()
      });

      form.pipe(request);

      request.on('response', function(res) {
        console.log('...server responded with '+res.statusCode);
      });
      
      request.on('error', function(err) {
        if(global.debugState)
          console.log('...server unreachable.')
      });
  
    }
  }

  
  return(this);
  
}

exports.Constructor = Constructor;