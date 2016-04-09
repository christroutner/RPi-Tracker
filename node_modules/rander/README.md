# node-rander

+ a module to generate random string.
+ support custom dictionary.

## install
  npm install rander

## Usage

```javascript
  var rander = require('rander');
```

### dice(max)

throw a dice and return a number not beyond the max argument.

```javascript
  rander.dice(9); // will return a number in 0 ~ 9  
```

### between(min, max)

randomly return a number in the given range.

```javascript
  rander.between(1, 10); // will return a number in 1~10  
```

### pickup(len, dictionary)
randomly make a fixed length string using the given dictionary.

```javascript
  rander.pickup(2, 'abcde');
  // or
  rander.pickup('abcde'); // the default length is 1;
```

### string(len)

+ using pickup to return an alphanumber string in the fixed length.
+ the dictionary: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz 

```javascript
  rander.string(6);
```

### number(len)

+ using pickup to return an number string in the fixed length.
+ the dictionary: 0123456789

```javascript
  rander.number(); // default length is 8
```

### element(array)

randomly return an element in array.

```javascript

  var arr = ['a', 'b', 'c'];
  
  rander.element(arr); // will return a string 'a', 'b', or 'c'
  // or
  rander.ele(arr);

```
### key(object)

randomly return a key in the object

```javascript

  var obj = {a: 'v1', b: 'v2', c: 'v3'};
  
  rander.key(obj); // will return a string 'a', 'b', or 'c'

```

### value(object)

randomly return a value int the object

```javascript

  var obj = {a: 'v1', b: 'v2', c: 'v3'};
  
  rander.value(obj); // will return a string 'v1', 'v2', or 'v3'
  // or
  rander.val(obj);

```