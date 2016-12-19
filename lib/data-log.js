var fs = require('fs');
var tokml = require('tokml'); //Used for converting GeoJSON to KML.
//var serverInterface = require('./server-interface.js');
var serverSettings = require('../assets/server_settings.json'); //This should be the first library loaded.

var globalThis; //Used in functions below when 'this' loses context.

function Constructor() {

  //Used in functions below when 'this' loses context.
  globalThis = this;
  
  //Local Variables with Default Values.
  this.fileNameGeoJSONPoint = "";
  this.fileNameGeoJSONLineString = "";
  this.fileNameKMLPoint = "";
  this.fileNameKMLLineString = "";
  this.docName = "";
  this.docDesc = "";
  
  this.jsonPointTimeStamp = new Object();
  this.jsonPointTimeStamp.fileRead = false;
  this.jsonPointTimeStamp.exists = false;
  
  this.jsonLineString = new Object();
  this.jsonLineString.fileRead = false;
  this.jsonLineString.exists = false;
  
  this.timerCnt = 0;
  this.timeout = serverSettings.gpsDataLogTimeout  
  this.fileSaveCnt = serverSettings.gpsFileSaveTimeoutCnt;
  this.logFilePath = './assets/logfiles/';
  
  this.logFileOpened = false; //A flag to signal when the log files have been created, which depend on getting a timestamp from the GPS.
  
  
  this.helloWorld = function() {
    //debugger;
    console.log('Hello World!');
  }
  
  this.readPointFile = function() {
    
    fs.readFile(globalThis.logFilePath+ this.fileNameGeoJSONPoint, 'utf8', function(err, data) { 
      if (err) {
        //debugger;

        //The file doesn't exist, so create the GeoJSON structure from scratch.
        if( err.code == "ENOENT" ) {    

          globalThis.jsonPointTimeStamp.data = 
          {
            "type": "FeatureCollection",
              "features": 
            [            
              { 
                "type": "Feature",
                //"geometry": {"type": "Point", "coordinates": [-122.36459, 48.30898]},
                "geometry": {"type": "Point", "coordinates": [global.gpsInterface.coordinateBuffer[0][0], global.gpsInterface.coordinateBuffer[0][1], 0.01]},
                
                "properties": 
                {
                  "timestamp": global.gpsInterface.timeStamp,
                  "name": global.gpsInterface.timeStamp
                }
              }
            ]
          };

          //Set flags for file handling.
          globalThis.jsonPointTimeStamp.fileRead = true;
          globalThis.jsonPointTimeStamp.exists = false;

        //Handle unknown errors.
        } else {
          console.log('Error opening the JSON Point file.');
          throw err;
        }

      } else {
        //debugger;
        //If the file already exists, the read it in.
        globalThis.jsonPointTimeStamp.data = JSON.parse(data);
        globalThis.jsonPointTimeStamp.fileRead = true;
        globalThis.jsonPointTimeStamp.exists = true;
      }
    });
  }
  
  this.readLineStringFile = function() {
    
    fs.readFile(globalThis.logFilePath+this.fileNameGeoJSONLineString, 'utf8', function(err, data) {
      if (err) {
        //debugger;

        //The file doesn't exist, so create the GeoJSON structure from scratch.
        if( err.code == "ENOENT" ) {    

          globalThis.jsonLineString.data = 
            { 
              "type": "FeatureCollection",
              "features": 
              [

                //This format is used for recording LineString data. More appropriate for a breadcrumb trail.
                { 
                  "type": "Feature",
                  "geometry": {
                    "type": "LineString",
                    "coordinates": [[global.gpsInterface.coordinateBuffer[0][0], global.gpsInterface.coordinateBuffer[0][1], 0.01]]
                  },
                  "properties": {
                    //"timestamp": [],
                    "name": globalThis.docName,
                    "description": globalThis.docDesc
                  }
                }
             ]
          };


          //Set flags for file handling.
          globalThis.jsonLineString.fileRead = true;
          globalThis.jsonLineString.exists = false;

        //Handle unknown errors.
        } else {
          console.log('Error opening the JSON LineString file.');
          throw err;
        }

      } else {
        //debugger;
        //If the file already exists, the read it in.
        globalThis.jsonLineString.data = JSON.parse(data);
        globalThis.jsonLineString.fileRead = true;
        globalThis.jsonLineString.exists = true;
      }
    });
  }
  
  //This function generates a filename based on the current time stamp. If they are different, then
  //the clock has rolled over to the next day and the file name is updated.
  this.updateFileName = function() {
    //debugger;
    
    //Get the current timestamp from the GPS
    var timeStamp = global.gpsInterface.timeStamp;
    
    //Error handling. Exit if the timestamp hasn't been retrieved from the GPS.
    if(global.gpsInterface.timeStamp == undefined)
      return;
    
    //Generate a filename based on the current timestamp.
    var tempFileNameGeoJSONPoint = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2)+'-PT'+'.json';
    
    //If the filenames are different...
    if(tempFileNameGeoJSONPoint != global.dataLog.fileNameGeoJSONPoint) {
      //...update the filename of the log files.
      global.dataLog.fileNameGeoJSONPoint = tempFileNameGeoJSONPoint;
      global.dataLog.fileNameGeoJSONLineString = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2)+'-LS'+'.json';
      global.dataLog.fileNameKMLPoint = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2)+'-PT'+'.kml';
      global.dataLog.fileNameKMLLineString = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2)+'-LS'+'.kml';
      global.dataLog.docName = timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2)+" Tracking Data";
      global.dataLog.docDesc = "Tracking data captured with the Raspberry Pi on "+timeStamp.getFullYear()+'-'+('00'+(timeStamp.getUTCMonth()+1)).slice(-2)+'-'+('00'+(timeStamp.getUTCDate())).slice(-2);
      
      console.log('Clock roll-over detected. Chaning log file name to '+tempFileNameGeoJSONPoint);
    }
      
    
  }
  
  this.logData = function() {
    //debugger;

    if(globalThis.logFileOpened) {

      //Used for debugging. This is how you disconnect the listener from the GPS.
      //listener.disconnect(function() {
      //    console.log('Disconnected');
      //});
      //listener.unwatch();

      //Error Handlling. Skip if GPS timestamp is blank.
      if(global.gpsInterface.timeStamp == "")
        return;
      
      //Increment the counter.
      globalThis.timerCnt++;

      

      //Average all the lat and longs in the coordinate buffer.
      var lat = 0;
      var long = 0;
      for( var i = 0; i < global.gpsInterface.coordinateBuffer.length; i++ ) {
        long = long+global.gpsInterface.coordinateBuffer[i][0];
        lat = lat+global.gpsInterface.coordinateBuffer[i][1];
      }
      long = long/global.gpsInterface.coordinateBuffer.length;
      lat = lat/global.gpsInterface.coordinateBuffer.length;

      //Exit if the buffer is full of NaN values.
      if(isNaN(long) || isNaN(lat))
        return;

      //Clear the coordinateBuffer
      global.gpsInterface.coordinateBuffer = [];
      
      //Format the long and lat
      //The toFixed() function rounds the decimal places, but turns it into a string, hence the Number() wrapper.
      var formattedLong = Number(long.toFixed(8));
      var formattedLat = Number(lat.toFixed(8));

      if(global.debugState)
        console.log('tick '+globalThis.timerCnt+'. Coordinates '+formattedLat+', '+formattedLong+' logged.');
      
      //Add the data points to the GeoJSON object (for a Point)
      globalThis.jsonPointTimeStamp.data.features.push(
        { 
          "type": "Feature",
          "geometry": {"type": "Point", "coordinates": [formattedLong, formattedLat, 0.01]},
          "properties": {
            "timestamp": global.gpsInterface.timeStamp,
            "name": global.gpsInterface.timeStamp
          }
        }
      );

      //Add the data point to the GeoJSON object (for a LineString)
      globalThis.jsonLineString.data.features[0].geometry.coordinates.push([formattedLong, formattedLat, 0.01]);
      //jsonFile.data.features[0].properties.timestamp.push(timeStamp);


      //Update the file every fileSaveCnt timer events.
      if( globalThis.timerCnt >= globalThis.fileSaveCnt ) {

        //Update the file name if the clock has rolled over to the next day.
        globalThis.updateFileName();
        
        var filePointTimeStampOutput = JSON.stringify(globalThis.jsonPointTimeStamp.data, null, 4);
        var fileLineStringOutput = JSON.stringify(globalThis.jsonLineString.data, null, 4);

        //used for debugging.
        //console.log('tick...');
        //debugger;

        //Write out the GeoJSON and KML Point files.
        if(globalThis.jsonPointTimeStamp.fileRead) {

          fs.writeFile('./assets/logfiles/'+globalThis.fileNameGeoJSONPoint, filePointTimeStampOutput, function (err) {
            if(err) {
              console.log('Error while trying to write GeoJSON Point file output.');
              console.log(err);
            } else {
              if(global.debugState)
                //console.log('GeoJSON Point file updated. Time Stamp: '+global.gpsInterface.timeStamp);
                console.log('GPS Log written to file. Time Stamp: '+global.gpsInterface.timeStamp);
            }

          });

          //Convert the GeoJSON to KML
          var kmlString = tokml(globalThis.jsonPointTimeStamp.data);

          //Write out the KML data
          fs.writeFile('./assets/logfiles/'+globalThis.fileNameKMLPoint, kmlString, function (err) {
            if(err) {
              console.log('Error while trying to write KML Point file output.');
              console.log(err);
            } else {
              //if(global.debugState)
              //  console.log('KML Point file updated. Time Stamp: '+global.gpsInterface.timeStamp);
            }

          });

        }

        //Write out the GeoJSON and KML LineString files..
        if(globalThis.jsonLineString.fileRead) {

          fs.writeFile('./assets/logfiles/'+globalThis.fileNameGeoJSONLineString, fileLineStringOutput, function (err) {
            if(err) {
              console.log('Error while trying to write GeoJSON LineString file output.');
              console.log(err);
            } else {
              //if(global.debugState)
              //  console.log('GeoJSON LineString file updated. Time Stamp: '+global.gpsInterface.timeStamp);
            }

          });


          //Convert the GeoJSON to KML
          kmlString = tokml(globalThis.jsonLineString.data);

          //Write out the KML data
          fs.writeFile('./assets/logfiles/'+globalThis.fileNameKMLLineString, kmlString, function (err) {
            if(err) {
              console.log('Error while trying to write KML LineString file output.');
              console.log(err);
            } else {
              //if(global.debugState)
              //  console.log('KML LineString file updated. Time Stamp: '+global.gpsInterface.timeStamp);
            }

          });


        }

        globalThis.timerCnt = 0;
      } else {
        console.log('globalThis.timerCnt = '+globalThis.timerCnt+', globalThis.fileSaveCnt = '+globalThis.fileSaveCnt);
      }
    } else {
      //console.log('Error. global variable logFileOpened == false');
    }
  }
  
  return(this);
  
}

exports.Constructor = Constructor;