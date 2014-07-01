var batchTransitions;
var RSVP = require('rsvp');
var prefixer = require('./prefixer');

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
