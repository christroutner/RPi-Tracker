
var FormData = require('form-data');
var fs = require('fs');
var http = require('http'); //Used for GET and POST requests
var request = require('request'); //Used for CURL requests.

var globalThis; //Used in functions below when 'this' loses context.


function Constructor() {

  //Used in functions below when 'this' loses context.
  globalThis = this;
  
  this.timeout = 15000; //Number of milliseconds between attempts to upload data to the server.
  this.intervalHandle = undefined;
  
  //Tracker server
  this.trackerServerIp = '198.199.94.71';
  this.trackerServerPort = '3000';
  this.trackerServerURL = 'http://'+this.trackerServerIp+':'+this.trackerServerPort;
  
  this.lastServerDate = undefined;
  this.userId = "57e1a18460390704dc1a10d9";
  
  this.updateServer = function() {
    
    //Only try executing the code below if the a GPS timestamp has been retrieved and the log files have been opened successfully.
    if(global.dataLog.logFileOpened) {

      if(globalThis.lastServerDate == undefined) {
        globalThis.getLastServerDate();
      
      } else {
        debugger;
        
        var serverDayStamp = globalThis.Date2DayStamp(globalThis.lastServerDate);
        var clientDayStamp = globalThis.Date2DayStamp(global.gpsInterface.timeStamp);
        
        if(global.debugState) {
          console.log('Server\'s last log file: '+globalThis.lastServerDate);
          console.log('Client\'s time: '+global.gpsInterface.timeStamp);
        }
        
        //If the dates match.
        if(serverDayStamp == clientDayStamp) {
          
          //Send the client log file to update the server log file.
          globalThis.sendLogFile(global.dataLog.fileNameGeoJSONPoint);
          
        //The server is more than a day behind and needs any intermediate daily log files.
        } else {
          //Send log files until the dates match.
          debugger;
          
          //String formatting variables.
          var firstPart = serverDayStamp.slice(0,8);
          var serverDay = Number(serverDayStamp.slice(-2));
          var clientDay = Number(clientDayStamp.slice(-2));
          var dayDiff = clientDay - serverDay;
          
          //Loop through the number of days difference between the log files.
          for(var i=0; i < dayDiff; i++) {
            
            //Format the second part of the file name.
            var secondPart = '00'+(serverDay+i);
            secondPart = secondPart.slice(-2);
            
            //Send the log file from client to server if it exists.
            fs.access('./assets/logfiles/'+firstPart+secondPart+'-PT.json', fs.constants.F_OK, function(err) {
              if(!err) {
                globalThis.sendLogFile(firstPart+secondPart+'-PT.json');
              }
            })
            
            
          }
          
        }
        
      }
      
      //globalThis.sendLogFile();
  
    }
  };

  //This function attempts to send the GeoJSON point file to the server.
  this.sendLogFile = function(fileName) {
    
    if(global.debugState) 
      console.log('Sending log file to server...');
      
    //Create an HTTP form.
    var form = new FormData();
    //Append the log file to the Form.
    form.append('file_upload', fs.createReadStream('./assets/logfiles/'+fileName));

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
    
    //Exit if the userId isn't defined.
    if((globalThis.userId == "") || (globalThis.userId == undefined))
      return;
    
    if(global.debugState)  
      console.log('Requesting user data...');
    
    //Request the user data
    request(globalThis.trackerServerURL+'/api/userdata/'+globalThis.userId, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        debugger;
        
        if(global.debugState)
          console.log('...user data successfully retrieved.');
        
        //Convert the body into a JSON object.
        var data = JSON.parse(body);
        
        //Get the lastServerDate.
        globalThis.lastServerDate = new Date(data.geodata.lastDate);
        
      }
      
      if(error)
        console.log('...Got error: '+error.message);
    })
    
  };
  
  //This function takes a Date object as input and returns a day stamp string in the format of YYYY-MM-DD
  this.Date2DayStamp = function(date) {
    debugger;
    
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
  
  return(this);
  
}

exports.Constructor = Constructor;