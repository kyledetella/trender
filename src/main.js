var batchTransitions;
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
