var fs = require('fs');


var globalThis; //Used in functions below when 'this' loses context.

function Constructor() {

  //Used in functions below when 'this' loses context.
  globalThis = this;
  
  this.helloWorld = function() {
    //debugger;
    console.log('Hello World!');
  }
  
  this.readPointFile = function(fileName) {
    
    fs.readFile('./data/'+fileName, 'utf8', function(err, data) {
      if (err) {
        //debugger;

        //The file doesn't exist, so create the GeoJSON structure from scratch.
        if( err.code == "ENOENT" ) {    

          global.jsonPointTimeStamp.data = 
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
          global.jsonPointTimeStamp.fileRead = true;
          global.jsonPointTimeStamp.exists = false;

        //Handle unknown errors.
        } else {
          console.log('Error opening the JSON Point file.');
          throw err;
        }

      } else {
        //debugger;
        //If the file already exists, the read it in.
        global.jsonPointTimeStamp.data = JSON.parse(data);
        global.jsonPointTimeStamp.fileRead = true;
        global.jsonPointTimeStamp.exists = true;
      }
    });
  }
  
  this.readLineStringFile = function(fileName, docName, docDesc) {
    
    fs.readFile('./data/'+fileName, 'utf8', function(err, data) {
      if (err) {
        //debugger;

        //The file doesn't exist, so create the GeoJSON structure from scratch.
        if( err.code == "ENOENT" ) {    

          global.jsonLineString.data = 
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
                    "name": docName,
                    "description": docDesc
                  }
                }
             ]
          };


          //Set flags for file handling.
          global.jsonLineString.fileRead = true;
          global.jsonLineString.exists = false;

        //Handle unknown errors.
        } else {
          console.log('Error opening the JSON LineString file.');
          throw err;
        }

      } else {
        //debugger;
        //If the file already exists, the read it in.
        global.jsonLineString.data = JSON.parse(data);
        global.jsonLineString.fileRead = true;
        global.jsonLineString.exists = true;
      }
    });
  }
  
  return(this);
  
}

exports.Constructor = Constructor;