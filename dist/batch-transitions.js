!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.batchTransitions=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var batchTransitions;
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

    if (typeof options.callback === 'function') {
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

},{"./prefixer":2}],2:[function(_dereq_,module,exports){
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

},{}]},{},[1])
(1)
});