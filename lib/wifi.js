var fs = require('fs'); //file system library
var querystring = require("querystring");
var exec = require('child_process').exec; //Used to execute command line instructions.
var serverSettings = require('../assets/server_settings.json');
var sudo = require('sudo'); //Used to execut sudo level commands with spawn

var globalThis; //Used in functions below when 'this' loses context.

function Constructor() {
  
  //Used in functions below when 'this' loses context.
  globalThis = this;
  
  //Enable to disable debug logging to the console for this library.
  this.debugState = true;
  
  /******************************************************************************
  Summary:
  wifiSettings() allows configuration of the WiFi interface.
  ******************************************************************************/
  this.wifiSettings = function(request, response, next) {
    //debugger;

    console.log('Request Handler wifiSettings() called.');

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
      globalThis.write_wpa_supplicant();

      //Write out new hostapd.conf file
      globalThis.write_hostapd();

      response.send(true);

      //If the reboot flag is set, then prepare to reboot the Pi
      if(serverSettings.rebootConfirmationNeeded == "true") {
        debugger;

        //Dev-Note: uid=1000 is the uid for user 'pi' that has sudo permission.

        var options = {
          cachePassword: true,
          prompt: 'Password, yo? ',
          spawnOptions: { }
        }

        //AP
        if(serverSettings.wifiType == "1") {
          console.log('Running makeAP2 script...');

          child = sudo([ './makeAP2' ], options);
          child.stdout.on('data', function (data) {
              console.log(data.toString());
          });
          child.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
          });

        //Client
        } else if(serverSettings.wifiType == "2") {
          console.log('Running restoreWifi...');

          child = sudo([ './restoreWifi2' ], options);
          child.stdout.on('data', function (data) {
              console.log(data.toString());
          });
          child.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
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
  this.write_wpa_supplicant = function() {
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
      
      //Testing Leaving out the Encryption type
      outStr += '\tkey_mgmt='+serverSettings.wifiClientSettings[i].key_mgmt+'\n';
      //outStr += '\tkey_mgmt='+""+'\n';
      
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

  //This function is called by wifiSettings(). It's purpose is to write out a new hostapd file.
  this.write_hostapd = function() {
    //debugger;

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
  };
  
  //restoreCheck() checks to see if the WiFi settings need to be restored to default settings.
  //This function is called from rpi-tracker.js during startup.
  this.restoreCheck = function() {
    //debugger;
    
    try {
/*      
      console.log('restoreCheck() executed. rebootCnt='+serverSettings.rebootCnt);
      
      //If the device has been rebooted 3 times without a user confirmation.
      if(serverSettings.rebootCnt > 2) {
        
        //Reset the counter.
        serverSettings.rebootCnt = 0;
        
        //Reset the RPi into AP mode with the default settings.
        globalThis.makeAP();
        
      } else {
        //Increment the reboot counter.
        serverSettings.rebootCnt++;

        //Write out the server_settings.json file.
        fs.writeFile('./assets/server_settings.json', JSON.stringify(serverSettings, null, 4), function (err) {
          if(err) {
            console.log('Error in restoreCheck() while trying to write server_settings.json file.');
            console.log(err);
          } else {
            //console.log('restoreCheck() updated server_settings.json.);
          }
        });
      }
*/
      
      console.log('restoreCheck() executed.');
      
      //Only need to continue if RPi-Tracker is setup for WiFi client mode
      if(serverSettings.wifiType == "2") {
        
        var iterCnt = 0;  //iteration counter.
        
        //Create a timer that executes 5 times in 60 seconds.
        var restoreCheckInterval = setInterval(function() {
          debugger;
          
          //Attempt to retrieve the IP addresses.
          global.diagnostics.getIp();  
          
          //Increment the iteration counter.
          iterCnt++;
          
          //Wait 6 seconds, then check to see if the IP addresses have been retrieved.
          setTimeout(function() {
            if((global.diagnostics.localIp != undefined) && (global.diagnostics.externalIp != undefined)) {
              //If IP addresses have been retrieved, send them to the server.
              global.diagnostics.sendIp();
            }
          }, 6000);
          
          //After 60 seconds...
          if(iterCnt > 5) {
            debugger;
            
            //If IP addresses have been retrieved:
            if((global.diagnostics.localIp != undefined) && (global.diagnostics.externalIp != undefined)) {
              
              //Clear the Reboot Confirmation flag.
              serverSettings.rebootConfirmationNeeded == "false";
              
              //Write the server settings to disk.
              global.saveServerSettings(serverSettings);
            
            //If IP addresses were not available:
            } else {
              
              console.log('Failed to connect to server, rebooting into Wifi AP Mode.');
              debugger;
              //Reset the RPi into AP mode with the default settings.
              global.wifiInterface.makeAP();
            }
            
            //Clear the counter and the timer interval.
            iterCnt = 0;
            clearInterval(restoreCheckInterval);
          }
          
        },12000);
        
      }
      
    } catch(err) {
      console.error('Error trying to access serverSettings.rebootCnt.');
      console.error('Error message: '+err.message);
    }
  };
  
  //makeAP() switches the RPi to a WiFi Access Point (AP) with default settings.
  //This function is called by restoreCheck().
  this.makeAP = function() {
    serverSettings.wifiAPSettings.ssid = "Pi_AP";
    serverSettings.wifiAPSettings.channel = 6;
    serverSettings.wifiAPSettings.psk = 'raspberry';
    serverSettings.rebootConfirmationNeeded = "false";
    serverSettings.rebootCnt = 0;
    serverSettings.wifiType = "1";
    
    //Write out the server_settings.json file.
    fs.writeFile('./assets/server_settings.json', JSON.stringify(serverSettings, null, 4), function (err) {
      if(err) {
        console.log('Error in makeAP() while trying to write server_settings.json file.');
        console.log(err);
      } else {
        console.log('makeAP() executed. server_settings.json updated.');
      }
    });

    //Write out new wpa_supplicant.conf file
    globalThis.write_wpa_supplicant();

    //Write out new hostapd.conf file
    globalThis.write_hostapd();
    
    var options = {
      cachePassword: true,
      prompt: 'Password, yo? ',
      spawnOptions: { }
    }

    console.log('Running makeAP2 script...');

    child = sudo([ './makeAP2' ], options);
    child.stdout.on('data', function (data) {
        console.log(data.toString());
    });
    child.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });


  };
  
  
  return(this);
  
}

exports.Constructor = Constructor;