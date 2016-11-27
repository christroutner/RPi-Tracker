var isTracking = true;  //Tracks the state of the device. Tracking = true. Not tracking = false.
var serverSettings = new Object(); //Used to hold the data in server_settings.json.
var modalData = new Object(); //Used to store setting for configuring the modal.

var syncIntervalHandle; //Interveral Handle used for syncing client to server.

$(document).ready(function() {
  //debugger;

  // START TRACKER & LOG FILE CONTROL CODE

  //Retrieve the list of log files from the server and use the data to build out the drop-down list.
  $.get('/listLogFiles', '', function(data) {
    //debugger;

    var fileList = data;

    for( var i = 0; i < fileList.length; i++ ) {

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
  
    
    //debugger;
  });

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
    
    //Send the updated serverSettings to the server to update the server_settings.json file.
    $.get('/wifiSettings', serverSettings, function(data) {
      //debugger;
      if(data == true) {
        console.log('server_settings.json updated with WiFi Settings.');
      } else {
        console.error('server_settings.json changes rejected by server!');
      }      
    });
    
    //Throw up the modal if a reboot is required.
    if(serverSettings.rebootConfirmationNeeded == true) {
      console.log('About to reboot. serverSettings.rebootConfirmationNeeded = '+serverSettings.rebootConfirmationNeeded);
      
      alert('The Raspberry Pi in now rebooting and implementing the new settings. Please wait a few minutes, then navigate back to this page'
           +' and confirm these settings or the old settings will be restored.');
      
      //Throw up a spinny gif modal for 30 seconds
      waitingModal();
      
      //Access Point
      if(serverSettings.wifiType == "1") {
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
    }
  });

  
  //debugger;
  //Assign the click event handler to the checkboxes
  $('#optionsCheckbox1').click(wifiCheckboxHandler);
  $('#optionsCheckbox2').click(wifiCheckboxHandler);

  // END WIFI CONTROL CODE




  // START SETTINGS TAB CONTROL
  
  //Create click handler for 'Save Settings' button in the user settings tab.
  $('#saveSettings').click(function() {
    
    serverSettings.userId = $('#userId').val();
    
    //Send the updated serverSettings to the server to update the server_settings.json file.
    $.get('/saveSettings', serverSettings, function(data) {
      //debugger;
      if(data == true) {
        console.log('server_settings.json updated with WiFi Settings.');
      } else {
        console.error('server_settings.json changes rejected by server!');
      }      
    });
  });
  
  //Click function for the 'Sync Files' button.
  $('#syncFiles').click(function() {
    
    //Start the synchonization.
    $.get('/startSync', '', function(data) {
      debugger;
      
      //Throw up the waiting modal.
      modalData.title = 'Syncing With Map Tracks Server...';
      modalData.body = '<img class="img-responsive center-block" src="/img/waiting.gif" id="waitingGif" />';
      modalData.body += '<div id="syncLogOutput" style="height: 300px; overflow-y: scroll; background-color: #eee; border-style: solid; border-width: 1px;"></div>';
      modalData.btn1 = '';
      modalData.btn2 = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
      updateModal();
      openModal();
      
      syncIntervalHandle = setInterval(updateSyncLogOutput, 5000);
      
    });
  });
  
  function updateSyncLogOutput() {
    $.get('/syncLog', '', function(data) {
      
      //Clear the output div
      $('#syncLogOutput').find('p').remove();
      
      for(var i=0; i < data.length; i++) {
        $('#syncLogOutput').append('<p>'+data[i]+'</p>');
      }
      
      //Detect when the sync has completed.
      detectDone(data);
      
      //Automatically scroll to the bottom of the div.
      $("#syncLogOutput").scrollTop($("#syncLogOutput")[0].scrollHeight);
    });
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
        
        //Figure out if the sync has completed
        if(serverDate.getUTCDate() == clientDate.getUTCDate()) {
          if(serverDate.getUTCHours() == clientDate.getUTCHours()) {
            
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
          }
        }
        
      }
      
      
    }
  }
  
  // END SETTINGS TAB CONTROL
  
  
  // START DEBUG TAB CONTROL
  //$('#testLog').click(function() {
  var debugIntervalHandle = setInterval(function() {
     
    
    //debugger;
    
    $.get('/getLog', '', function(data) {
      //debugger;
      
      if(!data) {
        console.error('Server returned false when calling /getLog!');
        return;
      }
      
      $('#consoleLog').find('p').remove();
      
      var lines = data.split('\n');
      
      for(var i=lines.length-2; i > -1; i--) {
        $('#consoleLog').append('<p>'+(i+1)+'. '+lines[i]+'</p>');
      }
      
      
    });
  }, 10000);
  //});
  // END DEBUG TAB CONTROL

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
// END MODAL FUNCTIONS