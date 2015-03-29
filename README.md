Trender
=======
**WIP**

Batch css transition end events.

## Installation
`npm install trender`

## Usage
Add transition properties to your element(s) and provide a class selector under which your transition will run.

```css
  #the-trender {
    width: 80px;
    height: 80px;
    background-color: tomato;
    -webkit-transform: translateX(0);
    -moz-transform: translateX(0);
    transform: translateX(0);

    -webkit-transition: -webkit-transform 380ms cubic-bezier(0.175, 0.885, 0.320, 1.275), background-color 380ms linear;
    -moz-transition: transform 380ms cubic-bezier(0.175, 0.885, 0.320, 1.275), background-color 380ms linear;
    transition: transform 380ms cubic-bezier(0.175, 0.885, 0.320, 1.275), background-color 380ms linear;
  }

  #the-trender.run {
    background-color: royalblue;
    -webkit-transform: translateX(100px);
    -moz-transform: translateX(100px);
    transform: translateX(100px);
  }
```

`trender` expects a DOM node and an options object

```javascript
var trender = new Trender({
  el: document.getElementById('my-el'),
  {className: 'run'}
});

trender.onTransitionsComplete(function () {
  // all transitions have resolved
});

trender.onEachTransitionEnd(function () {
  // fired for each transitionend
});

trender.trigger();
```

trender supports [modern browsers](http://caniuse.com/#feat=css-transitions). If you need to support animations for legacy browsers and run an operation upon their completion, a library such as jQuery is your best bet. Using a library such as [Modernizr](http://modernizr.com) for feature detection will help you to make decisions as to which method is preferred.

```javascript
if (Modernizr.csstransition) {
  var trender = new Trender(el, opts);
} else {
  $(el).animate(props, duration, callback);
}
```

## Options

| Key | Type | Description |
| --- | ---- | ----- |
| `className` | `String` | A class against which you have styled your CSS transitions |

## Hooks

| Name  | Arguments | Description |
| ------------- | ------------- | ------------- |
| `onTransitionsComplete`  | `Function`  | Callback to be invoked when all transitions have ended |
| `onEachTransitionEnd`  | `Function`  | Callback to be invoked when each transition type ends |
| `trigger` | `null` | Toggles instance `className` to invoke transition sequences |
