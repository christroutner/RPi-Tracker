var should = require('should');
var rander = require('../index');


function getLength () {
  var len = 0;
  do {
    len = parseInt(rander.number(2), 10);
  } while ( len == 0 );
  return len;
}

function times (max, cb) {
  for (var i = 0; i < max; i++) {
    cb();
  }
}

describe('random string test', function () {
  it('should generate a string with default length', function () {
    times(10, function () {
      var r = rander.string();
      // console.log(r);
      // console.log(typeof r);
      // 
      should(typeof r == 'string').be.ok;
    });
  });
  
  it('should generate a string with a given length', function () {
    times(10, function () {
      var len = getLength();
      var r = rander.string(len);
      should(typeof r == 'string').be.ok;
      should(r.length == len).be.ok;
    });
  });
  
  it('should generate a number with default length', function () {
    times(10, function () {
      var r = rander.number();
      should(typeof r == 'string').be.ok;
      should(!isNaN(r)).be.ok;
    });
  });
  
  it('should generate a number with a given length', function () {
    times(10, function () {
      var len = getLength();
      var r = rander.number(len);
      should(typeof r == 'string').be.ok;
      should(!isNaN(r)).be.ok;
    });
  });
  
  it('should fetch the first char', function () {
    var right = false;
    times(1000, function () {
      var c = rander.pickup(1, '012345');
      if (c == '0') {
        right = true;
      }
    });
    
    should(right).be.ok;
  });
  
  it('should fetch the last char', function () {
    var right = false;
    times(1000, function () {
      var c = rander.pickup('0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz');
      if (c == 'z') {
        right = true;
      }
    });
    
    should(right).be.ok;
  });
});

