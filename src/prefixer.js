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
