var isTracking = true;  //Tracks the state of the device. Tracking = true. Not tracking = false.
var serverSettings = new Object(); //Used to hold the data in server_settings.json.
var modalData = new Object(); //Used to store setting for configuring the modal.

var syncIntervalHandle; //Interveral Handle used for syncing client to server.
var syncState = 0; //0 = not syncing, 1 = syncing in progress, 2 = syncing complete.

var debugIntervalHandle //Interval Handle used for getting debug log from client.

$(document).ready(function() {
  //debugger;

  // START TRACKER & LOG FILE CONTROL CODE

  //Retrieve the list of log files from the server and use the data to build out the drop-down list.
  $.get('/listLogFiles', '', function(data) {
    //debugger;

    var fileList = data;

    //for( var i = 0; i < fileList.length; i++ ) {
    for( var i = fileList.length-1; i > -1; i-- ) {

      //Clone the example option provided in the template.
      var tempOption = $('#logFile').find('option').first().clone();

      //Populate the select element with data from the model.
      var fileDate = data[i].slice(18,28);
      tempOption.text(fileDate);
      tempOption.val(fileDate);

      //Remove the 'hidden' attribute copied from the example row.
      tempOption.show();

      //Append the new row to the DOM.
      $('#logFile').append(tempOption);
    }

  });

  //Query the state of the tracking device
  $.get('/queryTracking', '', function(data) {
    //debugger;

    //Have the Start/Stop button reflect the current state of the tracking device.
    if(!data) {
      $('#trackingControlBtn').removeClass('btn-warning');
      $('#trackingControlBtn').addClass('btn-success');
      $('#trackingControlBtn').text('Start Tracking');
      isTracking = false;
    } else {
      //The control button displays 'Stop Tracking' by default on load.
      isTracking = true;
    }
  });

  //Create click handler for Stop/Start Tracking button.
  $('#trackingControlBtn').click(function() {
    //debugger;

    var data = new Object();

    //Toggle the state of the tracking device.
    if(isTracking) {
      data.changeState = false;
      $.get('/queryTracking', data, function(data) {
        //debugger;
        if(data == "false") {
          $('#trackingControlBtn').removeClass('btn-warning');
          $('#trackingControlBtn').addClass('btn-success');
          $('#trackingControlBtn').text('Start Tracking');
          isTracking = false;
        } else {
          console.log('Problem with tracking control. (1)')
        }
      });
    } else {
      data.changeState = true;
      $.get('/queryTracking', data, function(data) {
        //debugger;
        if( data == "true" ) {
          $('#trackingControlBtn').removeClass('btn-success');
          $('#trackingControlBtn').addClass('btn-warning');
          $('#trackingControlBtn').text('Stop Tracking');
          isTracking = true;
        } else {
          console.log('Problem with tracking control. (2)')
        }
      });
    }



  });

  //Create click handler for Download button
  $('#downloadLogBtn').click(function() {
    //debugger;

    //Exit if button was clicked accidentally without first selecting a log file.
    if( $('#logFile').val() == "" ) {
      alert('Please select a log file first.');
      return;
    }

    var logFile = $('#logFile').val();
    var extention = "";

    var format = $('#fileFormat').val();
    switch(format) {
      case "KLS":
        extension = "-LS.kml";
        break;
      case "GLS":
        extension = "-LS.json";
        break;
      case "KPT":
        extension = "-PT.kml";
        break;
      case "GPT":
        extension = "-PT.json";
        break;
    }

    //Generate the download URL.
    var downloadURL = "/logfiles/"+logFile+extension;

    //Initialize the download
    var link = document.createElement('a');
    link.download = logFile+extension;
    link.href = downloadURL;
    link.click();
  });

  //Create click handler for Delete button
  $('#deleteLogBtn').click(function() {
    //debugger;

    //Exit if button was clicked accidentally without first selecting a log file.
    if( $('#logFile').val() == "" ) {
      alert('Please select a log file first.');
      return;
    }

    var logFile = $('#logFile').val();

    //Need to create a server call to delete a given logFile name.
  });

  // END TRACKER & LOG FILE CONTROL CODE




  // START WIFI CONTROL CODE

  //Initialize the WiFi settings tab based on the server_settings.json data.
  function getServerSettings() {
    $.getJSON('/server_settings.json', '', function(data) {
      //debugger;

      //Copy the JSON data to a global variable.
      serverSettings = data;

      //Set the checkboxes.
      //1 == Access Point
      if(data.wifiType == 1) {
        $('#optionsCheckbox1').prop("checked", true);
      //2 == WiFi Client
      } else if(data.wifiType == 2) {
        $('#optionsCheckbox2').prop("checked", true);
      }

      //Set the AP settings
      if(serverSettings.wifiAPSettings.ssid != "") {
        $('#apSSID').val(serverSettings.wifiAPSettings.ssid);
      }
      if(serverSettings.wifiAPSettings.psk != "") {
        $('#apPSK').val(serverSettings.wifiAPSettings.psk);
      }


      //Set the WiFi Client settings
      for( var i=0; i < serverSettings.wifiClientSettings.length; i++) {

        //Clone the blank datalist.option element.
        var tmpItem = $('#savedClients').find('option').first().clone();

        //Fill out the value and text of the option element.
        tmpItem.val(i);
        tmpItem.text(serverSettings.wifiClientSettings[i].ssid);

        //Append the option to the datalist.
        $('#savedClients').append(tmpItem);

      }

      //Fill in the WiFi Client settings when a saved AP is selected.
      $('#savedClients').on('change', function(eventData) {
        //debugger;

        //If the blank entry is selected, then return. Clear the form.
        if($('#savedClients').find(':selected').val() == "") {
          $('#clientSSID').val('');
          $('#clientPSK').val('');
          $('#clientEncryption').val('WPA-PSK');
          return;
        }

        //Get the value of the selected item.
        var selectedIndex = $('#savedClients').find(':selected').val();

        //Fill out the client form.
        $('#clientSSID').val(serverSettings.wifiClientSettings[selectedIndex].ssid);
        $('#clientPSK').val(serverSettings.wifiClientSettings[selectedIndex].psk);
        $('#clientEncryption').val(serverSettings.wifiClientSettings[selectedIndex].key_mgmt);
      });


      //Throw up a yes/no dialog if the reboot flag is set.
      if(serverSettings.rebootConfirmationNeeded == "true") {

        //Confirm if they want to continue using the new settings.
        var r = confirm("Press 'OK' to save the new WiFi settings.");
        if(r == true) {
          serverSettings.rebootConfirmationNeeded = "false";
          serverSettings.rebootCnt = 0;

          //persist the server settings to the sever.
          $('#wifiBtn').trigger('click');

        } else {
          debugger;

          //restore the saved settings and reboot.
          restoreDefaultWiFi();

        }

      }

      //Initialize the form on the Settings tab by filling it out with values from serverSettings.
      $('#userId').val(serverSettings.userId);
      $('#gpsDataLogTimeout').val(serverSettings.gpsDataLogTimeout);
      $('#gpsFileSaveTimeoutCnt').val(serverSettings.gpsFileSaveTimeoutCnt);
      
      
      if(serverSettings.syncOnBoot == "true") {
        //Check the checkbox in the UI
        $('#autosync').prop('checked', true);
      }

      //debugger;
    });
  };
  getServerSettings();
  
  //This function resets the RPi back to factory default settings of a WiFi AP.
  function restoreDefaultWiFi() {
    
    //Update the wifiAPSettings in the serverSettings.
    serverSettings.wifiType = "1";
    serverSettings.wifiAPSettings.ssid = "Pi_AP";
    serverSettings.wifiAPSettings.psk = "raspberry";
    serverSettings.wifiAPSettings.channel = 6;
    serverSettings.rebootConfirmationNeeded = "true"; //Needs to be true to reset RPi WiFi
    serverSettings.rebootCnt = 0;

    //Send the updated serverSettings to the server to update the server_settings.json file.
    $.get('/wifiSettings', serverSettings, function(data) {
      //debugger;
      if(data == true) {
        console.log('server_settings.json updated with WiFi Settings.');
      } else {
        console.error('server_settings.json changes rejected by server!');
      }      
    });
    
    alert('The Raspberry Pi is now rebooting and restoring factory settings. Please wait approximately 30 seconds and then you should be able '+
         'to connect to WiFi access point "Pi_AP" with password "raspberry".');

    //Throw up a spinny gif modal for 30 seconds
    waitingModal();

    //Create a timer to update the modal after some time has passed.
    var intervalHandle = setInterval(function() {
      modalData.title = "Done!";
      modalData.body = "<h2>Done!</h2><p>The device should have made changes to the WiFi. You can now connect directly to the RPi " +
        "with Wifi access point named <b>Pi_AP</b> and password <b>raspberry</b>. After connecting to the WiFi access point, access this user " +
        "interface at this url: <b>192.168.42.1</b></p>";
      updateModal();
    }, 30000);

  }
  
  //Create click handler for 'Save Settings' Wifi button. 
  $('#wifiBtn').click(function() {
    //debugger;

    //Update the wifiAPSettings in the serverSettings.
    serverSettings.wifiAPSettings.ssid = $('#apSSID').val();
    serverSettings.wifiAPSettings.psk = $('#apPSK').val();
    serverSettings.wifiAPSettings.channel = Number($('#apChannel').val());
    
    //Add or update the wifiClientSettings
    updateClientSettings();
    
    //Throw up the waiting modal.
    modalData.title = 'Saving WiFi Settings...';
    modalData.body = '<img class="img-responsive center-block" src="/img/waiting.gif" id="waitingGif" />';
    modalData.btn1 = '';
    modalData.btn2 = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
    updateModal();
    openModal();
    
    //Send the updated serverSettings to the server to update the server_settings.json file.
    $.get('/wifiSettings', serverSettings, function(data) {
      //debugger;
      if(data == true) {
        console.log('server_settings.json updated with WiFi Settings.');
        
        //Throw up the modal if a reboot is required.
        if(serverSettings.rebootConfirmationNeeded == true) {
          console.log('About to reboot. serverSettings.rebootConfirmationNeeded = '+serverSettings.rebootConfirmationNeeded);

          alert('The Raspberry Pi in now rebooting and implementing the new settings. Please wait a few minutes, then navigate back to this page'
               +' and confirm these settings or the old settings will be restored.');

          //Throw up a spinny gif modal for 30 seconds
          waitingModal();

          //Access Point
          if(serverSettings.wifiType == "1") {

            //Stop the timer-interval that tries to retrieve the debug log.
            clearInterval(debugIntervalHandle);

            //Create a timer to update the modal after some time has passed.
            var intervalHandle = setInterval(function() {
              modalData.title = "Done!";
              modalData.body = "<h2>Done!</h2><p>The device should have made changes to the WiFi. You can now connect directly to the RPi " +
                "with Wifi name <b>Pi_AP</b> and password <b>raspberry</b>. After connecting to the WiFi access point, access this user " +
                "interface at this url: <b>192.168.42.1</b></p>";
              updateModal();
            }, 30000);
          } else {
            //Create a timer to update the modal after some time has passed.
            var intervalHandle = setInterval(function() {
              modalData.title = "Done!";
              modalData.body = "<h2>Done!</h2><p>The device should have made changes to the WiFi. You can now connect to the RPi " +
                "on the selected WiFi hotspot. You will need to retreive the RPi's IP address from the wireless router.";
              updateModal();
            }, 60000);
          }
          
        //Wifi settings updated, but reboot not needed.
        } else {
          //Hide the spinny waiting gif.
          $('#waitingGif').hide();
          //Replace the image with a complete message.
          $('#waitingGif').parent().prepend('<h2><center><b>Settings saved!</b></center></h2><br>');
          
          //Update the page with any updated server settings.
          getServerSettings();
        }
        
      } else {
        console.error('server_settings.json changes rejected by server!');
      }   
      
    })
    .fail(function( jqxhr, textStatus, error ) {
      debugger;

      //This state indicates that the RPi has been disconnected.
      if((textStatus == "error") && (error == "")) {
        var msg = "Could not save settings because the browser could not communicate with the Raspberry Pi.";
        
      //All other reasons for the failure:
      } else {
        var msg = "Could not save settings because your browser could not communicate with the Raspberry Pi.\n"+
          "Request failed because of: "+error+'. Error Message: '+jqxhr.responseText;
      }
      
      //Hide the spinny waiting gif.
      $('#waitingGif').hide();
      //Replace the image with a complete message.
      $('#waitingGif').parent().prepend('<h2><center><b>Could not save settings!</b></center></h2><br><p>'+msg+'</p>');

    });
    
    
  });

  
  //debugger;
  //Assign the click event handler to the checkboxes
  $('#optionsCheckbox1').click(wifiCheckboxHandler);
  $('#optionsCheckbox2').click(wifiCheckboxHandler);

  // END WIFI CONTROL CODE




  // START SETTINGS TAB CONTROL
  
  //Create click handler for 'Save Settings' button in the user settings tab.
  $('#saveSettings').click(function() {
    
    var rebootFlag = false;
    if(serverSettings.userId != $('#userId').val())
      rebootFlag = true;
    
    serverSettings.userId = $('#userId').val();
    serverSettings.gpsDataLogTimeout = $('#gpsDataLogTimeout').val();
    serverSettings.gpsFileSaveTimeoutCnt = $('#gpsFileSaveTimeoutCnt').val();
    
    //Throw up the waiting modal.
    modalData.title = 'Saving Device Settings...';
    modalData.body = '<img class="img-responsive center-block" src="/img/waiting.gif" id="waitingGif" />';
    modalData.btn1 = '';
    modalData.btn2 = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
    updateModal();
    openModal();
    
    //Send the updated serverSettings to the server to update the server_settings.json file.
    $.get('/saveSettings', serverSettings, function(data) {
      //debugger;
      if(data == true) {
        console.log('server_settings.json updated.');
        
        
        
        //Reboot the device if needed
        if(rebootFlag) {
          //Hide the spinny waiting gif.
          $('#waitingGif').hide();
          //Replace the image with a complete message.
          $('#waitingGif').parent().prepend('<h2><center><b>Settings saved successfully. The device is now rebooting!</b></center></h2>');
          
          //Reboot the device.
          $.get('/rebootRPi', '', function(data) {});
          
        } else {
          //Hide the spinny waiting gif.
          $('#waitingGif').hide();
          //Replace the image with a complete message.
          $('#waitingGif').parent().prepend('<h2><center><b>Settings saved successfully!</b></center></h2>');

          getServerSettings();
        }
        
      } else {
        console.error('server_settings.json changes rejected by server!');
      }      
    })
    .fail(function( jqxhr, textStatus, error ) {
      debugger;

      //This state indicates that the RPi has been disconnected.
      if((textStatus == "error") && (error == "")) {
        var msg = "Could not save settings because the browser could not communicate with the Raspberry Pi.";
        
      //All other reasons for the failure:
      } else {
        var msg = "Could not save settings because your browser could not communicate with the Raspberry Pi.\n"+
          "Request failed because of: "+error+'. Error Message: '+jqxhr.responseText;
      }
      
      //Hide the spinny waiting gif.
      $('#waitingGif').hide();
      //Replace the image with a complete message.
      $('#waitingGif').parent().prepend('<h2><center><b>Could not save settings!</b></center></h2><br><p>'+msg+'</p>');

    });
  });
  
  //Click function for the 'Sync Files' button.
  $('#syncFiles').click(function() {
    
    if(syncState != 1) {
      syncState = 1;
      
      //Throw up the waiting modal.
      modalData.title = 'Syncing With Map Tracks Server...';
      modalData.body = '<img class="img-responsive center-block" src="/img/waiting.gif" id="waitingGif" />';
      modalData.body += '<div id="syncLogOutput" style="height: 300px; overflow-y: scroll; background-color: #eee; border-style: solid; border-width: 1px;"></div>';
      modalData.btn1 = '';
      modalData.btn2 = '<button type="button" class="btn btn-default" data-dismiss="modal" onclick="stopSync()">Close</button>';
      updateModal();
      openModal();
      
      //Start the synchonization.
      $.get('/startSync', '', function(data) {
        //debugger;

        updateSyncLogOutput();
        syncIntervalHandle = setInterval(updateSyncLogOutput, 5000);

      })
      .fail(function( jqxhr, textStatus, error ) {
        debugger;

        syncState = 0;
        
        //This state indicates that the RPi has been disconnected.
        if((textStatus == "error") && (error == "")) {
          var msg = "Could not save settings because the browser could not communicate with the Raspberry Pi.";

        //All other reasons for the failure:
        } else {
          var msg = "Could not save settings because your browser could not communicate with the Raspberry Pi.\n"+
            "Request failed because of: "+error+'. Error Message: '+jqxhr.responseText;
        }

        //Hide the spinny waiting gif.
        $('#waitingGif').hide();
        //Replace the image with a complete message.
        $('#waitingGif').parent().prepend('<h2><center><b>Could not sync with server!</b></center></h2><br><p>'+msg+'</p>');

      });
    }
    
  });
  
  function updateSyncLogOutput() {
    
    if(syncState == 1) {
      $.get('/syncLog', '', function(data) {

        //Clear the output div
        $('#syncLogOutput').find('p').remove();

        for(var i=0; i < data.length; i++) {
          $('#syncLogOutput').append('<p>'+i+'. '+data[i]+'</p>');
        }

        //Detect when the sync has completed.
        detectDone(data);

        //Automatically scroll to the bottom of the div.
        $("#syncLogOutput").scrollTop($("#syncLogOutput")[0].scrollHeight);
      });
    }
  };
  
  //This function detects when the file sync is complete. It does this by monitoring the /syncLog output.
  //This function is called by updateSyncLogOutput().
  function detectDone(logArray) {
    //debugger;
    
    //Server's last log file: Wed Nov 16 2016 18:00:40 GMT+0000 (UTC)
    //Client's time: Sat Nov 26 2016 22:52:01 GMT+0000 (UTC)
    
    var serverString = "Server's last log file: ";
    var clientString = "Client's time: ";
    
    var serverStringIndex = [];
    var clientStringIndex = [];
    
    //Detect any occurance of the targeted server or client strings
    for(var i=0; i < logArray.length; i++) {
      if(logArray[i].indexOf(serverString) != -1)
        serverStringIndex.push(i);
      
      if(logArray[i].indexOf(clientString) != -1)
        clientStringIndex.push(i);
    }
    
    if(serverStringIndex.length > 0) {
      //debugger;
      
      //Get the last occurance of the server string.
      var tempStr = logArray[serverStringIndex[serverStringIndex.length-1]];
      
      //Calculate the timestamp for the server.
      var dateStr = tempStr.slice(24);
      var serverDate = new Date(dateStr);
      
      //Do the same for the client string
      if(clientStringIndex.length > 0) {
        var tempStr = logArray[clientStringIndex[clientStringIndex.length-1]];
        var dateStr = tempStr.slice(15);
        var clientDate = new Date(dateStr);
        
        var min10 = 1000*60*10; //mS in 10 minutes.
        
        //Figure out if the sync has completed
        if(serverDate.getTime() >= clientDate.getTime()-min10) {
        //if(serverDate.getUTCDate() >= clientDate.getUTCDate()) {
          //if(serverDate.getUTCHours() >= clientDate.getUTCHours()) {
            
            syncState = 3;
            
            //Stop the synchronization
            $.get('/stopSync', '', function(data) {
              
              if(data) {
                //Hide the spinny waiting gif.
                $('#waitingGif').hide();

                //Replace the image with a complete message.
                $('#waitingGif').parent().prepend('<h2><center><b>Sync Complete!</b></center></h2>');
                
                //Stop the sync timer-interval.
                clearInterval(syncIntervalHandle);
              } else {
                console.error('Error while trying to stop server sync!');
              }
            });
          //}
        }
        
      }
      
      
    }
  };
  
  //This function is called when the user clicks the 'Update RPi-Tracker Software' button.
  //It makes an API call that initializes a 'git pull' from the RPi-Tracker GitHub repo and then a reboot.
  $('#updateSoftwareBtn').click(function(event) {
    //debugger;
    
    //Throw up the waiting modal.
    modalData.title = 'Updating Firmware...';
    modalData.body = '<img class="img-responsive center-block" src="/img/waiting.gif" id="waitingGif" />';
    modalData.btn1 = '';
    modalData.btn2 = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
    updateModal();
    openModal();
    
    $.get('/updateSoftware', '', function(data) {
      //debugger;
      
      //API returned 'true' to indicate success.
      if(data) {
        var msg = '<h2><center><b>Firmware update successfully!</b></center></h2>'+
            '<p>This device has downloaded the latest updates from GitHub. It is now rebooting and any new software updates should take affect.</p>'
        //Hide the spinny waiting gif.
        $('#waitingGif').hide();
        //Replace the image with a complete message.
        $('#waitingGif').parent().prepend(msg);
      
      //API returned 'false' to indicate an issue with 'git pull'
      } else {
        var msg = "Could not update firmware because there was an issue pulling the latest code off the GitHub repository";
        //Hide the spinny waiting gif.
        $('#waitingGif').hide();
        //Replace the image with a complete message.
        $('#waitingGif').parent().prepend('<h2><center><b>Could not update firmware!</b></center></h2><br><p>'+msg+'</p>');
      }
    })
    .fail(function( jqxhr, textStatus, error ) {
      debugger;

      //This state indicates that the RPi has been disconnected.
      if((textStatus == "error") && (error == "")) {
        var msg = "Could not update firmware because the browser could not communicate with the Raspberry Pi.";
        
      //All other reasons for the failure:
      } else {
        var msg = "Could not update firmware because of an unknown error.";
      }
      
      //Hide the spinny waiting gif.
      $('#waitingGif').hide();
      //Replace the image with a complete message.
      $('#waitingGif').parent().prepend('<h2><center><b>Could not update firmware!</b></center></h2><br><p>'+msg+'</p>');

    });
  });
  
  $('#rebootBtn').click(function(event) {
    //debugger;
    
    $.get('/rebootRPi', '', function(data) {
      //debugger;
      
    });
    
    alert('Device is being rebooted. Wait approximately 15-20 seconds before refreshing the browser.');
  });
  
  //Click handler for the 'sync on boot' checkbox.
  $('#autosync').click(function(event) {
    //debugger;
    
    if($('#autosync').prop('checked'))
      serverSettings.syncOnBoot = "true";
    else
      serverSettings.syncOnBoot = "false";  
  });
  // END SETTINGS TAB CONTROL
  
  
  // START DEBUG TAB CONTROL
  //$('#testLog').click(function() {
  
  
  function getDebugLog() {
    $.get('/getLog', '', function(data) {
      //debugger;
      
      if(!data) {
        console.error('Server returned false when calling /getLog! Is PM2 running?');
        return;
      }
      
      $('#consoleLog').find('p').remove();
      
      var lines = data.split('\n');
      
      for(var i=lines.length-2; i > -1; i--) {
        $('#consoleLog').append('<p>'+(i+1)+'. '+lines[i]+'</p>');
      }
      
    });
  };
  getDebugLog();
  debugIntervalHandle = setInterval(getDebugLog, 10000);
  //});
  // END DEBUG TAB CONTROL

  //Hide the preloader after everything finished loading and document is ready.
  $('#loader-wrapper').hide();
  
});

// START UTILITY FUNCTIONS
function wifiCheckboxHandler(eventHandler) {
  //debugger;
  
  //'this' referres to the HTML element that created the event. Reference it with a local jQuery object.
  $this = $(this);
  
  //Find the other checkbox that did not initiate the event.
  var otherCheckbox =':checkbox:not('+"#"+this.id+')'; //jQuery selector
  otherCheckbox = $(otherCheckbox); //jQuery object
  
  //If both check boxes are true...
  if( (otherCheckbox.prop('checked') == true) && ($this.prop('checked') == true) ) {
    //debugger;
    
    //uncheck the other checkbox
    otherCheckbox.prop('checked', false);
    
    //If wifiType is currently set to AP...
    if(serverSettings.wifiType == "1") {
      serverSettings.wifiType = "2";  //Assign wifiType to wifi client
    //Otherwise if wifiType is set to 2 (wifi client)  
    } else {
      serverSettings.wifiType = "1"; //Assign wifiType to AP mode
    }
    
    //Set the reboot flag
    serverSettings.rebootConfirmationNeeded = true;
    //The warning to the user will be generated when they click on the 'Save' button.
    
  //If this was an accidental uncheck...
  } else {
    //debugger;
    //Force UI when in AP mode.
    if(serverSettings.wifiType == 1) {
      
      $('#optionsCheckbox1').prop('checked', true);
      $('#optionsCheckbox2').prop('checked', false);
      
    //Force UI in wireless client moe.
    } else {
      $('#optionsCheckbox1').prop('checked', false);
      $('#optionsCheckbox2').prop('checked', true);
    }
  }
}

//This function is called by the #wifiBtn click handler. It's purpose is to update the server settings appropriately from the information on the WiFi tab.
function updateClientSettings() {
  //debugger;
  
  var checkFlag = false;
  
  var clientSSID = $('#clientSSID').val();
  
  //Exit if the SSID text box is blank.
  if(clientSSID == "")
    return;
  
  //Loop through all the entries in wifiClientSettings
  for(var i=0; i < serverSettings.wifiClientSettings.length; i++) {
    
    //If the value in the clientSSID text box matches a saved entry, update the entry.
    if(clientSSID == serverSettings.wifiClientSettings[i].ssid) {
      serverSettings.wifiClientSettings[i].psk = $('#clientPSK').val();
      serverSettings.wifiClientSettings[i].key_mgmt = $('#clientEncryption').val();
      serverSettings.wifiClientSettings[i].connectionVerified = "false";
      
      checkFlag = true; //Set the flag so I can skip the statement below.
      
      break;
    }
  }
  
  //If the value of the clientSSID text box did not match a saved entry, create a new entry.
  //if( (i==serverSettings.wifiClientSettings.length-1) && (clientSSID != serverSettings.wifiClientSettings[i].ssid) ) {
  if(!checkFlag) {
    var newEntry = {
      "ssid": $('#clientSSID').val(),
      "psk": $('#clientPSK').val(),
      "key_mgmt": $('#clientEncryption').val(),
      "connectionVerified": "false"
    };
    
    serverSettings.wifiClientSettings.push(newEntry);
  }
}
// END UTILITY FUNCTIONS


// START MODAL FUNCTIONS
//Modal control functions
function waitingModal() {
  
  var mainModal = $('#mainModal');
  
  //debugger;
  modalData.title = 'Rebooting...';
  modalData.body = '<img class="img-responsive center-block" src="/img/waiting.gif" id="waitingGif" />';
  modalData.btn1 = '';
  modalData.btn2 = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';

  updateModal();
  openModal();
}
  
function openModal() {
  $('#mainModal').modal('show');
}

function closeModal() {
  $('#mainModal').modal('hide');
}
  
//This function updates the modal title, body, and footer based on the title, body, and button data in modalData.
function updateModal() {
  
  var mainModal = $('#mainModal');
  
  mainModal.find('#mainModalTitle').text(modalData.title);
  mainModal.find('#mainModalBody').html(modalData.body);
  mainModal.find('#mainModalFooter').html(modalData.btn1+modalData.btn2);
}

function stopSync() {
  //debugger;

  //Stop the synchronization
  $.get('/stopSync', '', function(data) {

    if(data) {
      syncState = 0;
      
      //Stop the sync timer-interval.
      clearInterval(syncIntervalHandle);
    } else {
      console.error('Error while trying to stop server sync!');
    }
  });
};
// END MODAL FUNCTIONS