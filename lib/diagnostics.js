/*
 *  This file contains various diagnostic functions making it easier to control and debug
 *  server connections, wifi, and firmware. Much of this code may be turned off in prouduction.
 */

var ip = require('ip');
var http = require('http'); //Used for GET and POST requests
var request = require('request'); //Used for CURL requests.

var serverSettings = require('../assets/server_settings.json');

var globalThis; //Used in functions below when 'this' loses context.


function Constructor() {

  //Used in functions below when 'this' loses context.
  globalThis = this;
  
  //Store IP values.
  this.localIp = undefined;
  this.globalIp = undefined;
  
  //this.timeoutSetting = 60000*3;  //Production
  this.timeoutSetting = 30000;      //Testing
  this.timeout = this.timeoutSetting; //Number of milliseconds between attempts to upload data to the server.
  this.intervalHandle = undefined;
  
  
  this.getIp = function() {
    //debugger;
    
    //console.log('My local IP: '+ip.address());
    globalThis.localIp = ip.address();
    
    //Query whatismyipaddress.com to get the external IP address.
    http.get('http://bot.whatismyipaddress.com', function(res){
        res.setEncoding('utf8');
        res.on('data', function(chunk){
          debugger;
          //console.log('My external IP: '+chunk);
          globalThis.globalIp = chunk;
        });
      
        res.on('end', function() {
          debugger;
          //console.log('Error when trying to get external IP address');
        });
    }).on('error', function(error) {
      debugger;
      console.log('Error when trying to get IP address: '+error);
    });
  };
  
  this.sendIp = function() {
    //debugger;
    
    //Retrieve the IP addresses.
    globalThis.getIp();
    
    //Quietly exit if either the local or the globl IP have not been retrieved.
    if((globalThis.localIp == undefined) || (globalThis.globalIp == undefined)) {
      return;
    }
    
    //Send the IP addresses to the server.
    request.post({url: global.serverInterface.trackerServerURL+'/api/diagnostics/'+serverSettings.userId+'/update', 
      form: {localIp: globalThis.localIp, globalIp: globalThis.globalIp}},    
      function (error, response, body) {

      try {
      
      //If the request was successfull.
      if (!error && response.statusCode == 200) {
        //debugger;

        //Convert the data from a string into a JSON object.
        var data = JSON.parse(body); //Convert the returned JSON to a JSON string.
        
        if(data.success) {
          console.log('IP address sent to server successfully.');
        } else {
          console.log('Could not updte IP address on server.');
        }

      } else {
        debugger;

        console.log('Server responded with error when trying to update IP address.');
      }
      } catch(err) {
        console.log('sendIp() existing with error:'+err);
      }

    });
    
  };
  
  /******************************************************************************
  Summary:
  startSync()) is the API handler that starts the sync process.
  ******************************************************************************/
  //this.startIpSync = function(request, response, next) {
  this.startIpSync = function() {
    console.log('startIpSync() called. Sending IP address to server for diagnostics...')
    
    globalThis.intervalHandle = setInterval(global.diagnostics.sendIp, globalThis.timeout);
    return true;
  };
  
  /******************************************************************************
  Summary:
  startSync()) is the API handler that starts the sync process.
  ******************************************************************************/
  this.stopIpSync = function() {
    console.log('stopIpSync() called. Stopping IP address broadcast to server...')
    
    //global.serverInterface.intervalHandle = setInterval(global.serverInterface.updateServer, global.serverInterface.timeout);
    //clearInterval(globalThis.intervalHandle);
    return true;
  };
  
  
  return this;
}

exports.Constructor = Constructor;