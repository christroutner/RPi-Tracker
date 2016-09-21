var fs = require('fs');
var tokml = require('tokml'); //Used for converting GeoJSON to KML.
//var serverInterface = require('./server-interface.js');

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
  this.timeout = 30000; 
  this.fileSaveCnt = 10;
  
  this.logFileOpened = false; //A flag to signal when the log files have been created, which depend on getting a timestamp from the GPS.
  
  
  this.helloWorld = function() {
    //debugger;
    console.log('Hello World!');
  }
  
  this.readPointFile = function() {
    
    fs.readFile('./data/'+ this.fileNameGeoJSONPoint, 'utf8', function(err, data) { 
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
                "geometry": {"type": "Point", "coordinates": [-122.36459, 48.30898]},
                "properties": 
                {
                  "timestamp": "",
                  "name": ""
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
    
    fs.readFile('./data/'+this.fileNameGeoJSONLineString, 'utf8', function(err, data) {
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
                    "coordinates": []
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
  
  this.logData = function() {
    debugger;

    if(globalThis.logFileOpened) {

      //Used for debugging. This is how you disconnect the listener from the GPS.
      //listener.disconnect(function() {
      //    console.log('Disconnected');
      //});
      //listener.unwatch();

      //Error Handlling. Skip if GPS timestamp is blank.
      if(global.gpsInterface.timeStamp = "")
        return;
      
      //Increment the counter.
      globalThis.timerCnt++;

      if(global.debugState)
        console.log('Interval. timerCnt='+this.timerCnt);

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

        var filePointTimeStampOutput = JSON.stringify(globalThis.jsonPointTimeStamp.data, null, 4);
        var fileLineStringOutput = JSON.stringify(globalThis.jsonLineString.data, null, 4);

        //used for debugging.
        console.log('tick...');
        debugger;

        //Write out the GeoJSON and KML Point files.
        if(globalThis.jsonPointTimeStamp.fileRead) {

          fs.writeFile('./assets/logfiles/'+globalThis.fileNameGeoJSONPoint, filePointTimeStampOutput, function (err) {
            if(err) {
              console.log('Error while trying to write GeoJSON Point file output.');
              console.log(err);
            } else {
              if(global.debugState)
                console.log('GPS data file updated. Time Stamp: '+timeStamp);
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
              if(global.debugState)
                console.log('KML GPS data file updated. Time Stamp: '+timeStamp);
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
              if(global.debugState)
                console.log('GPS data file updated. Time Stamp: '+timeStamp);
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
              if(global.debugState)
                console.log('KML GPS data file updated. Time Stamp: '+timeStamp);
            }

          });


        }

       




        globalThis.timerCnt = 0;
      }
    }
  }
  
  return(this);
  
}

exports.Constructor = Constructor;