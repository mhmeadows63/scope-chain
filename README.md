# scope-chain
Another asynchronous function chain wrapper offering both middleware and 
non-middleware uses

```js
var app = require('express')();
var chain = require('scope-chain');
var fs = require('fs');

app.get('/', function (req, res, next) {
    var scopeVariable = Date() + '\n';
    chain(next, function step() {
        res.write(scopeVariable, this);
    }, function step() {
        setTimeout(this, 2000);
    }, function step() {
        res.write(Date() + '\n', this);
    });
}, function (req, res) {
  res.end()
}).listen(3000);
```

## Installation

```bash
$ npm install scope-chain
```

## Features

  * Encourages middleware code-layouts presenting a clear birds-eye view
  * Flexible next-step callback functionality
  * Uncluttered usage lets the code tell it's own story
  * Invisible testing of `err` arguments
  * invisible try/catch wrapping of each step function

## Philosophy

Programming a multi-step activity in an asynchronous NodeJS architecture can 
lead to a staircase of in-line functions as in this contrived example.

```js
function middleware(req, res, next) {
    res.setHeader('Content-Type', 'text/plain');
    fs.readdir('/var/run', function (err, files) {
        for (var file in files) {
            fs.readyFile('/var/run/' + file, function (err, data) {
            });
            ... etc - async gets messy here
        }
    });
}
```

This scope-chain is for those who prefer to see code in a more linear format.

```js
function middleware(req, res, next) {
    res.setHeader('Content-Type', 'text/plain');
    chain(next, function () {
        fs.readdir('/var/run', this); // cb(err1, files)
    }, function callee(files, file, err2, data) {
        if (file && !err2) // 
            res.write(file + ': ' + data.trim() + '\n');
            
        if (files.length === 0) return this();
        file = files.shift();
        fs.readFile('/var/run/' + file, callee.bind(this, files, file)); // cb(err2, data)
   });
}
```

## Detail

The 1st argument to `chain` is the _final_ function having a fingerprint of 
`function (err, args, ...)` and it is always called last.  In a middleware 
usage, the middleware-next argument is usually supplied here.

The 2nd and subsequent arguments to `chain` are the asynchronous steps of the
activity. When called, each function is wrapped in its own try/catch where all 
exceptions are caught and sent to the _final_ function, aborting all subsequent 
steps. For each of the 2nd and subsequent functions `this` is a function-object 
for use as the inner next for each step function.

The `this` object provides four variants having the following fingerprints:

### `this(err, arg1, arg2, arg3, ...)`

When `this()` is called with a falsy err value, the subsequent step function 
is called with just the available `argN` arguments.

When called with a truthy err value, the _final_ function is called with that 
truthy err value, thereby aborting the step sequence.

### `this.silent(err, arg1, arg2, arg3, ...)`

When `this.silent()` is called with a falsy err value, the subsequent step 
function is called with just the available `argN` arguments.

When called with a truthy err value, the _final_ function is called with no 
arguments so discarding the error and aborting the step sequence.

### `this.ignore(err, arg1, arg2, arg3, ...)`

When `this.ignore()` is called with a falsy err value, the subsequent step 
function is called with just the available `argN` arguments.

When called with a truthy err value, the error is discarded and the subsequent 
step function is called with just the available `argN` arguments.

### `this.noerror(arg1, arg2, arg3, ...)`

As `this.noerror()` has any concept of an err arguments, the subsequent step 
function is called with all the available `argN` arguments. Arg1 may be an err
value, but the `chain` functionality is ignorant of this.

## Attribute Copying

Any attributes on the found on the _final_ function are copied to each of the 
four variant inner-next functions, but NOT copied back on completion. This can 
useful is passing context to private implementations of asynchronous logic.

The author has used this in an ExpressJS application to attach a unique index to
each `req` object so that log-lines from interleaved request processing can be 
attributed to the original request that triggered the operation.

```
app.use(function (req, res, next) { req.index = ++global.index; next() })
app.get('/', function (req, res, next) {
    next.index = req.index;
    chain(next, function () {
        mysql(sql, this); // any logging from mysql can include the index
    }, function (rows, cols) {
        ...
    });
}
```

## License

  [MIT](LICENSE)
