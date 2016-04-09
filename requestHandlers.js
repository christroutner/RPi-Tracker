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

//GLOBAL VARIABLES
var CSVData = new Array(); //Object to hold CSV data
var UniqueIDList = new Array(); //List of UniqueIDs in the CSV file
var Location = new Object(); //Location object
var CustomEvent = new events(); //Custom event object
//var globalResponse = new Object(); //Used to pass response context between functions.

// CUSTOMIZATION VARIABLES
//var wwwDir = '/inetpub/wwwroot/'  //Windows 2008 Server
//var wwwDir = '/var/www/'          //Linux
var wwwDir = './'                   //KeystoneJS

/*
function start(response, postData) {
  console.log("Request handler 'start' was called.");

  //Load the HTML for this page.
  var body = serverhtml.create_add_location_page();
  
  response.writeHead(200, {"Content-Type": "text/html"});
  response.write(body);
  response.end();
}

function upload(response, postData) {
  console.log("Request handler 'upload' was called.");

  response.writeHead(200, {"Content-Type": "text/plain"});
  //console.log("Post data: " + postData);
  response.write("You've sent the text: <br></br>"); 
  // querystring.parse(postData).text);
  response.write("Title: " + querystring.parse(postData).title + "<br></br>");
  response.write("Latitude: " + querystring.parse(postData).latitude);

  response.end();
}
*/

/******************************************************************************
Summary:
add_new() handles the creation and modification of location XML and the CSV
file. 

Flow:
-If a blank value for UniqueID is passed in the postData, than an new
location is created and a new 8-digit random UniqueID is generated.
-If a UniqueID is passed in and it matches an existing UniqueID in the CSV
file...
--then the old XML file will be moved to the backup folder and the version
number is appended to the file name.
--A new XML file is created for that location and the version number is
incremented.
******************************************************************************/
function add_new(request, response, next) {
  console.log("Request handler 'add_new' was called.");

  //debugger;
  
  //Move data from the URL to the Location object.
  Location.uniqueid = request.query.uniqueid;
  Location.username = request.query.username;
  Location.title = request.query.title;
  Location.latitude = request.query.latitude;
  Location.longitude = request.query.longitude;
  Location.summary = request.query.summary;
  Location.description = request.query.description;

  // Read the data back out to the web page so the user can confirm they
  // Uploaded the data correctly.
  var successMsg = "<p>Success! <br>"+
      "You've sent the text: <br>"+
      "UniqueID: " + Location.uniqueid + "<br>" +
      "User Name: " + Location.username + "<br>"+
      "Title: " + Location.title + "<br>"+
      "Latitude: " + Location.latitude + "<br>"+
      "Longitude: " + Location.longitude + "<br>"+
      "Summary: " + Location.summary + "<br>"+
      "Description: " + Location.description + "</p>";
      
  //Allow CORS
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  response.send(successMsg);
  
  //Load the CSV file into memory.
  LoadCSV();
  
  //The rest of the response for this function is handled by the
  //CSVLoaded event after the CSV file has been loaded into memory. 
  //globalResponse = response;  //Pass response object to global.
}


function LoadCSV() {
  debugger;
  var i;
  UniqueIDList = new Array();

  console.log("Retrieving UniqueIDs from CSV file.");

  //Parse the CSV file into a nice CSV object.
  //The anonymous function is called once node finishes loading the the file
  //into memory.
  var parser = parse({delimiter: '`'}, function(err,data) {

    //I'm only interested in the first column (of UniqueIDs).
    //Load that first column into the UniqueIDList array.
    for(i = 0; i < data.length; i++) {
      UniqueIDList[i] = data[i][0];
    }
      
    //Copy the local variable of CSV data into the CSVData global variable.
    CSVData = data;

    //Call the 'CSV Loaded' event to signal that the CSV file has been loaded
    //into memory.
    CustomEvent.emit('CSVLoaded', '');
  });

  //Execute the loading of the file.
  fs.createReadStream('./assets/MarkerData.csv').pipe(parser);
}

//Called when the CSV file has been loaded into memory and
//is ready for processing. This event is ultimately triggered
//by the add_new() function.
CustomEvent.on('CSVLoaded', function(localinput) {
  //XML variables
  var XML = et.XML;
  var ElementTree = et.ElementTree;
  var element = et.Element;
  var subElement = et.SubElement;
  
  //Local variables
  var date, root, root1, etree, xml;
  var xmlUniqueID, xmlTitle, xmlUserName, xmlCurrentVersion, xmlDateUpdate, 
   xmlLatitude, xmlLongitude, xmlSummary, xmlApproach, xmlDescription, 
   xmlNOAAImage, xmlImage1;
  
  debugger;
  console.log("CSV Loaded. Processing...");
 
  // DECISION LOGIC BASED ON UNQIUEID
  //If UniqueID is blank, then generate a new UniqueID
  if(Location.uniqueid === "") {
    
    //Create a random number of 8 characters.
    var tempuniqueid = rander.number(8); 
    
    //If the generated UniqueID for uniqueness,
    //then assign it to the location.
    if( DoesUniqueIDExist(tempuniqueid) == -1 ) {
      Location.uniqueid = tempuniqueid;  
      
      console.log("UniqueID " + Location.uniqueid + " assigned to new location...");
    }
    
    // Write the data to an XML file
    Location.date = new Date();

    root1 = element('LocationXML');

    root = subElement(root1, 'LocationEntity');

    xmlUniqueID = subElement(root, 'UniqueID');
    xmlUniqueID.text = Location.uniqueid;

    xmlTitle = subElement(root, 'Title');
    xmlTitle.text = Location.title;

    xmlUserName = subElement(root, 'UserName');
    xmlUserName.text = 'HardCodedUser';

    xmlCurrentVersion = subElement(root, 'CurrentVersion');
    xmlCurrentVersion.text = '0';

    xmlDateUpdated = subElement(root, 'DateUpdated');
    xmlDateUpdated.text = Location.date;

    xmlLatitude = subElement(root, 'Latitude');
    xmlLatitude.text = Location.latitude;

    xmlLongitude = subElement(root, 'Longitude');
    xmlLongitude.text = Location.longitude;

    xmlSummary = subElement(root, 'Summary');
    xmlSummary.text = Location.summary; 

    xmlDescription = subElement(root, 'Description');
    xmlDescription.text = Location.description;
    
    //Add the data to a new line of the CSV file
    CSVData[CSVData.length] = [Location.uniqueid, Location.title, Location.latitude, Location.longitude];
    
    //Write out the new CSV file
    WriteCSV();
  }
  
  
  else {
    //Copy the CSV index of the UniqueID we are dealing with.
    var CSVIndex = DoesUniqueIDExist(Location.uniqueid);
    
    //If the UniqueID exists in the CSV file, then
    //update the XML file
    if(CSVIndex > -1) {

      //Over-write the CSV elements for this location
      CSVData[CSVIndex] = [Location.uniqueid, Location.title, Location.latitude, Location.longitude];
      
      //Write out the CSV file.
      WriteCSV();
      
      //Read in old XML file to get version number
      ReadXML(Location.uniqueid);      
      var newversion = Number(Location.xml.currentversion) + 1;
      
      //Copy the old XML file to the backup directory
      //Note: I need to read in the version number from the XML or CSV file
      fs.rename(wwwDir+'assets/locations/'+Location.uniqueid+'.xml', wwwDir+'assets/locations/backup/'
       +Location.uniqueid+'_'+newversion.toString()+'.xml');
      console.log(Location.uniqueid+'.xml moved to backup directory.');
      
      //Write a new XML file
      Location.date = new Date();

      root1 = element('LocationXML');

      root = subElement(root1, 'LocationEntity');

      xmlUniqueID = subElement(root, 'UniqueID');
      xmlUniqueID.text = Location.uniqueid;

      xmlTitle = subElement(root, 'Title');
      xmlTitle.text = Location.title;

      xmlUserName = subElement(root, 'UserName');
      xmlUserName.text = 'HardCodedUser';

      xmlCurrentVersion = subElement(root, 'CurrentVersion');
      xmlCurrentVersion.text = newversion.toString();

      xmlDateUpdated = subElement(root, 'DateUpdated');
      xmlDateUpdated.text = Location.date;

      xmlLatitude = subElement(root, 'Latitude');
      xmlLatitude.text = Location.latitude;

      xmlLongitude = subElement(root, 'Longitude');
      xmlLongitude.text = Location.longitude;

      xmlSummary = subElement(root, 'Summary');
      xmlSummary.text = Location.summary;

      xmlDescription = subElement(root, 'Description');
      xmlDescription.text = Location.description;
      
    }
    //Any other condition, quit.
    else {
      console.log('UniqueID '+Location.uniqueid+' does not exist in CSV file.');
      //globalResponse.end();
    }
  }
  
  //Write out the xml file
  etree = new ElementTree(root1);
  xml = etree.write({'xml_declaration': true});

  fs.writeFile(wwwDir+"assets/locations/" + Location.uniqueid + ".xml", xml, function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("XML file " + Location.uniqueid + ".xml created.");
    }
  });
  
  //Close the response.
  //globalResponse.end();
});

//Returns true if the UniqueID exists in the UniqueIDList object.
//Returns false otherwise.
function DoesUniqueIDExist(strUniqueID) {
  debugger;
  var i;
  var val = -1;
  try {
      for(i = 0; i < UniqueIDList.length; i++) {
      if(strUniqueID.toString() === UniqueIDList[i].toString()) {
        val = i;
      }        
	  }
  }
  catch(e) {
    console.log('Error caught in DoesUniqueIDExist(). strUniqueID = ' + strUniqueID.toString());
    return false;
  }
  
  return val;
}


//This function reads in an XML document and appends the data to the 
//global Location object.
function ReadXML(local_uniqueid) {

  var XML = et.XML;
  var ElementTree = et.ElementTree;
  var element = et.Element;
  var subElement = et.SubElement;

  var data, etree;

  data = fs.readFileSync(wwwDir+'assets/locations/'+local_uniqueid+'.xml').toString();
  etree = et.parse(data);

  Location.xml = new Object();
  
  //Write out the pertinent data to the console
  Location.xml.uniqueid = etree.findtext('LocationEntity/UniqueID');
  Location.xml.title = etree.findtext('LocationEntity/Title');
  Location.xml.username = etree.findtext('LocationEntity/UserName');
  Location.xml.currentversion = etree.findtext('LocationEntity/CurrentVersion');
  Location.xml.dateupdated = etree.findtext('LocationEntity/DateUpdated');
  Location.xml.latitude = etree.findtext('LocationEntity/Latitude');
  Location.xml.longitude = etree.findtext('LocationEntity/Longitude');
  Location.xml.summary = etree.findtext('LocationEntity/Summary');
  Location.xml.description = etree.findtext('LocationEntity/Description');

  console.log('Read in XML file: ' + local_uniqueid + '.xml');
}

//Write data in the CSVData global variable to a CSV file.
function WriteCSV() {

  //Write out the new CSV file
  var CSVOutputFile = fs.createWriteStream(wwwDir+'assets/MarkerData.csv');
  
  //Write out the CSV data
  for(var i = 0; i < CSVData.length; i++) {
    CSVOutputFile.write(CSVData[i][0]+'`'+CSVData[i][1]+'`'+CSVData[i][2]+'`'+CSVData[i][3]+'\n');
  }
  CSVOutputFile.end(); //Close the file.
  console.log("CSV file updated.");
}

/*
This function is used to validate empty strings before writing them to XML.
If a string is blank, then a space is added. Reading XML errors on empty
strings, so it's better to save it as a blank space.
*/
function ValidateString(str) {

if(str == "")
  str = " ";
return str;

}

//exports.start = start;
//exports.upload = upload;
exports.add_new = add_new;
