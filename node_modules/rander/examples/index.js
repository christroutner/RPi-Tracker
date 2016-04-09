var rander = require('../index');

function times (x, cb) {
  x = x || 1;

  do {
    cb();
  } while (--x > 0);
}

times(50, function () {
  console.log(rander.dice(100));
});

times(50, function () {
  console.log(rander.between(150, 240));
});

times(10, function () {
  console.log(rander.string(20));
});

times(10, function () {
  console.log(rander.number());
});

times(10, function () {
  console.log(rander.pickup(13, '!@#$%^&*('));
});


times(10, function () {
  console.log(rander.ele(['a', 'b', 'c', 'd', 'e', 'f']));
});


times(10, function () {
  console.log(rander.key({k1: 'v1', k2: 'v2', k3: 'v3', k4: 'v4', k5: 'v5'}));
});

times(10, function () {
  console.log(rander.value({k1: 'v1', k2: 'v2', k3: 'v3', k4: 'v4', k5: 'v5'}));
});

