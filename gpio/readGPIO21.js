var Gpio = require('onoff').Gpio;
 
/*
var led = new Gpio(14, 'out');
var button = new Gpio(4, 'in', 'both');
 
button.watch(function(err, value) {
  led.writeSync(value);
});
*/

var pin21 = new Gpio(21, 'in');

var myInterval = setInterval(function() {
	//console.log('tick');
	pin21.read(checkPin21);
}, 3000);

function checkPin21(err, value) {

	if(err) {
		throw err;
	}
	
	console.log('Pin 21 read: '+value);
	
}

