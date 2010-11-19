# MobiFlex Mobile UI Un-framework

	                          _|        _|      _|_|  _|                    
	_|_|_|  _|_|      _|_|    _|_|_|          _|      _|    _|_|    _|    _|
	_|    _|    _|  _|    _|  _|    _|  _|  _|_|_|_|  _|  _|_|_|_|    _|_|    
	_|    _|    _|  _|    _|  _|    _|  _|    _|      _|  _|        _|    _|  
	_|    _|    _|    _|_|    _|_|_|    _|    _|      _|    _|_|_|  _|    _|

Right at this moment, we have a lot of mobile UI frameworks that are hitting the mobile scene and while a lot of them are very good, they do carry a bit of extra weight in a world where 'being light' is very important.  MobiFlex is a response to that and delivers just the core elements of what is required to build a cross-device mobile application.

## About Mobiflex

### Requirements

While it won't be to everybody's tastes, MobiFlex requires either [jQuery](http://jquery.com) or [zepto](https://github.com/madrobby/zepto) for the Javascript it writes.  I'm not sorry.

### Plays Nice With

- [iScroll](http://cubiq.org/iscroll) - if you have `iScroll.js` included then elements with the `mf-scroll` class will use iScroll to handle overflow regions nicely.

### Acknowledgments

- Includes some sweet CSS3 gradients that mimic iOS tab bar highlights. Put together by [@jordandobson](http://jordandobson.com/) - the original source comes from [here](http://jordandobson.com/webkit_tab_bar_gradients/)

### It's a start

There will definitely be room for improvement in what is presented here.  There will be opportunities to replace javascript with pure CSS implementations, etc, and please if you have skills in that area - feel free to fork mobiflex and I'll happily merge improvements back in. 

## Using Mobiflex

### Setting Mobiflex Options

	MOBIFLEX.opt({
		pagePath: 'set page path', // default = ''
		pageExt: 'set page ext', // default = html,
		ajaxLoad: true/false // default = true
	});
	
### Mobiflex Events

Mobiflex uses jQuery style events and provides events on both the MOBIFLEX module for general notifications and also on page level elements.

The global MOBIFLEX events are:

- `pageCreate(evt, pageId)`
- `pageChanging(evt, newId, oldId)`

The page element (children of an mf-pager) events are:

- `pageActivate(evt)`
- `pageDeactivate(evt)`

## Links of Interest

- [Using Mobiflex](http://sidelab.github.com/mobiflex/using.html)
- [Mobiflex Layouts](http://sidelab.github.com/mobiflex/layouts.html)

## Current Limitations

- Display of navigation menu image masks requires that image masks to be 
  the same size as the image size (which by default is 28px).

- Ajax page loading only supported with jQuery and not Zepto as we need to be 
  able to detect a failure condition, and without the **ajax()** method we
  unable to do this.