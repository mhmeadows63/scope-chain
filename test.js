var chain = require('.');

var error;

function conclusion(err) {
    if (err) code = console.error(error = err);
    process.exit(!!error);
}

chain(conclusion, function step0() {
    if (conclusion !== this.this) console.log(error = 'wrong this.this');
    chain(this, function () {
        if (conclusion !== this.this.this) console.log(error = 'wrong this.this.this');
        chain(this, function () {
            if (conclusion !== this.this.this.this) console.log(error = 'wrong this.this.thisi.this');
        });
    });

}, function step1() {
    process.nextTick(this, null, 'a', 'b', 'c');

}, function step2(a, b, c) {
    if (a != 'a' || b != 'b' || c != 'c') console.log(error = 'this - failed');
    process.nextTick(this.noerror, new Error('this error should have been delivered to the next task'), 'a', 'b', 'c');

}, function step3(err, a, b, c) {
    if (!err || a != 'a' || b != 'b' || c != 'c') console.log(error = 'this.noerror - failed');
    process.nextTick(this.ignore, new Error('this exception should have been ignored'), 'a', 'b', 'c');

}, function step4(a, b, c) {
    if (a != 'a' || b != 'b' || c != 'c') console.log(error = 'this.ignore - failed');
    process.nextTick(this.silent, new Error('this exception should not have been visible'), 'a', 'b', 'c');

}, function step5() {
    console.log(error = 'this.silent - failed');

});
