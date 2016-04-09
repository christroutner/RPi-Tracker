exports.string  = string;
exports.number  = number;
exports.pickup  = pickup;
exports.dice    = dice;
exports.between = between;
exports.ele     = element;
exports.element = element;
exports.key     = key;
exports.value   = value;
exports.val     = value;

function string (len) {
	return pickup(len || 8, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqstrtuvwxyz');
}

function number (len) {
  return pickup(len || 8, '0123456789');
}

// dict is a string
function pickup (/*len, dict || dict */) {
	var str = '', pos;
	var len, dict;

	if (arguments.length === 1) {
		dict = arguments[0];
		len = 1;
	} else if (arguments.length === 2) {
		len = arguments[0];
		dict = arguments[1];
	} else {
		return string();
	}

	for (var i=0; i< len; i++) {
		pos = dice(dict.length - 1);
		str += dict.substring(pos, pos + 1);
	}

	return str;
}

/**
 * throw a dice, return a number not beyond the max.
 * zero is in the range.
 * 
 * @author bibig@me.com
 * @update [2014-05-18 11:23:44]
 * @param  {int} max
 * @return {int}
 */
function dice (max) {
	return Math.floor(Math.random() * (max + 1));
}

function between (min, max) {
	return min + dice(max - min);
}

/**
 * randomly pick an element in the given array
 * 
 * @author bibig@me.com
 * @update [2014-05-18 11:25:04]
 * @param  {array} arr
 * @return {an element of the array}
 */
function element (arr) {
	var i = dice(arr.length - 1);

	return arr[i];
}

/**
 * randomly pick a key in the given object
 * 
 * @author bibig@me.com
 * @update [2014-05-18 11:26:02]
 * @param  {object} obj
 * @return {string}
 */
function key (obj) {
	var keys = Object.keys(obj);

	return element(keys);
}

/**
 * randomly pick a value in the given object
 * 
 * @author bibig@me.com
 * @update [2014-05-18 11:25:51]
 * @param  {object} obj
 * @return {value of the object}
 */
function value (obj) {
	return obj[key(obj)];
}