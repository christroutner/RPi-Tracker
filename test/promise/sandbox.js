//This is test code for learning to work with promises in node.js

var fs = require('fs');
var Promise = require('promise');

var promise = readTestFile();

promise.then( function(result) {
  debugger;
  console.log('File read successfully!');
}, function(error) {
  debugger;
  conole.error('File not read!');
});

function readTestFile() {
  var promise = new Promise.Promise();
  
  fs.readFile('input.txt', function(error, data) {
    if(error) {
      promise.reject(error);
    } else {
      promise.resolve(data);
    }
  });
  
  return promise;
}