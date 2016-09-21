
var globalThis; //Used in functions below when 'this' loses context.
//var coordinateBuffer = []; //Used to collect coordinate and time data between timer events.

function Constructor() {

  //Used in functions below when 'this' loses context.
  globalThis = this;
  
  this.helloWorld = function() {
    //debugger;
    console.log('Hello World!');
  }
  
  return(this);
  
}

exports.Constructor = Constructor;