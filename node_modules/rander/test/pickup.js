
var should = require('should');
var rander = require('../index');

describe ('dice unit test', function () {

  it('pickup should be average', function () {

      var s = 'qwertyuiopasdfghjklzxcvbnm';
      var results = {};
      var v, x, t;
      t = x = 260000;

      while( x-- > 0) {
        v = rander.pickup(1, s);

        if ( !results[v]) {
          results[v] = 1;
        } else {
          results[v]++;
        }

      }

      for (x = 0; x < s.length; x++) {
        (results[s.substring(x, x+1)]).should.be.approximately(10000, 500);
      }

  });
});