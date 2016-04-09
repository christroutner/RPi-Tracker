
//This function creates the HTML for the add-location page.
function create_add_location_page() {

  var body = 
   '<html>'+
    '<head>'+ 
	 '<meta http-equiv="Content-Type" content="text/html; '+ 
     'charset=UTF-8" />'+ 
	'</head>'+ 
	'<body>'+ 
	 '<form action="/add_new" method="post">'+
	  '<p>Enter a title for the map marker: <br>'+
	  '<textarea name="title" rows="1" cols="80"></textarea></p>'+ 
	  '<p>Enter the latitude: <br>'+
	  '<textarea name="latitude" rows="1" cols="80"></textarea></p>'+ 
	  '<p>Enter the longitude: <br>'+
	  '<textarea name="longitude" rows="1" cols="80"></textarea></p>'+ 
	  '<p>Enter a <b>summary</b> of the location: <br>'+
	  '<textarea name="summary" rows="10" cols="80"></textarea></p>'+ 
	  '<p>Enter advice on <b>approaching and anchoraging</b> at this location: <br>'+
	  '<textarea name="approach" rows="20" cols="80"></textarea></p>'+ 
	  '<p>Enter a detailed <b>description</b> of the location: <br>'+
	  '<textarea name="description" rows="20" cols="80"></textarea></p>'+ 
	  '<p>Enter a URL for a <b>NOAA Image</b> of the location: <br>'+
	  '<textarea name="noaaimage" rows="1" cols="80"></textarea></p>'+ 
	  '<p>Enter a URL for an <b>image</b> of the location: <br>'+
	  '<textarea name="image1" rows="1" cols="80"></textarea></p>'+ 
	  '<br></br>'+
	  '<input type="submit" value="Submit text" />'+
	 '</form>'+ 
	'</body>'+
   '</html>';
  
  return body;

}

//Export each function.
exports.create_add_location_page = create_add_location_page;
