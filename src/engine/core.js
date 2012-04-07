(function(){
var core = provides('engine.core');

/*
* extend extends the properties of arg0
* with the ones of arg1, arg2...
* If an argument is a function it's prototype
* will be used in it's place. If arg0 is
* extended with a function the name of the function
* is set to it's attribute name.
*/
function extend() {
    var target = arguments[0],
        i, argument, name, f, value;
    for(i = 1; i < arguments.length; i++) {
        argument = arguments[i];
        if(typeof argument == 'function'){
            argument = argument.prototype;
        }
        for(name in argument) {
            value = argument[name];
            if(value === undefined) continue;
            if(typeof value == 'function'){
                value.name = name;
            }
            target[name] = value;
        }
    }
    return target;
}

function assert(truth, message) {
    if(!truth) {
        throw new Error(message || 'assertion failed');
    }
}

function toArray(arrayLike) {
    return Array.prototype.slice.call(arrayLike, 0);
}

/*
* Defines a new class
* Example Class(base1, base2);
*/
function Class() {
    var proto = extend.apply(this, [{}].concat(toArray(arguments))),
        init = arguments[arguments.length-1].init;

    if(!init){
        if(proto.init){
            init = function init(){
                this.__super__.apply(this, arguments);
            };
            proto.__super__ = proto.init;
        }
        else {
            init = function init(){};
        }
    }
    init.prototype = proto;
    return init;
}

function clamp(a, b, c) {
    return a < b ? b : (a > c ? c : a);
}

function log(){
    if(window.console && console.log && window.console.log.apply){
        window.console.log.apply(window.console, arguments);
    }
}

extend(core, {
    Class: Class,
    toArray: toArray,
    extend: extend,
    assert: assert,
    clamp: clamp,
    log: log
});
extend(window, core);

})();
