//Node.js module used to execute command line programs.
//var exec = require("child_process").exec;

//LIBRARIES
var querystring = require("querystring");
var fs = require('fs'); //file system library
var parse = require('csv-parse'); //CSV parser
//var transform = require('stream-transform'); //data streams transformer
var serverhtml = require('./page_html.js'); //HTML strings for building pages.
var et = require('elementtree'); //Library used for XML parsing.
var events = require('events').EventEmitter; //Event emitter library.
var rander = require('rander'); //Library used to generate UniqueIDs.
var ya_csv = require('ya-csv'); //Ya-csv library used to output csv files.
var exec = require('child_process').exec; //Used to execute command line instructions.
var serverSettings = require('./assets/server_settings.json');
var spawn = require('child_process').spawn; //Used to execut sudo level commands
var sudo = require('sudo'); //Used to execut sudo level commands with spawn

//GLOBAL VARIABLES
//var CSVData = new Array(); //Object to hold CSV data
//var UniqueIDList = new Array(); //List of UniqueIDs in the CSV file
//var Location = new Object(); //Location object
//var CustomEvent = new events(); //Custom event object
//var globalResponse = new Object(); //Used to pass response context between functions.


// CUSTOMIZATION VARIABLES
//var wwwDir = '/inetpub/wwwroot/'  //Windows 2008 Server
//var wwwDir = '/var/www/'          //Linux
//var wwwDir = './'                   //Node/Express
//var sudoPassword = "raspberry"; //The root password required when running 'sudo' commands.



/******************************************************************************
Summary:
listLogFiles() performs a listing of the 'data' directory and returns an array
of strings representing the file names in that directory.
******************************************************************************/
function listLogFiles(request, response, next) {
  console.log("Request handler 'listLogFiles()' was called.");
  //debugger;
  //Execute a list of the data files.
  //Filtering for just *-LS.json reduces noise and complexity, since I know there will be 4 files and what the end of their file names will be.
  exec('ls ./assets/logfiles/20*-LS.json', function(err, stdout, stderr) {
    //debugger;
    
    //Split the string by the new line character.
    var fileList = stdout.split("\n");
    
    //If any elements are empty strings, then remove them.
    for(var i = 0; i<fileList.length; i++) {
      if(fileList[i] == "") {
        fileList.splice(i, 1);
      }
    }
    
    response.send(fileList);
  });
}

/******************************************************************************
Summary:
queryTracking() returns true if tracking mode is active and false if it is not active.
Optionally an boolean 'tracking' argument can be input. True will turn on tracking
and false will turn it off.
******************************************************************************/
function queryTracking(request, response, next) {
  //debugger;
  
  var changeState = request.query.changeState;
  
  console.log("Request handler 'queryTracking()' was called.");
  
  //Send the value of the isTracking state variable if no changeState value was passed in.
  if( changeState == undefined ) {
    if(request.app.locals.isTracking) {
      //debugger;
      response.send(true);
    } else {
      //debugger;
      response.send(false);
    }
    
  //Set the state of tracking if a changeState value was passed in.
  } else {
    //debugger;
    if(changeState == "false") {
      request.app.locals.listener.disconnect(function() {
        //debugger;
        console.log('GPS Disconnected');
        request.app.locals.isTracking = false;
        response.send('false');
      });
    } else {
      request.app.locals.listener.connect(function() {
        //debugger;
        console.log('GPS Connected');
        request.app.locals.isTracking = true;
        response.send('true');
      });
    }
  }
  
}

//This API expects to be sent the serverSettings JSON object. It then saves that data to a JSON file.
function saveSettings(request, response, next) {
  debugger;
  
  //Just a general test to verify that the request doesn't contain garbage, but an expected data structure.
  if(request.query.wifiType < 3) {
  
    //Save the passed in server settings to the global variable serverSettings.
    serverSettings = request.query;

    //Write out the server_settings.json file.
    fs.writeFile('./assets/server_settings.json', JSON.stringify(serverSettings, null, 4), function (err) {
      if(err) {
        console.log('Error in saveSettings() while trying to write server_settings.json file.');
        console.log(err);
        response.send(false); //Send failure
      } else {
        console.log('saveSettings() executed. server_settings.json updated.');
        response.send(true); //Send acknowledgement that setting were saved successfully.
      }
    });
  }
}

//This API executes the command line 'git pull' instruction and then reboots the device.
function updateSoftware(request, response, next) {
  
  //Execute 'git stash' first, otherwise 'git pull' might error out.
  exec('git stash', function(err, stdout, stderr) {
    debugger;
    
    if (err) {
      console.log('updateSoftware() had issues while executing "git stash". Child process exited with error code ' + err.code);
      console.log(err.message);
      response.send(false);
      return;
    }
    
    console.log(stdout);
    
    //Execute 'git pull'
    exec('git pull', function(err, stdout, stderr) {
      debugger;

      if (err) {
        console.log('updateSoftware() had issues while executing "git pull". Child process exited with error code ' + err.code);
        console.log(err.message);
        response.send(false);
        return;
      }

      console.log(stdout);

      response.send(true); //Send acknowledgement that git pull was successfully executed.

      var options = {
        cachePassword: true,
        prompt: 'Password, yo? ',
        spawnOptions: { }
      }

      child = sudo([ '/sbin/reboot', 'now' ], options);
      child.stdout.on('data', function (data) {
        console.log(data.toString());      
      });
      child.stderr.on('data', function (data) {
        console.log('updateSoftware() had issues while executing "reboot now". Error: '+data);
        response.send(false);
      });

    });
    
  });
  
}

//This API reboots the device.
function rebootRPi(request, response, next) {

  var options = {
    cachePassword: true,
    prompt: 'Password, yo? ',
    spawnOptions: { }
  }

  child = sudo([ '/sbin/reboot', 'now' ], options);
  child.stdout.on('data', function (data) {
    console.log(data.toString());   
    response.send(true);
  });
  child.stderr.on('data', function (data) {
    console.log('rebootRPi() had issues while executing "reboot now". Error: '+data);
    response.send(false);
  });

}

exports.listLogFiles = listLogFiles;
exports.queryTracking = queryTracking;
//exports.wifiSettings = wifiSettings;
exports.saveSettings = saveSettings;
exports.updateSoftware = updateSoftware;
exports.rebootRPi = rebootRPi;
