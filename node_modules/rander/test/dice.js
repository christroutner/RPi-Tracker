
var should = require('should');
var rander = require('../index');

describe ('dice unit test', function () {

  it('test between, should be average', function () {
    var results = {};
    var t, x, v;

    x = t = 100000;

    while( x-- > 0) {
      v = rander.between(1, 10);

      if ( ! results[v] ) {
        results[v] = 1;
      } else {
        results[v]++;
      }

    }

    for (x = 1; x <= 10; x++) {
      (results[x] / t).should.be.approximately(0.1, 0.05);
    }

  });

  it('test dice', function () {
    var results = {};
    var t, x, v;

    x = t = 100000;

    while( x-- > 0) {
      v = rander.dice(9);

      if ( ! results[v] ) {
        results[v] = 1;
      } else {
        results[v]++;
      }

    }

    for (x = 1; x < 10; x++) {
      (results[x] / t).should.be.approximately(0.1, 0.05);
    }

  });


});