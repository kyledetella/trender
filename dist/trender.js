!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.trender=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(_dereq_,module,exports){
"use strict";
var Promise = _dereq_("./rsvp/promise")["default"];
var EventTarget = _dereq_("./rsvp/events")["default"];
var denodeify = _dereq_("./rsvp/node")["default"];
var all = _dereq_("./rsvp/all")["default"];
var allSettled = _dereq_("./rsvp/all-settled")["default"];
var race = _dereq_("./rsvp/race")["default"];
var hash = _dereq_("./rsvp/hash")["default"];
var hashSettled = _dereq_("./rsvp/hash-settled")["default"];
var rethrow = _dereq_("./rsvp/rethrow")["default"];
var defer = _dereq_("./rsvp/defer")["default"];
var config = _dereq_("./rsvp/config").config;
var configure = _dereq_("./rsvp/config").configure;
var map = _dereq_("./rsvp/map")["default"];
var resolve = _dereq_("./rsvp/resolve")["default"];
var reject = _dereq_("./rsvp/reject")["default"];
var filter = _dereq_("./rsvp/filter")["default"];
var asap = _dereq_("./rsvp/asap")["default"];

config.async = asap; // default async is asap;

function async(callback, arg) {
  config.async(callback, arg);
}

function on() {
  config.on.apply(config, arguments);
}

function off() {
  config.off.apply(config, arguments);
}

// Set up instrumentation through `window.__PROMISE_INTRUMENTATION__`
if (typeof window !== 'undefined' && typeof window.__PROMISE_INSTRUMENTATION__ === 'object') {
  var callbacks = window.__PROMISE_INSTRUMENTATION__;
  configure('instrument', true);
  for (var eventName in callbacks) {
    if (callbacks.hasOwnProperty(eventName)) {
      on(eventName, callbacks[eventName]);
    }
  }
}

exports.Promise = Promise;
exports.EventTarget = EventTarget;
exports.all = all;
exports.allSettled = allSettled;
exports.race = race;
exports.hash = hash;
exports.hashSettled = hashSettled;
exports.rethrow = rethrow;
exports.defer = defer;
exports.denodeify = denodeify;
exports.configure = configure;
exports.on = on;
exports.off = off;
exports.resolve = resolve;
exports.reject = reject;
exports.async = async;
exports.map = map;
exports.filter = filter;
},{"./rsvp/all":5,"./rsvp/all-settled":4,"./rsvp/asap":6,"./rsvp/config":7,"./rsvp/defer":8,"./rsvp/events":10,"./rsvp/filter":11,"./rsvp/hash":13,"./rsvp/hash-settled":12,"./rsvp/map":15,"./rsvp/node":16,"./rsvp/promise":18,"./rsvp/race":24,"./rsvp/reject":25,"./rsvp/resolve":26,"./rsvp/rethrow":27}],3:[function(_dereq_,module,exports){
'use strict';
var objectOrFunction = _dereq_('./utils').objectOrFunction;
var isFunction = _dereq_('./utils').isFunction;
var now = _dereq_('./utils').now;
var instrument = _dereq_('./instrument')['default'];
var config = _dereq_('./config').config;
function noop() {
}
var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;
var GET_THEN_ERROR = new ErrorObject();
function getThen(promise) {
    try {
        return promise.then;
    } catch (error) {
        GET_THEN_ERROR.error = error;
        return GET_THEN_ERROR;
    }
}
function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
    try {
        then.call(value, fulfillmentHandler, rejectionHandler);
    } catch (e) {
        return e;
    }
}
function handleForeignThenable(promise, thenable, then) {
    config.async(function (promise$2) {
        var sealed = false;
        var error = tryThen(then, thenable, function (value) {
                if (sealed) {
                    return;
                }
                sealed = true;
                if (thenable !== value) {
                    resolve(promise$2, value);
                } else {
                    fulfill(promise$2, value);
                }
            }, function (reason) {
                if (sealed) {
                    return;
                }
                sealed = true;
                reject(promise$2, reason);
            }, 'Settle: ' + (promise$2._label || ' unknown promise'));
        if (!sealed && error) {
            sealed = true;
            reject(promise$2, error);
        }
    }, promise);
}
function handleOwnThenable(promise, thenable) {
    promise._onerror = null;
    if (thenable._state === FULFILLED) {
        fulfill(promise, thenable._result);
    } else if (promise._state === REJECTED) {
        reject(promise, thenable._result);
    } else {
        subscribe(thenable, undefined, function (value) {
            if (thenable !== value) {
                resolve(promise, value);
            } else {
                fulfill(promise, value);
            }
        }, function (reason) {
            reject(promise, reason);
        });
    }
}
function handleMaybeThenable(promise, maybeThenable) {
    if (maybeThenable instanceof promise.constructor) {
        handleOwnThenable(promise, maybeThenable);
    } else {
        var then = getThen(maybeThenable);
        if (then === GET_THEN_ERROR) {
            reject(promise, GET_THEN_ERROR.error);
        } else if (then === undefined) {
            fulfill(promise, maybeThenable);
        } else if (isFunction(then)) {
            handleForeignThenable(promise, maybeThenable, then);
        } else {
            fulfill(promise, maybeThenable);
        }
    }
}
function resolve(promise, value) {
    if (promise === value) {
        fulfill(promise, value);
    } else if (objectOrFunction(value)) {
        handleMaybeThenable(promise, value);
    } else {
        fulfill(promise, value);
    }
}
function publishRejection(promise) {
    if (promise._onerror) {
        promise._onerror(promise._result);
    }
    publish(promise);
}
function fulfill(promise, value) {
    if (promise._state !== PENDING) {
        return;
    }
    promise._result = value;
    promise._state = FULFILLED;
    if (promise._subscribers.length === 0) {
        if (config.instrument) {
            instrument('fulfilled', promise);
        }
    } else {
        config.async(publish, promise);
    }
}
function reject(promise, reason) {
    if (promise._state !== PENDING) {
        return;
    }
    promise._state = REJECTED;
    promise._result = reason;
    config.async(publishRejection, promise);
}
function subscribe(parent, child, onFulfillment, onRejection) {
    var subscribers = parent._subscribers;
    var length = subscribers.length;
    parent._onerror = null;
    subscribers[length] = child;
    subscribers[length + FULFILLED] = onFulfillment;
    subscribers[length + REJECTED] = onRejection;
    if (length === 0 && parent._state) {
        config.async(publish, parent);
    }
}
function publish(promise) {
    var subscribers = promise._subscribers;
    var settled = promise._state;
    if (config.instrument) {
        instrument(settled === FULFILLED ? 'fulfilled' : 'rejected', promise);
    }
    if (subscribers.length === 0) {
        return;
    }
    var child, callback, detail = promise._result;
    for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];
        if (child) {
            invokeCallback(settled, child, callback, detail);
        } else {
            callback(detail);
        }
    }
    promise._subscribers.length = 0;
}
function ErrorObject() {
    this.error = null;
}
var TRY_CATCH_ERROR = new ErrorObject();
function tryCatch(callback, detail) {
    try {
        return callback(detail);
    } catch (e) {
        TRY_CATCH_ERROR.error = e;
        return TRY_CATCH_ERROR;
    }
}
function invokeCallback(settled, promise, callback, detail) {
    var hasCallback = isFunction(callback), value, error, succeeded, failed;
    if (hasCallback) {
        value = tryCatch(callback, detail);
        if (value === TRY_CATCH_ERROR) {
            failed = true;
            error = value.error;
            value = null;
        } else {
            succeeded = true;
        }
        if (promise === value) {
            reject(promise, new TypeError('A promises callback cannot return that same promise.'));
            return;
        }
    } else {
        value = detail;
        succeeded = true;
    }
    if (promise._state !== PENDING) {
    }    // noop
    else if (hasCallback && succeeded) {
        resolve(promise, value);
    } else if (failed) {
        reject(promise, error);
    } else if (settled === FULFILLED) {
        fulfill(promise, value);
    } else if (settled === REJECTED) {
        reject(promise, value);
    }
}
function initializePromise(promise, resolver) {
    try {
        resolver(function resolvePromise(value) {
            resolve(promise, value);
        }, function rejectPromise(reason) {
            reject(promise, reason);
        });
    } catch (e) {
        reject(promise, e);
    }
}
exports.noop = noop;
exports.resolve = resolve;
exports.reject = reject;
exports.fulfill = fulfill;
exports.subscribe = subscribe;
exports.publish = publish;
exports.publishRejection = publishRejection;
exports.initializePromise = initializePromise;
exports.invokeCallback = invokeCallback;
exports.FULFILLED = FULFILLED;
exports.REJECTED = REJECTED;
},{"./config":7,"./instrument":14,"./utils":28}],4:[function(_dereq_,module,exports){
'use strict';
var Enumerator = _dereq_('./enumerator')['default'];
var makeSettledResult = _dereq_('./enumerator').makeSettledResult;
var Promise = _dereq_('./promise')['default'];
var o_create = _dereq_('./utils').o_create;
function AllSettled(Constructor, entries, label) {
    this._superConstructor(Constructor, entries, false, label);
}
AllSettled.prototype = o_create(Enumerator.prototype);
AllSettled.prototype._superConstructor = Enumerator;
AllSettled.prototype._makeResult = makeSettledResult;
AllSettled.prototype._validationError = function () {
    return new Error('allSettled must be called with an array');
};
/**
  `RSVP.allSettled` is similar to `RSVP.all`, but instead of implementing
  a fail-fast method, it waits until all the promises have returned and
  shows you all the results. This is useful if you want to handle multiple
  promises' failure states together as a set.

  Returns a promise that is fulfilled when all the given promises have been
  settled. The return promise is fulfilled with an array of the states of
  the promises passed into the `promises` array argument.

  Each state object will either indicate fulfillment or rejection, and
  provide the corresponding value or reason. The states will take one of
  the following formats:

  ```javascript
  { state: 'fulfilled', value: value }
    or
  { state: 'rejected', reason: reason }
  ```

  Example:

  ```javascript
  var promise1 = RSVP.Promise.resolve(1);
  var promise2 = RSVP.Promise.reject(new Error('2'));
  var promise3 = RSVP.Promise.reject(new Error('3'));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.allSettled(promises).then(function(array){
    // array == [
    //   { state: 'fulfilled', value: 1 },
    //   { state: 'rejected', reason: Error },
    //   { state: 'rejected', reason: Error }
    // ]
    // Note that for the second item, reason.message will be "2", and for the
    // third item, reason.message will be "3".
  }, function(error) {
    // Not run. (This block would only be called if allSettled had failed,
    // for instance if passed an incorrect argument type.)
  });
  ```

  @method allSettled
  @static
  @for RSVP
  @param {Array} promises
  @param {String} label - optional string that describes the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled with an array of the settled
  states of the constituent promises.
*/
exports['default'] = function allSettled(entries, label) {
    return new AllSettled(Promise, entries, label).promise;
};
},{"./enumerator":9,"./promise":18,"./utils":28}],5:[function(_dereq_,module,exports){
'use strict';
var Promise = _dereq_('./promise')['default'];
/**
  This is a convenient alias for `RSVP.Promise.all`.

  @method all
  @static
  @for RSVP
  @param {Array} array Array of promises.
  @param {String} label An optional label. This is useful
  for tooling.
*/
exports['default'] = function all(array, label) {
    return Promise.all(array, label);
};
},{"./promise":18}],6:[function(_dereq_,module,exports){
(function (process){
'use strict';
var length = 0;
exports['default'] = function asap(callback, arg) {
    queue[length] = callback;
    queue[length + 1] = arg;
    length += 2;
    if (length === 2) {
        // If length is 1, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        scheduleFlush();
    }
};
var browserGlobal = typeof window !== 'undefined' ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';
// node
function useNextTick() {
    return function () {
        process.nextTick(flush);
    };
}
function useMutationObserver() {
    var iterations = 0;
    var observer = new BrowserMutationObserver(flush);
    var node = document.createTextNode('');
    observer.observe(node, { characterData: true });
    return function () {
        node.data = iterations = ++iterations % 2;
    };
}
// web worker
function useMessageChannel() {
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    return function () {
        channel.port2.postMessage(0);
    };
}
function useSetTimeout() {
    return function () {
        setTimeout(flush, 1);
    };
}
var queue = new Array(1000);
function flush() {
    for (var i = 0; i < length; i += 2) {
        var callback = queue[i];
        var arg = queue[i + 1];
        callback(arg);
        queue[i] = undefined;
        queue[i + 1] = undefined;
    }
    length = 0;
}
var scheduleFlush;
// Decide what async method to use to triggering processing of queued callbacks:
if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
    scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
    scheduleFlush = useMutationObserver();
} else if (isWorker) {
    scheduleFlush = useMessageChannel();
} else {
    scheduleFlush = useSetTimeout();
}
}).call(this,_dereq_("1YiZ5S"))
},{"1YiZ5S":1}],7:[function(_dereq_,module,exports){
'use strict';
var EventTarget = _dereq_('./events')['default'];
var config = { instrument: false };
EventTarget.mixin(config);
function configure(name, value) {
    if (name === 'onerror') {
        // handle for legacy users that expect the actual
        // error to be passed to their function added via
        // `RSVP.configure('onerror', someFunctionHere);`
        config.on('error', value);
        return;
    }
    if (arguments.length === 2) {
        config[name] = value;
    } else {
        return config[name];
    }
}
exports.config = config;
exports.configure = configure;
},{"./events":10}],8:[function(_dereq_,module,exports){
'use strict';
var Promise = _dereq_('./promise')['default'];
/**
  `RSVP.defer` returns an object similar to jQuery's `$.Deferred`.
  `RSVP.defer` should be used when porting over code reliant on `$.Deferred`'s
  interface. New code should use the `RSVP.Promise` constructor instead.

  The object returned from `RSVP.defer` is a plain object with three properties:

  * promise - an `RSVP.Promise`.
  * reject - a function that causes the `promise` property on this object to
    become rejected
  * resolve - a function that causes the `promise` property on this object to
    become fulfilled.

  Example:

   ```javascript
   var deferred = RSVP.defer();

   deferred.resolve("Success!");

   defered.promise.then(function(value){
     // value here is "Success!"
   });
   ```

  @method defer
  @static
  @for RSVP
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Object}
 */
exports['default'] = function defer(label) {
    var deferred = {};
    deferred.promise = new Promise(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    }, label);
    return deferred;
};
},{"./promise":18}],9:[function(_dereq_,module,exports){
'use strict';
var isArray = _dereq_('./utils').isArray;
var isMaybeThenable = _dereq_('./utils').isMaybeThenable;
var noop = _dereq_('./-internal').noop;
var reject = _dereq_('./-internal').reject;
var fulfill = _dereq_('./-internal').fulfill;
var subscribe = _dereq_('./-internal').subscribe;
var FULFILLED = _dereq_('./-internal').FULFILLED;
var REJECTED = _dereq_('./-internal').REJECTED;
var PENDING = _dereq_('./-internal').PENDING;
var ABORT_ON_REJECTION = true;
exports.ABORT_ON_REJECTION = ABORT_ON_REJECTION;
function makeSettledResult(state, position, value) {
    if (state === FULFILLED) {
        return {
            state: 'fulfilled',
            value: value
        };
    } else {
        return {
            state: 'rejected',
            reason: value
        };
    }
}
exports.makeSettledResult = makeSettledResult;
function Enumerator(Constructor, input, abortOnReject, label) {
    this._instanceConstructor = Constructor;
    this.promise = new Constructor(noop, label);
    this._abortOnReject = abortOnReject;
    if (this._validateInput(input)) {
        this._input = input;
        this.length = input.length;
        this._remaining = input.length;
        this._init();
        if (this.length === 0) {
            fulfill(this.promise, this._result);
        } else {
            this.length = this.length || 0;
            this._enumerate();
            if (this._remaining === 0) {
                fulfill(this.promise, this._result);
            }
        }
    } else {
        reject(this.promise, this._validationError());
    }
}
Enumerator.prototype._validateInput = function (input) {
    return isArray(input);
};
Enumerator.prototype._validationError = function () {
    return new Error('Array Methods must be provided an Array');
};
Enumerator.prototype._init = function () {
    this._result = new Array(this.length);
};
exports['default'] = Enumerator;
Enumerator.prototype._enumerate = function () {
    var length = this.length;
    var promise = this.promise;
    var input = this._input;
    for (var i = 0; promise._state === PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
    }
};
Enumerator.prototype._eachEntry = function (entry, i) {
    var c = this._instanceConstructor;
    if (isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== PENDING) {
            entry._onerror = null;
            this._settledAt(entry._state, i, entry._result);
        } else {
            this._willSettleAt(c.resolve(entry), i);
        }
    } else {
        this._remaining--;
        this._result[i] = this._makeResult(FULFILLED, i, entry);
    }
};
Enumerator.prototype._settledAt = function (state, i, value) {
    var promise = this.promise;
    if (promise._state === PENDING) {
        this._remaining--;
        if (this._abortOnReject && state === REJECTED) {
            reject(promise, value);
        } else {
            this._result[i] = this._makeResult(state, i, value);
        }
    }
    if (this._remaining === 0) {
        fulfill(promise, this._result);
    }
};
Enumerator.prototype._makeResult = function (state, i, value) {
    return value;
};
Enumerator.prototype._willSettleAt = function (promise, i) {
    var enumerator = this;
    subscribe(promise, undefined, function (value) {
        enumerator._settledAt(FULFILLED, i, value);
    }, function (reason) {
        enumerator._settledAt(REJECTED, i, reason);
    });
};
},{"./-internal":3,"./utils":28}],10:[function(_dereq_,module,exports){
'use strict';
function indexOf(callbacks, callback) {
    for (var i = 0, l = callbacks.length; i < l; i++) {
        if (callbacks[i] === callback) {
            return i;
        }
    }
    return -1;
}
function callbacksFor(object) {
    var callbacks = object._promiseCallbacks;
    if (!callbacks) {
        callbacks = object._promiseCallbacks = {};
    }
    return callbacks;
}
/**
  @class RSVP.EventTarget
*/
exports['default'] = {
    mixin: function (object) {
        object.on = this.on;
        object.off = this.off;
        object.trigger = this.trigger;
        object._promiseCallbacks = undefined;
        return object;
    },
    on: function (eventName, callback) {
        var allCallbacks = callbacksFor(this), callbacks;
        callbacks = allCallbacks[eventName];
        if (!callbacks) {
            callbacks = allCallbacks[eventName] = [];
        }
        if (indexOf(callbacks, callback) === -1) {
            callbacks.push(callback);
        }
    },
    off: function (eventName, callback) {
        var allCallbacks = callbacksFor(this), callbacks, index;
        if (!callback) {
            allCallbacks[eventName] = [];
            return;
        }
        callbacks = allCallbacks[eventName];
        index = indexOf(callbacks, callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    },
    trigger: function (eventName, options) {
        var allCallbacks = callbacksFor(this), callbacks, callbackTuple, callback, binding;
        if (callbacks = allCallbacks[eventName]) {
            // Don't cache the callbacks.length since it may grow
            for (var i = 0; i < callbacks.length; i++) {
                callback = callbacks[i];
                callback(options);
            }
        }
    }
};
},{}],11:[function(_dereq_,module,exports){
'use strict';
var Promise = _dereq_('./promise')['default'];
var isFunction = _dereq_('./utils').isFunction;
var isMaybeThenable = _dereq_('./utils').isMaybeThenable;
/**
 `RSVP.filter` is similar to JavaScript's native `filter` method, except that it
  waits for all promises to become fulfilled before running the `filterFn` on
  each item in given to `promises`. `RSVP.filter` returns a promise that will
  become fulfilled with the result of running `filterFn` on the values the
  promises become fulfilled with.

  For example:

  ```javascript

  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);

  var promises = [promise1, promise2, promise3];

  var filterFn = function(item){
    return item > 1;
  };

  RSVP.filter(promises, filterFn).then(function(result){
    // result is [ 2, 3 ]
  });
  ```

  If any of the `promises` given to `RSVP.filter` are rejected, the first promise
  that is rejected will be given as an argument to the returned promise's
  rejection handler. For example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  var filterFn = function(item){
    return item > 1;
  };

  RSVP.filter(promises, filterFn).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(reason) {
    // reason.message === "2"
  });
  ```

  `RSVP.filter` will also wait for any promises returned from `filterFn`.
  For instance, you may want to fetch a list of users then return a subset
  of those users based on some asynchronous operation:

  ```javascript

  var alice = { name: 'alice' };
  var bob   = { name: 'bob' };
  var users = [ alice, bob ];

  var promises = users.map(function(user){
    return RSVP.resolve(user);
  });

  var filterFn = function(user){
    // Here, Alice has permissions to create a blog post, but Bob does not.
    return getPrivilegesForUser(user).then(function(privs){
      return privs.can_create_blog_post === true;
    });
  };
  RSVP.filter(promises, filterFn).then(function(users){
    // true, because the server told us only Alice can create a blog post.
    users.length === 1;
    // false, because Alice is the only user present in `users`
    users[0] === bob;
  });
  ```

  @method filter
  @static
  @for RSVP
  @param {Array} promises
  @param {Function} filterFn - function to be called on each resolved value to
  filter the final results.
  @param {String} label optional string describing the promise. Useful for
  tooling.
  @return {Promise}
*/
exports['default'] = function filter(promises, filterFn, label) {
    return Promise.all(promises, label).then(function (values) {
        if (!isFunction(filterFn)) {
            throw new TypeError('You must pass a function as filter\'s second argument.');
        }
        var length = values.length;
        var filtered = new Array(length);
        for (var i = 0; i < length; i++) {
            filtered[i] = filterFn(values[i]);
        }
        return Promise.all(filtered, label).then(function (filtered$2) {
            var results = new Array(length);
            var newLength = 0;
            for (var i$2 = 0; i$2 < length; i$2++) {
                if (filtered$2[i$2]) {
                    results[newLength] = values[i$2];
                    newLength++;
                }
            }
            results.length = newLength;
            return results;
        });
    });
};
},{"./promise":18,"./utils":28}],12:[function(_dereq_,module,exports){
'use strict';
var Promise = _dereq_('./promise')['default'];
var makeSettledResult = _dereq_('./enumerator').makeSettledResult;
var PromiseHash = _dereq_('./promise-hash')['default'];
var Enumerator = _dereq_('./enumerator')['default'];
var o_create = _dereq_('./utils').o_create;
function HashSettled(Constructor, object, label) {
    this._superConstructor(Constructor, object, false, label);
}
HashSettled.prototype = o_create(PromiseHash.prototype);
HashSettled.prototype._superConstructor = Enumerator;
HashSettled.prototype._makeResult = makeSettledResult;
HashSettled.prototype._validationError = function () {
    return new Error('hashSettled must be called with an object');
};
/**
  `RSVP.hashSettled` is similar to `RSVP.allSettled`, but takes an object
  instead of an array for its `promises` argument.

  Unlike `RSVP.all` or `RSVP.hash`, which implement a fail-fast method,
  but like `RSVP.allSettled`, `hashSettled` waits until all the
  constituent promises have returned and then shows you all the results
  with their states and values/reasons. This is useful if you want to
  handle multiple promises' failure states together as a set.

  Returns a promise that is fulfilled when all the given promises have been
  settled, or rejected if the passed parameters are invalid.

  The returned promise is fulfilled with a hash that has the same key names as
  the `promises` object argument. If any of the values in the object are not
  promises, they will be copied over to the fulfilled object and marked with state
  'fulfilled'.

  Example:

  ```javascript
  var promises = {
    myPromise: RSVP.Promise.resolve(1),
    yourPromise: RSVP.Promise.resolve(2),
    theirPromise: RSVP.Promise.resolve(3),
    notAPromise: 4
  };

  RSVP.hashSettled(promises).then(function(hash){
    // hash here is an object that looks like:
    // {
    //   myPromise: { state: 'fulfilled', value: 1 },
    //   yourPromise: { state: 'fulfilled', value: 2 },
    //   theirPromise: { state: 'fulfilled', value: 3 },
    //   notAPromise: { state: 'fulfilled', value: 4 }
    // }
  });
  ```

  If any of the `promises` given to `RSVP.hash` are rejected, the state will
  be set to 'rejected' and the reason for rejection provided.

  Example:

  ```javascript
  var promises = {
    myPromise: RSVP.Promise.resolve(1),
    rejectedPromise: RSVP.Promise.reject(new Error('rejection')),
    anotherRejectedPromise: RSVP.Promise.reject(new Error('more rejection')),
  };

  RSVP.hashSettled(promises).then(function(hash){
    // hash here is an object that looks like:
    // {
    //   myPromise:              { state: 'fulfilled', value: 1 },
    //   rejectedPromise:        { state: 'rejected', reason: Error },
    //   anotherRejectedPromise: { state: 'rejected', reason: Error },
    // }
    // Note that for rejectedPromise, reason.message == 'rejection',
    // and for anotherRejectedPromise, reason.message == 'more rejection'.
  });
  ```

  An important note: `RSVP.hashSettled` is intended for plain JavaScript objects that
  are just a set of keys and values. `RSVP.hashSettled` will NOT preserve prototype
  chains.

  Example:

  ```javascript
  function MyConstructor(){
    this.example = RSVP.Promise.resolve('Example');
  }

  MyConstructor.prototype = {
    protoProperty: RSVP.Promise.resolve('Proto Property')
  };

  var myObject = new MyConstructor();

  RSVP.hashSettled(myObject).then(function(hash){
    // protoProperty will not be present, instead you will just have an
    // object that looks like:
    // {
    //   example: { state: 'fulfilled', value: 'Example' }
    // }
    //
    // hash.hasOwnProperty('protoProperty'); // false
    // 'undefined' === typeof hash.protoProperty
  });
  ```

  @method hashSettled
  @for RSVP
  @param {Object} promises
  @param {String} label optional string that describes the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when when all properties of `promises`
  have been settled.
  @static
*/
exports['default'] = function hashSettled(object, label) {
    return new HashSettled(Promise, object, label).promise;
};
},{"./enumerator":9,"./promise":18,"./promise-hash":17,"./utils":28}],13:[function(_dereq_,module,exports){
'use strict';
var Promise = _dereq_('./promise')['default'];
var PromiseHash = _dereq_('./promise-hash')['default'];
var ABORT_ON_REJECTION = _dereq_('./enumerator').ABORT_ON_REJECTION;
/**
  `RSVP.hash` is similar to `RSVP.all`, but takes an object instead of an array
  for its `promises` argument.

  Returns a promise that is fulfilled when all the given promises have been
  fulfilled, or rejected if any of them become rejected. The returned promise
  is fulfilled with a hash that has the same key names as the `promises` object
  argument. If any of the values in the object are not promises, they will
  simply be copied over to the fulfilled object.

  Example:

  ```javascript
  var promises = {
    myPromise: RSVP.resolve(1),
    yourPromise: RSVP.resolve(2),
    theirPromise: RSVP.resolve(3),
    notAPromise: 4
  };

  RSVP.hash(promises).then(function(hash){
    // hash here is an object that looks like:
    // {
    //   myPromise: 1,
    //   yourPromise: 2,
    //   theirPromise: 3,
    //   notAPromise: 4
    // }
  });
  ````

  If any of the `promises` given to `RSVP.hash` are rejected, the first promise
  that is rejected will be given as the reason to the rejection handler.

  Example:

  ```javascript
  var promises = {
    myPromise: RSVP.resolve(1),
    rejectedPromise: RSVP.reject(new Error("rejectedPromise")),
    anotherRejectedPromise: RSVP.reject(new Error("anotherRejectedPromise")),
  };

  RSVP.hash(promises).then(function(hash){
    // Code here never runs because there are rejected promises!
  }, function(reason) {
    // reason.message === "rejectedPromise"
  });
  ```

  An important note: `RSVP.hash` is intended for plain JavaScript objects that
  are just a set of keys and values. `RSVP.hash` will NOT preserve prototype
  chains.

  Example:

  ```javascript
  function MyConstructor(){
    this.example = RSVP.resolve("Example");
  }

  MyConstructor.prototype = {
    protoProperty: RSVP.resolve("Proto Property")
  };

  var myObject = new MyConstructor();

  RSVP.hash(myObject).then(function(hash){
    // protoProperty will not be present, instead you will just have an
    // object that looks like:
    // {
    //   example: "Example"
    // }
    //
    // hash.hasOwnProperty('protoProperty'); // false
    // 'undefined' === typeof hash.protoProperty
  });
  ```

  @method hash
  @static
  @for RSVP
  @param {Object} promises
  @param {String} label optional string that describes the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all properties of `promises`
  have been fulfilled, or rejected if any of them become rejected.
*/
exports['default'] = function hash(object, label) {
    return new PromiseHash(Promise, object, label).promise;
};
},{"./enumerator":9,"./promise":18,"./promise-hash":17}],14:[function(_dereq_,module,exports){
'use strict';
var config = _dereq_('./config').config;
var now = _dereq_('./utils').now;
var queue = [];
exports['default'] = function instrument(eventName, promise, child) {
    if (1 === queue.push({
            name: eventName,
            payload: {
                guid: promise._guidKey + promise._id,
                eventName: eventName,
                detail: promise._result,
                childGuid: child && promise._guidKey + child._id,
                label: promise._label,
                timeStamp: now(),
                stack: new Error(promise._label).stack
            }
        })) {
        setTimeout(function () {
            var entry;
            for (var i = 0; i < queue.length; i++) {
                entry = queue[i];
                config.trigger(entry.name, entry.payload);
            }
            queue.length = 0;
        }, 50);
    }
};
},{"./config":7,"./utils":28}],15:[function(_dereq_,module,exports){
'use strict';
var Promise = _dereq_('./promise')['default'];
var isArray = _dereq_('./utils').isArray;
var isFunction = _dereq_('./utils').isFunction;
/**
 `RSVP.map` is similar to JavaScript's native `map` method, except that it
  waits for all promises to become fulfilled before running the `mapFn` on
  each item in given to `promises`. `RSVP.map` returns a promise that will
  become fulfilled with the result of running `mapFn` on the values the promises
  become fulfilled with.

  For example:

  ```javascript

  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  var mapFn = function(item){
    return item + 1;
  };

  RSVP.map(promises, mapFn).then(function(result){
    // result is [ 2, 3, 4 ]
  });
  ```

  If any of the `promises` given to `RSVP.map` are rejected, the first promise
  that is rejected will be given as an argument to the returned promise's
  rejection handler. For example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  var mapFn = function(item){
    return item + 1;
  };

  RSVP.map(promises, mapFn).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(reason) {
    // reason.message === "2"
  });
  ```

  `RSVP.map` will also wait if a promise is returned from `mapFn`. For example,
  say you want to get all comments from a set of blog posts, but you need
  the blog posts first because they contain a url to those comments.

  ```javscript

  var mapFn = function(blogPost){
    // getComments does some ajax and returns an RSVP.Promise that is fulfilled
    // with some comments data
    return getComments(blogPost.comments_url);
  };

  // getBlogPosts does some ajax and returns an RSVP.Promise that is fulfilled
  // with some blog post data
  RSVP.map(getBlogPosts(), mapFn).then(function(comments){
    // comments is the result of asking the server for the comments
    // of all blog posts returned from getBlogPosts()
  });
  ```

  @method map
  @static
  @for RSVP
  @param {Array} promises
  @param {Function} mapFn function to be called on each fulfilled promise.
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled with the result of calling
  `mapFn` on each fulfilled promise or value when they become fulfilled.
   The promise will be rejected if any of the given `promises` become rejected.
  @static
*/
exports['default'] = function map(promises, mapFn, label) {
    return Promise.all(promises, label).then(function (values) {
        if (!isFunction(mapFn)) {
            throw new TypeError('You must pass a function as map\'s second argument.');
        }
        var length = values.length;
        var results = new Array(length);
        for (var i = 0; i < length; i++) {
            results[i] = mapFn(values[i]);
        }
        return Promise.all(results, label);
    });
};
},{"./promise":18,"./utils":28}],16:[function(_dereq_,module,exports){
'use strict';
/* global  arraySlice */
var Promise = _dereq_('./promise')['default'];
var isArray = _dereq_('./utils').isArray;
/**
  `RSVP.denodeify` takes a "node-style" function and returns a function that
  will return an `RSVP.Promise`. You can use `denodeify` in Node.js or the
  browser when you'd prefer to use promises over using callbacks. For example,
  `denodeify` transforms the following:

  ```javascript
  var fs = require('fs');

  fs.readFile('myfile.txt', function(err, data){
    if (err) return handleError(err);
    handleData(data);
  });
  ```

  into:

  ```javascript
  var fs = require('fs');
  var readFile = RSVP.denodeify(fs.readFile);

  readFile('myfile.txt').then(handleData, handleError);
  ```

  If the node function has multiple success parameters, then `denodeify`
  just returns the first one:

  ```javascript
  var request = RSVP.denodeify(require('request'));

  request('http://example.com').then(function(res) {
    // ...
  });
  ```

  However, if you need all success parameters, setting `denodeify`'s
  second parameter to `true` causes it to return all success parameters
  as an array:

  ```javascript
  var request = RSVP.denodeify(require('request'), true);

  request('http://example.com').then(function(result) {
    // result[0] -> res
    // result[1] -> body
  });
  ```

  Or if you pass it an array with names it returns the parameters as a hash:

  ```javascript
  var request = RSVP.denodeify(require('request'), ['res', 'body']);

  request('http://example.com').then(function(result) {
    // result.res
    // result.body
  });
  ```

  Sometimes you need to retain the `this`:

  ```javascript
  var app = require('express')();
  var render = RSVP.denodeify(app.render.bind(app));
  ```

  The denodified function inherits from the original function. It works in all
  environments, except IE 10 and below. Consequently all properties of the original
  function are available to you. However, any properties you change on the
  denodeified function won't be changed on the original function. Example:

  ```javascript
  var request = RSVP.denodeify(require('request')),
      cookieJar = request.jar(); // <- Inheritance is used here

  request('http://example.com', {jar: cookieJar}).then(function(res) {
    // cookieJar.cookies holds now the cookies returned by example.com
  });
  ```

  Using `denodeify` makes it easier to compose asynchronous operations instead
  of using callbacks. For example, instead of:

  ```javascript
  var fs = require('fs');

  fs.readFile('myfile.txt', function(err, data){
    if (err) { ... } // Handle error
    fs.writeFile('myfile2.txt', data, function(err){
      if (err) { ... } // Handle error
      console.log('done')
    });
  });
  ```

  you can chain the operations together using `then` from the returned promise:

  ```javascript
  var fs = require('fs');
  var readFile = RSVP.denodeify(fs.readFile);
  var writeFile = RSVP.denodeify(fs.writeFile);

  readFile('myfile.txt').then(function(data){
    return writeFile('myfile2.txt', data);
  }).then(function(){
    console.log('done')
  }).catch(function(error){
    // Handle error
  });
  ```

  @method denodeify
  @static
  @for RSVP
  @param {Function} nodeFunc a "node-style" function that takes a callback as
  its last argument. The callback expects an error to be passed as its first
  argument (if an error occurred, otherwise null), and the value from the
  operation as its second argument ("function(err, value){ }").
  @param {Boolean|Array} argumentNames An optional paramter that if set
  to `true` causes the promise to fulfill with the callback's success arguments
  as an array. This is useful if the node function has multiple success
  paramters. If you set this paramter to an array with names, the promise will
  fulfill with a hash with these names as keys and the success parameters as
  values.
  @return {Function} a function that wraps `nodeFunc` to return an
  `RSVP.Promise`
  @static
*/
exports['default'] = function denodeify(nodeFunc, argumentNames) {
    var asArray = argumentNames === true;
    var asHash = isArray(argumentNames);
    function denodeifiedFunction() {
        var length = arguments.length;
        var nodeArgs = new Array(length);
        for (var i = 0; i < length; i++) {
            nodeArgs[i] = arguments[i];
        }
        var thisArg;
        if (!asArray && !asHash && argumentNames) {
            if (typeof console === 'object') {
                console.warn('Deprecation: RSVP.denodeify() doesn\'t allow setting the ' + '"this" binding anymore. Use yourFunction.bind(yourThis) instead.');
            }
            thisArg = argumentNames;
        } else {
            thisArg = this;
        }
        return Promise.all(nodeArgs).then(function (nodeArgs$2) {
            return new Promise(resolver);
            // sweet.js has a bug, this resolver can't be defined in the constructor
            // or the arraySlice macro doesn't work
            function resolver(resolve, reject) {
                function callback() {
                    var length$2 = arguments.length;
                    var args = new Array(length$2);
                    for (var i$2 = 0; i$2 < length$2; i$2++) {
                        args[i$2] = arguments[i$2];
                    }
                    var error = args[0];
                    var value = args[1];
                    if (error) {
                        reject(error);
                    } else if (asArray) {
                        resolve(args.slice(1));
                    } else if (asHash) {
                        var obj = {};
                        var successArguments = args.slice(1);
                        var name;
                        var i$3;
                        for (i$3 = 0; i$3 < argumentNames.length; i$3++) {
                            name = argumentNames[i$3];
                            obj[name] = successArguments[i$3];
                        }
                        resolve(obj);
                    } else {
                        resolve(value);
                    }
                }
                nodeArgs$2.push(callback);
                nodeFunc.apply(thisArg, nodeArgs$2);
            }
        });
    }
    denodeifiedFunction.__proto__ = nodeFunc;
    return denodeifiedFunction;
};
},{"./promise":18,"./utils":28}],17:[function(_dereq_,module,exports){
'use strict';
var Enumerator = _dereq_('./enumerator')['default'];
var PENDING = _dereq_('./-internal').PENDING;
var FULFILLED = _dereq_('./-internal').FULFILLED;
var o_create = _dereq_('./utils').o_create;
function PromiseHash(Constructor, object, label) {
    this._superConstructor(Constructor, object, true, label);
}
exports['default'] = PromiseHash;
PromiseHash.prototype = o_create(Enumerator.prototype);
PromiseHash.prototype._superConstructor = Enumerator;
PromiseHash.prototype._init = function () {
    this._result = {};
};
PromiseHash.prototype._validateInput = function (input) {
    return input && typeof input === 'object';
};
PromiseHash.prototype._validationError = function () {
    return new Error('Promise.hash must be called with an object');
};
PromiseHash.prototype._enumerate = function () {
    var promise = this.promise;
    var input = this._input;
    var results = [];
    for (var key in input) {
        if (promise._state === PENDING && input.hasOwnProperty(key)) {
            results.push({
                position: key,
                entry: input[key]
            });
        }
    }
    var length = results.length;
    this._remaining = length;
    var result;
    for (var i = 0; promise._state === PENDING && i < length; i++) {
        result = results[i];
        this._eachEntry(result.entry, result.position);
    }
};
},{"./-internal":3,"./enumerator":9,"./utils":28}],18:[function(_dereq_,module,exports){
'use strict';
var config = _dereq_('./config').config;
var EventTarget = _dereq_('./events')['default'];
var instrument = _dereq_('./instrument')['default'];
var objectOrFunction = _dereq_('./utils').objectOrFunction;
var isFunction = _dereq_('./utils').isFunction;
var now = _dereq_('./utils').now;
var noop = _dereq_('./-internal').noop;
var resolve = _dereq_('./-internal').resolve;
var reject = _dereq_('./-internal').reject;
var fulfill = _dereq_('./-internal').fulfill;
var subscribe = _dereq_('./-internal').subscribe;
var initializePromise = _dereq_('./-internal').initializePromise;
var invokeCallback = _dereq_('./-internal').invokeCallback;
var FULFILLED = _dereq_('./-internal').FULFILLED;
var REJECTED = _dereq_('./-internal').REJECTED;
var cast = _dereq_('./promise/cast')['default'];
var all = _dereq_('./promise/all')['default'];
var race = _dereq_('./promise/race')['default'];
var Resolve = _dereq_('./promise/resolve')['default'];
var Reject = _dereq_('./promise/reject')['default'];
var guidKey = 'rsvp_' + now() + '-';
var counter = 0;
function needsResolver() {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}
function needsNew() {
    throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');
}
exports['default'] = Promise;
/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise’s eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  var promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      var xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error("getJSON: `" + url + "` failed with status: [" + this.status + "]"));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class RSVP.Promise
  @param {function} resolver
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @constructor
*/
function Promise(resolver, label) {
    this._id = counter++;
    this._label = label;
    this._subscribers = [];
    if (config.instrument) {
        instrument('created', this);
    }
    if (noop !== resolver) {
        if (!isFunction(resolver)) {
            needsResolver();
        }
        if (!(this instanceof Promise)) {
            needsNew();
        }
        initializePromise(this, resolver);
    }
}
Promise.cast = cast;
Promise.all = all;
Promise.race = race;
Promise.resolve = Resolve;
Promise.reject = Reject;
Promise.prototype = {
    constructor: Promise,
    _id: undefined,
    _guidKey: guidKey,
    _label: undefined,
    _state: undefined,
    _result: undefined,
    _subscribers: undefined,
    _onerror: function (reason) {
        config.trigger('error', reason);
    },
    then: function (onFulfillment, onRejection, label) {
        var parent = this;
        var state = parent._state;
        if (state === FULFILLED && !onFulfillment || state === REJECTED && !onRejection) {
            if (config.instrument) {
                instrument('chained', this, this);
            }
            return this;
        }
        parent._onerror = null;
        var child = new this.constructor(noop, label);
        var result = parent._result;
        if (config.instrument) {
            instrument('chained', parent, child);
        }
        if (state) {
            var callback = arguments[state - 1];
            config.async(function () {
                invokeCallback(state, child, callback, result);
            });
        } else {
            subscribe(parent, child, onFulfillment, onRejection);
        }
        return child;
    },
    'catch': function (onRejection, label) {
        return this.then(null, onRejection, label);
    },
    'finally': function (callback, label) {
        var constructor = this.constructor;
        return this.then(function (value) {
            return constructor.resolve(callback()).then(function () {
                return value;
            });
        }, function (reason) {
            return constructor.resolve(callback()).then(function () {
                throw reason;
            });
        }, label);
    }
};
},{"./-internal":3,"./config":7,"./events":10,"./instrument":14,"./promise/all":19,"./promise/cast":20,"./promise/race":21,"./promise/reject":22,"./promise/resolve":23,"./utils":28}],19:[function(_dereq_,module,exports){
'use strict';
var Enumerator = _dereq_('../enumerator')['default'];
/**
  `RSVP.Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  RSVP.Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `RSVP.all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
exports['default'] = function all(entries, label) {
    return new Enumerator(this, entries, true, label).promise;
};
},{"../enumerator":9}],20:[function(_dereq_,module,exports){
'use strict';
var resolve = _dereq_('./resolve')['default'];
/**
  @deprecated

  `RSVP.Promise.cast` coerces its argument to a promise, or returns the
  argument if it is already a promise which shares a constructor with the caster.

  Example:

  ```javascript
  var promise = RSVP.Promise.resolve(1);
  var casted = RSVP.Promise.cast(promise);

  console.log(promise === casted); // true
  ```

  In the case of a promise whose constructor does not match, it is assimilated.
  The resulting promise will fulfill or reject based on the outcome of the
  promise being casted.

  Example:

  ```javascript
  var thennable = $.getJSON('/api/foo');
  var casted = RSVP.Promise.cast(thennable);

  console.log(thennable === casted); // false
  console.log(casted instanceof RSVP.Promise) // true

  casted.then(function(data) {
    // data is the value getJSON fulfills with
  });
  ```

  In the case of a non-promise, a promise which will fulfill with that value is
  returned.

  Example:

  ```javascript
  var value = 1; // could be a number, boolean, string, undefined...
  var casted = RSVP.Promise.cast(value);

  console.log(value === casted); // false
  console.log(casted instanceof RSVP.Promise) // true

  casted.then(function(val) {
    val === value // => true
  });
  ```

  `RSVP.Promise.cast` is similar to `RSVP.Promise.resolve`, but `RSVP.Promise.cast` differs in the
  following ways:

  * `RSVP.Promise.cast` serves as a memory-efficient way of getting a promise, when you
  have something that could either be a promise or a value. RSVP.resolve
  will have the same effect but will create a new promise wrapper if the
  argument is a promise.
  * `RSVP.Promise.cast` is a way of casting incoming thenables or promise subclasses to
  promises of the exact class specified, so that the resulting object's `then` is
  ensured to have the behavior of the constructor you are calling cast on (i.e., RSVP.Promise).

  @method cast
  @static
  @param {Object} object to be casted
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise
*/
exports['default'] = resolve;
},{"./resolve":23}],21:[function(_dereq_,module,exports){
'use strict';
var isArray = _dereq_('../utils').isArray;
var isFunction = _dereq_('../utils').isFunction;
var isMaybeThenable = _dereq_('../utils').isMaybeThenable;
var noop = _dereq_('../-internal').noop;
var resolve = _dereq_('../-internal').resolve;
var reject = _dereq_('../-internal').reject;
var subscribe = _dereq_('../-internal').subscribe;
var PENDING = _dereq_('../-internal').PENDING;
/**
  `RSVP.Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 2");
    }, 100);
  });

  RSVP.Promise.race([promise1, promise2]).then(function(result){
    // result === "promise 2" because it was resolved before promise1
    // was resolved.
  });
  ```

  `RSVP.Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error("promise 2"));
    }, 100);
  });

  RSVP.Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === "promise 2" because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  RSVP.Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  @param {String} label optional string for describing the promise returned.
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
exports['default'] = function race(entries, label) {
    /*jshint validthis:true */
    var Constructor = this, entry;
    var promise = new Constructor(noop, label);
    if (!isArray(entries)) {
        reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
    }
    var length = entries.length;
    function onFulfillment(value) {
        resolve(promise, value);
    }
    function onRejection(reason) {
        reject(promise, reason);
    }
    for (var i = 0; promise._state === PENDING && i < length; i++) {
        subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
    }
    return promise;
};
},{"../-internal":3,"../utils":28}],22:[function(_dereq_,module,exports){
'use strict';
var noop = _dereq_('../-internal').noop;
var _reject = _dereq_('../-internal').reject;
/**
  `RSVP.Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
exports['default'] = function reject(reason, label) {
    /*jshint validthis:true */
    var Constructor = this;
    var promise = new Constructor(noop, label);
    _reject(promise, reason);
    return promise;
};
},{"../-internal":3}],23:[function(_dereq_,module,exports){
'use strict';
var noop = _dereq_('../-internal').noop;
var _resolve = _dereq_('../-internal').resolve;
/**
  `RSVP.Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
exports['default'] = function resolve(object, label) {
    /*jshint validthis:true */
    var Constructor = this;
    if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
    }
    var promise = new Constructor(noop, label);
    _resolve(promise, object);
    return promise;
};
},{"../-internal":3}],24:[function(_dereq_,module,exports){
'use strict';
var Promise = _dereq_('./promise')['default'];
/**
  This is a convenient alias for `RSVP.Promise.race`.

  @method race
  @static
  @for RSVP
  @param {Array} array Array of promises.
  @param {String} label An optional label. This is useful
  for tooling.
 */
exports['default'] = function race(array, label) {
    return Promise.race(array, label);
};
},{"./promise":18}],25:[function(_dereq_,module,exports){
'use strict';
var Promise = _dereq_('./promise')['default'];
/**
  This is a convenient alias for `RSVP.Promise.reject`.

  @method reject
  @static
  @for RSVP
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
exports['default'] = function reject(reason, label) {
    return Promise.reject(reason, label);
};
},{"./promise":18}],26:[function(_dereq_,module,exports){
'use strict';
var Promise = _dereq_('./promise')['default'];
/**
  This is a convenient alias for `RSVP.Promise.resolve`.

  @method resolve
  @static
  @for RSVP
  @param {Any} value value that the returned promise will be resolved with
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
exports['default'] = function resolve(value, label) {
    return Promise.resolve(value, label);
};
},{"./promise":18}],27:[function(_dereq_,module,exports){
'use strict';
/**
  `RSVP.rethrow` will rethrow an error on the next turn of the JavaScript event
  loop in order to aid debugging.

  Promises A+ specifies that any exceptions that occur with a promise must be
  caught by the promises implementation and bubbled to the last handler. For
  this reason, it is recommended that you always specify a second rejection
  handler function to `then`. However, `RSVP.rethrow` will throw the exception
  outside of the promise, so it bubbles up to your console if in the browser,
  or domain/cause uncaught exception in Node. `rethrow` will also throw the
  error again so the error can be handled by the promise per the spec.

  ```javascript
  function throws(){
    throw new Error('Whoops!');
  }

  var promise = new RSVP.Promise(function(resolve, reject){
    throws();
  });

  promise.catch(RSVP.rethrow).then(function(){
    // Code here doesn't run because the promise became rejected due to an
    // error!
  }, function (err){
    // handle the error here
  });
  ```

  The 'Whoops' error will be thrown on the next turn of the event loop
  and you can watch for it in your console. You can also handle it using a
  rejection handler given to `.then` or `.catch` on the returned promise.

  @method rethrow
  @static
  @for RSVP
  @param {Error} reason reason the promise became rejected.
  @throws Error
  @static
*/
exports['default'] = function rethrow(reason) {
    setTimeout(function () {
        throw reason;
    });
    throw reason;
};
},{}],28:[function(_dereq_,module,exports){
'use strict';
function objectOrFunction(x) {
    return typeof x === 'function' || typeof x === 'object' && x !== null;
}
exports.objectOrFunction = objectOrFunction;
function isFunction(x) {
    return typeof x === 'function';
}
exports.isFunction = isFunction;
function isMaybeThenable(x) {
    return typeof x === 'object' && x !== null;
}
exports.isMaybeThenable = isMaybeThenable;
var _isArray;
if (!Array.isArray) {
    _isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
    };
} else {
    _isArray = Array.isArray;
}
var isArray = _isArray;
exports.isArray = isArray;
// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
var now = Date.now || function () {
        return new Date().getTime();
    };
exports.now = now;
var o_create = Object.create || function (object) {
        var o = function () {
        };
        o.prototype = object;
        return o;
    };
exports.o_create = o_create;
},{}],29:[function(_dereq_,module,exports){
var batchTransitions;
var RSVP = _dereq_('rsvp');
var prefixer = _dereq_('./prefixer');

function parsePropertiesForTransition(el) {
  var styles = window.getComputedStyle(el);
  var transitions = styles[prefixer.getTransition() + 'Property'].split(',');

  return transitions.map(function (transition) {
    return transition.split(' ')[0];
  });
}

function batchTransitions(el, options) {
  var transitions = parsePropertiesForTransition(el);
  var endEvent = prefixer.getTransitionEnd();
  var returnSteps = typeof options.stepped === 'function';
  var batch = 0;

  var promise = new RSVP.Promise(function (resolve, reject) {
    function handleTransitionEnd(event) {
      batch++;

      if (returnSteps) {
        options.stepped(event);
      }

      if (batch === transitions.length) {
        complete();
      }
    }

    function complete() {
      detachListener();

      requestAnimationFrame(function () {
        resolve();
      });
    }

    function detachListener() {
      el.removeEventListener(endEvent, handleTransitionEnd);
    }

    el.addEventListener(endEvent, handleTransitionEnd);
    el.classList.toggle(options.className);
  });

  return promise;
}

module.exports = batchTransitions;

},{"./prefixer":30,"rsvp":2}],30:[function(_dereq_,module,exports){
// http://davidwalsh.name/vendor-prefix
var prefix = (function () {

  var pre, dom;
  var styles = window.getComputedStyle(document.documentElement, '');

  pre = [].slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']);
  pre = pre[1];

  dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

  return {
    dom: dom,
    lowercase: pre,
    css: '-' + pre + '-',
    js: pre[0].toUpperCase() + pre.substr(1)
  };
})();

function getTransition() {
  return prefix.lowercase + 'Transition';
}

function getTransitionEnd() {
  return prefix.lowercase + 'TransitionEnd';
}

module.exports = {
  getTransition: getTransition,
  getTransitionEnd: getTransitionEnd
};

},{}]},{},[29])
(29)
});