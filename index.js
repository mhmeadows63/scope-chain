module.exports = function chain(next/*, task, task, ...*/) {
    var next = next || function (err) { err && console.error(err) };
    var tasks = Array.prototype.slice.call(arguments, 1);
    var funcs = [
        // function that considers the 1st argument as a potential error to forward
        // on-error - abort the chain and return the error as an argument to next()
        // otherwise - calls the next task without the <null> err argument
        // if there are no further tasks, calls 'next' with all available arguments
        function done(err/*, ...*/) { // function to passed as the 'this' object to each task
            if (err) return next(err); // end the chain reporting the error
            try { tasks.length ? tasks.shift().apply(funcs[0], Array.prototype.slice.call(arguments, 1)) : next.apply(this, arguments) }
            catch (ex) { next(ex) } // return any thrown exception as the argument to next()
        },

        // function that considers the 1st argument as a potential error to mask
        // on-error - abort the chain and return <null> as an argument to next()
        // otherwise - calls the next task without the <null> err argument
        // if there are no further tasks, calls 'next' with all available arguments including err
        function silent(err/*, ...*/) { // function can be referenced within each task as this.silent
            if (err) return next(); // end the chain without reporting the error
            try { tasks.length ? tasks.shift().apply(funcs[0], Array.prototype.slice.call(arguments, 1)) : next.apply(this, arguments) }
            catch (ex) { next(ex) } // return any thrown exception as the argument to next()
        },

        // function that considers the 1st argument as a potential error to ignore
        // simply calls the next task without the possibly <non-null> err argument
        // if there are no further tasks, call 'next' with all available arguments including err
        function ignore(err/*, ...*/) { // function can be referenced within each task as this.ignore
            try { tasks.length ? tasks.shift().apply(funcs[0], Array.prototype.slice.call(arguments, 1)) : next.apply(this, arguments) }
            catch (ex) { next(ex) } // return any thrown exception as the argument to next()
        },

        // function that does not expect an error 1st argument
        // simply call the next task with all provided arguments
        // if there are no further tasks, calls 'next' with all available arguments preceeded by a fake <null> err
        function noerror(/*...*/) { // function can be referenced within each task as this.noerror
            try { tasks.length ? tasks.shift().apply(funcs[0], arguments) : next.apply(this, [null].concat(Array.prototype.slice.call(arguments))) }
            catch (ex) { next(ex) } // return any thrown exception as the argument to next()
        },
    ];
    
    // copy any properties on the 'next' function to the all functions
    funcs.forEach(function (func, i, a) {
        for (var key in next) func[key] = next[key];
        if (i) this[func.name] = func;
    }, funcs[0]);
    
    try { tasks.length ? tasks.shift().apply(funcs[0]) : next() } // invoke the 1st task with zero-arguments
    catch (ex) { next(ex) } // return any thrown exception as the argument to next()
}
