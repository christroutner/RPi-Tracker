var isTracking = true;  //Tracks the state of the device. Tracking = true. Not tracking = false.
var serverSettings = new Object(); //Used to hold the data in server_settings.json.

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
    debugger;

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
    debugger;

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
    debugger;

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
      var tmpItem = $('#clientSSIDList').find('option').first().clone();
      
      //Fill out the value and text of the option element.
      tmpItem.val(serverSettings.wifiClientSettings[i].ssid);
      //tmpItem.text(serverSettings.wifiClientSettings[i].ssid);
      
      //Append the option to the datalist.
      $('#clientSSIDList').append(tmpItem);
      
      //$('#clientSSID').on('change', function(eventData) {
      $('#clientSSIDList').bind('select', function() {
        debugger;
      });
    }
    
    debugger;
  });

  
  //Create click handler for Wifi button. This is just used for testing right now.
  $('#wifiBtn').click(function() {
    //debugger;

    $.get('/wifiSettings', serverSettings, function(data) {
      //debugger;
      if(data == true) {
        console.log('server_settings.json updated with WiFi Settings.');
      } else {
        console.error('server_settings.json changes rejected by server!');
      }
      
    })
  });

  
  //debugger;
  //Assign the click event handler to the checkboxes
  $('#optionsCheckbox1').click(wifiCheckboxHandler);
  $('#optionsCheckbox2').click(wifiCheckboxHandler);

  // END WIFI CONTROL CODE




  // START SETTINGS TAB CONTROL

  // END SETTINGS TAB CONTROL
})


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
    if(serverSettings.wifiType == 1) {
      serverSettings.wifiType = 2;  //Assign wifiType to wifi client
    //Otherwise if wifiType is set to 2 (wifi client)  
    } else {
      serverSettings.wifiType = 1; //Assign wifiType to AP mode
    }
    
    //Pass server_settings to server to update file.
    
    //Throw up warning modal.
    
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
// END UTILITY FUNCTIONS