'use strict';

var isFunction = require('amp-is-function');
var prefixer = require('./prefixer');
var END_EVENT = prefixer.getTransitionEnd();

require('raf');

function noop() {}

function parsePropertiesForTransition(el) {
  var styles = window.getComputedStyle(el);
  var transitions = styles[prefixer.getTransition() + 'Property'].split(',');

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

  this.consumerOnEachTransitionEnd({originalEvent: event});

  if (this.batch === this.transitions.length) {
    this.complete();
  }
};

Trender.prototype.complete = function () {
  this.detachEvents();
  this.batch = 0;

  requestAnimationFrame(function () {
    this.consumerOnTransitionsCompleteCallback();
  }.bind(this));
};

Trender.prototype.onTransitionsComplete = function (cb) {
  if (!isFunction(cb)) {
    console.warn('onTransitionsComplete expects a callback function!');
  }
  this.consumerOnTransitionsCompleteCallback = cb;
};

Trender.prototype.onEachTransitionEnd = function (cb) {
  if (!isFunction(cb)) {
    console.warn('onEachTransitionEnd expects a callback function!');
  }

  this.consumerOnEachTransitionEnd = cb;
};

Trender.prototype.trigger = function () {
  this.attachEvents();
  this.element.classList.toggle(this.className);
};

module.exports = Trender;
