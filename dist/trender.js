(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Trender = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var isFunction = require("amp-is-function");
var prefixer = require("./prefixer");
var END_EVENT = prefixer.getTransitionEnd();

require("raf");

function noop() {}

function parsePropertiesForTransition(el) {
  var styles = window.getComputedStyle(el);
  var transitions = styles[prefixer.getTransition() + "Property"].split(",");

  return transitions.map(function (transition) {
    return transition.trim();
  });
}

function Trender(options) {
  this.consumerOnTransitionsCompleteCallback = noop;
  this.consumerOnEachTransitionEnd = noop;
  this.batch = 0;

  this.element = options.el;
  this.className = options.className;
  this.transitions = parsePropertiesForTransition(this.element);

  this.trigger = this.trigger.bind(this);
  this.transitionEndHandler = this.handleTransitionEnd.bind(this);
}

Trender.prototype.attachEvents = function () {
  this.element.addEventListener(END_EVENT, this.transitionEndHandler);
};

Trender.prototype.detachEvents = function () {
  this.element.removeEventListener(END_EVENT, this.transitionEndHandler);
};

Trender.prototype.handleTransitionEnd = function (event) {
  this.batch++;

  this.consumerOnEachTransitionEnd({ originalEvent: event });

  if (this.batch === this.transitions.length) {
    this.complete();
  }
};

Trender.prototype.complete = function () {
  this.detachEvents();
  this.batch = 0;

  requestAnimationFrame((function () {
    this.consumerOnTransitionsCompleteCallback();
  }).bind(this));
};

Trender.prototype.onTransitionsComplete = function (cb) {
  if (!isFunction(cb)) {
    console.warn("onTransitionsComplete expects a callback function!");
  }
  this.consumerOnTransitionsCompleteCallback = cb;
};

Trender.prototype.onEachTransitionEnd = function (cb) {
  if (!isFunction(cb)) {
    console.warn("onEachTransitionEnd expects a callback function!");
  }

  this.consumerOnEachTransitionEnd = cb;
};

Trender.prototype.trigger = function () {
  this.attachEvents();
  this.element.classList.toggle(this.className);
};

module.exports = Trender;

},{"./prefixer":6,"amp-is-function":2,"raf":4}],2:[function(require,module,exports){
var toString = Object.prototype.toString;
var func = function isFunction(obj) {
    return toString.call(obj) === '[object Function]';
};

// Optimize `isFunction` if appropriate. Work around an IE 11 bug.
if (typeof /./ !== 'function') {
    func = function isFunction(obj) {
      return typeof obj == 'function' || false;
    };
}

module.exports = func;

},{}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

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
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
var now = require('performance-now')
  , global = typeof window === 'undefined' ? {} : window
  , vendors = ['moz', 'webkit']
  , suffix = 'AnimationFrame'
  , raf = global['request' + suffix]
  , caf = global['cancel' + suffix] || global['cancelRequest' + suffix]
  , isNative = true

for(var i = 0; i < vendors.length && !raf; i++) {
  raf = global[vendors[i] + 'Request' + suffix]
  caf = global[vendors[i] + 'Cancel' + suffix]
      || global[vendors[i] + 'CancelRequest' + suffix]
}

// Some versions of FF have rAF but not cAF
if(!raf || !caf) {
  isNative = false

  var last = 0
    , id = 0
    , queue = []
    , frameDuration = 1000 / 60

  raf = function(callback) {
    if(queue.length === 0) {
      var _now = now()
        , next = Math.max(0, frameDuration - (_now - last))
      last = next + _now
      setTimeout(function() {
        var cp = queue.slice(0)
        // Clear queue here to prevent
        // callbacks from appending listeners
        // to the current frame's queue
        queue.length = 0
        for(var i = 0; i < cp.length; i++) {
          if(!cp[i].cancelled) {
            try{
              cp[i].callback(last)
            } catch(e) {
              setTimeout(function() { throw e }, 0)
            }
          }
        }
      }, Math.round(next))
    }
    queue.push({
      handle: ++id,
      callback: callback,
      cancelled: false
    })
    return id
  }

  caf = function(handle) {
    for(var i = 0; i < queue.length; i++) {
      if(queue[i].handle === handle) {
        queue[i].cancelled = true
      }
    }
  }
}

module.exports = function(fn) {
  // Wrap in a new function to prevent
  // `cancel` potentially being assigned
  // to the native rAF function
  if(!isNative) {
    return raf.call(global, fn)
  }
  return raf.call(global, function() {
    try{
      fn.apply(this, arguments)
    } catch(e) {
      setTimeout(function() { throw e }, 0)
    }
  })
}
module.exports.cancel = function() {
  caf.apply(global, arguments)
}

},{"performance-now":5}],5:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.6.3
(function() {
  var getNanoSeconds, hrtime, loadTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - loadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    loadTime = getNanoSeconds();
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);

/*
//@ sourceMappingURL=performance-now.map
*/

}).call(this,require('_process'))
},{"_process":3}],6:[function(require,module,exports){
// http://davidwalsh.name/vendor-prefix
"use strict";

var prefix = (function () {

  var pre, dom;
  var styles = window.getComputedStyle(document.documentElement, "");

  pre = [].slice.call(styles).join("").match(/-(moz|webkit|ms)-/) || styles.OLink === "" && ["", "o"];
  pre = pre[1];

  dom = "WebKit|Moz|MS|O".match(new RegExp("(" + pre + ")", "i"))[1];

  return {
    dom: dom,
    lowercase: pre,
    css: "-" + pre + "-",
    js: pre[0].toUpperCase() + pre.substr(1)
  };
})();

function getTransition() {
  return prefix.lowercase + "Transition";
}

function getTransitionEnd() {
  return prefix.lowercase + "TransitionEnd";
}

module.exports = {
  getTransition: getTransition,
  getTransitionEnd: getTransitionEnd
};

},{}]},{},[1])(1)
});