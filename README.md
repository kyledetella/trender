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
  trender(document.getElementById('my-el'), {
    className: 'run',
    callback: function () {
      //...
    }
  });
```

trender supports [modern browsers](http://caniuse.com/#feat=css-transitions). If you need to support animations for legacy browsers and run an operation upon their completion, a library such as jQuery is your best bet. Using a library such as [Modernizr](http://modernizr.com) for feature detection will help you to make decisions as to which method is preferred.

```javascript
if (Modernizr.csstransition) {
  trender(el, opts);
} else {
  $(el).animate(props, duration, callback);
}
```

## Options
- `className`: _String_ to add/remove class from element
- `callback`: _Function_ callback that will execute when all transitions have resolved.
- `stepper`: _Function_ callback that will execute per transition end
