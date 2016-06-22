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

//GLOBAL VARIABLES
//var CSVData = new Array(); //Object to hold CSV data
//var UniqueIDList = new Array(); //List of UniqueIDs in the CSV file
//var Location = new Object(); //Location object
//var CustomEvent = new events(); //Custom event object
//var globalResponse = new Object(); //Used to pass response context between functions.


// CUSTOMIZATION VARIABLES
//var wwwDir = '/inetpub/wwwroot/'  //Windows 2008 Server
//var wwwDir = '/var/www/'          //Linux
var wwwDir = './'                   //Node/Express
var sudoPassword = "raspberry"; //The root password required when running 'sudo' commands.



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

/******************************************************************************
Summary:
wifiSettings() allows configuration of the WiFi interface.
******************************************************************************/
function wifiSettings(request, response, next) {
  debugger;
  
  //Just a general test to verify that the request doesn't contain garbage, but an expected data structure.
  if(request.query.wifiType < 3) {
    
    //Save the passed in server settings to the global variable serverSettings.
    serverSettings = request.query;
    
    //Write out the server_settings.json file.
    fs.writeFile('./assets/server_settings.json', JSON.stringify(serverSettings, null, 4), function (err) {
      if(err) {
        console.log('Error in wifiSettings() while trying to write server_settings.json file.');
        console.log(err);
      } else {
        console.log('wifiSettings() executed. server_settings.json updated.');
      }

    });
    
    //Write out new wpa_supplicant.conf file
    write_wpa_supplicant();
    
    //Write out new hostapd.conf file
    write_hostapd();
    
    response.send(true);
    
    //If the reboot flag is set, then prepare to reboot the Pi
    if(serverSettings.rebootConfirmationNeeded == "true") {
      debugger;
      
      //AP
      if(serverSettings.wifiType == 1) {
        
        exec('sudo -A '+sudoPassword+' ./wifi_AP/rpi3/make_AP/makeAP', function(err, stdout, stderr) {
          debugger;
        });
        
      //Client
      } else if(serverSettings.wifiType == 2) {
        
        exec('sudo -A '+sudoPassword+' ./wifi_AP/rpi3/wifi_client/restoreWifi', function(err, stdout, stderr) {
          debugger;
        });
        
      }
    }
  
  //This handles garbage queries. Return false.
  } else {
    response.send(false)
  }
  
  //response.send(true);
  
}

//This function is called by wifiSettings(). It's purpose is to write out a new wpa_supplicant file.
function write_wpa_supplicant() {
  //debugger;
  
  var outStr = "";
  
  //Write out file header
  outStr += "ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev\n";
  outStr += "update_config=1\n";
  outStr += "country=GB\n\n";
  
  for(var i=0; i < serverSettings.wifiClientSettings.length; i++) {
    outStr += "network={\n";
    outStr += '\tssid="'+serverSettings.wifiClientSettings[i].ssid+'"\n';
    outStr += '\tpsk="'+serverSettings.wifiClientSettings[i].psk+'"\n';
    outStr += '\tkey_mgmt='+serverSettings.wifiClientSettings[i].key_mgmt+'\n';
    outStr += "}\n\n";
  }
  
  //Write out the wpa_supplicant file.
  fs.writeFile('./wifi_AP/rpi3/wifi_client/wpa_supplicant.conf', outStr, function (err) {
    if(err) {
      console.log('Error in write_wpa_supplicant() while trying to write wpa_supplicant.conf file.');
      console.log(err);
    } else {
      console.log('write_wpa_supplicant() executed. wpa_supplicant.conf updated.');
    }

  });
}

//This function is called by wifiSettings(). It's purpose is to write out a new wpa_supplicant file.
function write_hostapd() {
  debugger;
  
  var outStr = ""; //Initialize
  
  outStr += "interface=wlan0\n";
  outStr += "driver=nl80211\n";
  outStr += "ssid="+serverSettings.wifiAPSettings.ssid+"\n";
  outStr += "hw_mode=g\n";
  outStr += "channel="+serverSettings.wifiAPSettings.channel+"\n";
  outStr += "macaddr_acl=0\n";
  outStr += "auth_algs=1\n";
  outStr += "ignore_broadcast_ssid=0\n";
  outStr += "wpa=2\n";
  outStr += "wpa_passphrase="+serverSettings.wifiAPSettings.psk+"\n";
  outStr += "wpa_key_mgmt=WPA-PSK\n";
  outStr += "wpa_pairwise=TKIP\n";
  outStr += "rsn_pairwise=CCMP\n";
  
  //Write out the hostapd.conf file.
  fs.writeFile('./wifi_AP/rpi3/make_AP/hostapd.conf', outStr, function (err) {
    if(err) {
      console.log('Error in write_hostapd() while trying to write hostapd.conf file.');
      console.log(err);
    } else {
      console.log('write_hostapd() executed. hostapd.conf updated.');
    }

  });
}


exports.listLogFiles = listLogFiles;
exports.queryTracking = queryTracking;
exports.wifiSettings = wifiSettings;
