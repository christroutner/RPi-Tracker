
var FormData = require('form-data');
var fs = require('fs');

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
      
      console.log('Hello World!');

      //Attempt to send updated file to tracker server.
      /*
  DO NOT DELETE!
      var options = {
        host: trackerServerIp,
        port: trackerServerPort,
        path: '/api/fileupload/create',
        method: 'POST'
      };

      http.request(options, function(res) {
        debugger;
      });
      */


      // BEGIN - TEST CODE FOR SENDING LOGS TO SERVER
  
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
        console.log(res.statusCode);
      });
  
    }
  }

  
  return(this);
  
}

exports.Constructor = Constructor;