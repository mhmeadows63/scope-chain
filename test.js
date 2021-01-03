var chain = require('.');
var trace = console.log || function() {};

chain(function conclusion(err) {
    err ? console.log(err) : trace('SUCCESS')
    process.exit(!!err);

}, function () {
    trace('this()');
    process.nextTick(this, null, 'a', 'b', 'c');

}, function test(a, b, c) { // test regular arg delivery to following step
    if (a != 'a' || b != 'b' || c != 'c')
        console.log('this() - failed');
    this();

}, function test() { // test parsing of string as conclusion
    trace('string');
    var next = this;
    var error = console.error;
    console.error = function (err) {
        console.error = error;
        if (err.startsWith('test: ') === false)
            console.log('final-string - failed');
        next();
    };
    chain('test:', function () { JSON.parse(';') });

}, function test() { // test extra context
    trace('context');
    chain({ attr: 42 }, this, function () {
        if (this.attr !== 42)
            console.log('extra context - failed');
        this();

    }, function () {
        if (this.attr !== 42)
            console.log('extra context - failed');
        this();

    });
    
}, function test() { // test null _final_
    trace('null-final');
    chain(null, function () {
        this();

    });
    this();

} , function test() { // test delivery of next to recursing chains
    trace('recursion');
    var conclusion = this.this;
    chain(this, function () {
        if (conclusion !== this.this.this)
            console.log('wrong this.this.this');
        chain(this, function () {
            if (conclusion !== this.this.this.this)
                console.log('wrong this.this.thisi.this');
            this();
        });
    });

}, function test() { // test this.noerror() delivery of all args to next step
    trace('this.noerror()');
    chain(this, function () {
        process.nextTick(this.noerror, new Error('this error should have been delivered to the next task'), 'a', 'b', 'c');

    }, function (err, a, b, c) {
        if (!err || a != 'a' || b != 'b' || c != 'c')
            console.log('this.noerror - failed');
        this();

    });

}, function test() { // test this.ignore() delivery of just non-err args
    trace('this.ignore()');
    chain(this, function () {
        process.nextTick(this.ignore, new Error('this exception should have been ignored'), 'a', 'b', 'c');

    }, function (a, b, c) {
        if (a != 'a' || b != 'b' || c != 'c')
            console.log('this.ignore - failed');
        this();
    });

}, function test(a, b, c) { // test this.silent() abort via conclusion()
    trace('this.silent()');
    chain(this, function () {
        process.nextTick(this.silent, new Error('this exception should not have been visible'), 'a', 'b', 'c');

    }, function () {
        console.log('this.silent - failed');
        this();

    });
});
