(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global requestAnimationFrame: true */

"use strict";

var batchTransitions;
var prefixer = require("./prefixer");

require("./raf");

function parsePropertiesForTransition(el) {
  var styles = window.getComputedStyle(el);
  var transitions = styles[prefixer.getTransition() + "Property"].split(",");

  return transitions.map(function (transition) {
    return transition.split(" ")[0];
  });
}

function batchTransitions(el, options) {
  var transitions = parsePropertiesForTransition(el);
  var endEvent = prefixer.getTransitionEnd();
  var returnSteps = typeof options.stepped === "function";
  var batch = 0;

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

    if (typeof options.callback === "function") {
      requestAnimationFrame(function () {
        options.callback();
      });
    }
  }

  function detachListener() {
    el.removeEventListener(endEvent, handleTransitionEnd);
  }

  el.addEventListener(endEvent, handleTransitionEnd);
  el.classList.toggle(options.className);
}

module.exports = batchTransitions;

},{"./prefixer":2,"./raf":3}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
"use strict";

var rAf, cAf;
var lastTime = 0;
var vendors = ["ms", "moz", "webkit", "o"];

for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
  window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"];
  window.cancelAnimationFrame = window[vendors[x] + "CancelAnimationFrame"] || window[vendors[x] + "CancelRequestAnimationFrame"];
}

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function (callback, element) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = window.setTimeout(function () {
      callback(currTime + timeToCall);
    }, timeToCall);

    lastTime = currTime + timeToCall;
    return id;
  };
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function (id) {
    clearTimeout(id);
  };
}

},{}]},{},[1]);
