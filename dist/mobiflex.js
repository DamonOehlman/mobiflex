MOBIFLEX = (function() {
    // ┌──────────────────────────────────────────────────────────────────────────────────────┐ \\
    // │ Eve 0.3.2 - JavaScript Events Library                                                │ \\
    // ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
    // │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)          │ \\
    // │ Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license. │ \\
    // └──────────────────────────────────────────────────────────────────────────────────────┘ \\
    
    (function (glob) {
        var version = "0.3.2",
            has = "hasOwnProperty",
            separator = /[\.\/]/,
            wildcard = "*",
            fun = function () {},
            numsort = function (a, b) {
                return a - b;
            },
            current_event,
            stop,
            events = {n: {}},
        /*\
         * eve
         [ method ]
         **
         * Fires event with given `name`, given scope and other parameters.
         **
         > Arguments
         **
         - name (string) name of the event, dot (`.`) or slash (`/`) separated
         - scope (object) context for the event handlers
         - varargs (...) the rest of arguments will be sent to event handlers
         **
         = (object) array of returned values from the listeners
        \*/
            eve = function (name, scope) {
                var e = events,
                    oldstop = stop,
                    args = Array.prototype.slice.call(arguments, 2),
                    listeners = eve.listeners(name),
                    z = 0,
                    f = false,
                    l,
                    indexed = [],
                    queue = {},
                    out = [],
                    errors = [];
                current_event = name;
                stop = 0;
                for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                    indexed.push(listeners[i].zIndex);
                    if (listeners[i].zIndex < 0) {
                        queue[listeners[i].zIndex] = listeners[i];
                    }
                }
                indexed.sort(numsort);
                while (indexed[z] < 0) {
                    l = queue[indexed[z++]];
                    out.push(l.apply(scope, args));
                    if (stop) {
                        stop = oldstop;
                        return out;
                    }
                }
                for (i = 0; i < ii; i++) {
                    l = listeners[i];
                    if ("zIndex" in l) {
                        if (l.zIndex == indexed[z]) {
                            out.push(l.apply(scope, args));
                            if (stop) {
                                stop = oldstop;
                                return out;
                            }
                            do {
                                z++;
                                l = queue[indexed[z]];
                                l && out.push(l.apply(scope, args));
                                if (stop) {
                                    stop = oldstop;
                                    return out;
                                }
                            } while (l)
                        } else {
                            queue[l.zIndex] = l;
                        }
                    } else {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            stop = oldstop;
                            return out;
                        }
                    }
                }
                stop = oldstop;
                return out.length ? out : null;
            };
        /*\
         * eve.listeners
         [ method ]
         **
         * Internal method which gives you array of all event handlers that will be triggered by the given `name`.
         **
         > Arguments
         **
         - name (string) name of the event, dot (`.`) or slash (`/`) separated
         **
         = (array) array of event handlers
        \*/
        eve.listeners = function (name) {
            var names = name.split(separator),
                e = events,
                item,
                items,
                k,
                i,
                ii,
                j,
                jj,
                nes,
                es = [e],
                out = [];
            for (i = 0, ii = names.length; i < ii; i++) {
                nes = [];
                for (j = 0, jj = es.length; j < jj; j++) {
                    e = es[j].n;
                    items = [e[names[i]], e[wildcard]];
                    k = 2;
                    while (k--) {
                        item = items[k];
                        if (item) {
                            nes.push(item);
                            out = out.concat(item.f || []);
                        }
                    }
                }
                es = nes;
            }
            return out;
        };
        
        /*\
         * eve.on
         [ method ]
         **
         * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
         | eve.on("*.under.*", f);
         | eve("mouse.under.floor"); // triggers f
         * Use @eve to trigger the listener.
         **
         > Arguments
         **
         - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
         - f (function) event handler function
         **
         = (function) returned function accept one number parameter that represents z-index of the handler. It is optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment. 
         > Example:
         | eve.on("mouse", eat)(2);
         | eve.on("mouse", scream);
         | eve.on("mouse", catch)(1);
         * This will ensure that `catch` function will be called before `eat`.
         * If you want to put you hadler before not indexed handlers specify negative value.
         * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
        \*/
        eve.on = function (name, f) {
            var names = name.split(separator),
                e = events;
            for (var i = 0, ii = names.length; i < ii; i++) {
                e = e.n;
                !e[names[i]] && (e[names[i]] = {n: {}});
                e = e[names[i]];
            }
            e.f = e.f || [];
            for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
                return fun;
            }
            e.f.push(f);
            return function (zIndex) {
                if (+zIndex == +zIndex) {
                    f.zIndex = +zIndex;
                }
            };
        };
        /*\
         * eve.stop
         [ method ]
         **
         * Is used inside event handler to stop event
        \*/
        eve.stop = function () {
            stop = 1;
        };
        /*\
         * eve.nt
         [ method ]
         **
         * Could be used inside event handler to figure out actual name of the event.
         **
         > Arguments
         **
         - subname (string) #optional subname of the event
         **
         = (string) name of the event, if `subname` is not specified
         * or
         = (boolean) `true`, if current event’s name contains `subname`
        \*/
        eve.nt = function (subname) {
            if (subname) {
                return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
            }
            return current_event;
        };
        /*\
         * eve.unbind
         [ method ]
         **
         * Removes given function from the list of event listeners assigned to given name.
         **
         > Arguments
         **
         - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
         - f (function) event handler function
        \*/
        eve.unbind = function (name, f) {
            var names = name.split(separator),
                e,
                key,
                splice,
                cur = [events];
            for (var i = 0, ii = names.length; i < ii; i++) {
                for (var j = 0; j < cur.length; j += splice.length - 2) {
                    splice = [j, 1];
                    e = cur[j].n;
                    if (names[i] != wildcard) {
                        if (e[names[i]]) {
                            splice.push(e[names[i]]);
                        }
                    } else {
                        for (key in e) if (e[has](key)) {
                            splice.push(e[key]);
                        }
                    }
                    cur.splice.apply(cur, splice);
                }
            }
            for (i = 0, ii = cur.length; i < ii; i++) {
                e = cur[i];
                while (e.n) {
                    if (f) {
                        if (e.f) {
                            for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                                e.f.splice(j, 1);
                                break;
                            }
                            !e.f.length && delete e.f;
                        }
                        for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                            var funcs = e.n[key].f;
                            for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                                funcs.splice(j, 1);
                                break;
                            }
                            !funcs.length && delete e.n[key].f;
                        }
                    } else {
                        delete e.f;
                        for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                            delete e.n[key].f;
                        }
                    }
                    e = e.n;
                }
            }
        };
        /*\
         * eve.version
         [ property (string) ]
         **
         * Current version of the library.
        \*/
        eve.version = version;
        eve.toString = function () {
            return "You are running Eve " + version;
        };
        (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (glob.eve = eve);
    })(this);

    
    // initialise constants
    // empty image converted using http://www.motobit.com/util/base64-decoder-encoder.asp
    var EMPTY_IMAGE = 'R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
        
    
    // initialise variables
    var currentPage = '',
        hashChangeEvent = 'onhashchange' in window,
        scrollers = {},
        pageStack = [],
        changeInProgress = false,
        queued = null,
        options = {
            autoInit: true,
            createContainers: true,
            iScroll: true,
            pagePath: '',
            pageExt: '.html',
            startScreen: null,
            transition: 'slide'
        },
        
        // capability checks
        capsAnimationEvents = (typeof WebKitAnimationEvent !== 'undefined');
        
    /* internal types */
    
    /* internal functions */
    
    function activatePage(pager, hashedPageId, callback, transition, reverse) {
        var activating = pager.find(hashedPageId),
            animate = capsAnimationEvents && transition && activating[0];
        
        // refresh the page
        refreshPage(hashedPageId);

        if (animate) {
            activating
                .bind('webkitAnimationEnd', function(evt) {
                    // debug('animation end');
                    activating
                        .removeClass('animating')
                        .css('-webkit-animation-name', null)
                        .unbind('webkitAnimationEnd');
                        
                    if (callback) {
                        callback();
                    } // if
                })
                .addClass('animating')
                .css('-webkit-animation-name', transition + (reverse ? 'Reverse' : '') + 'In');
        } // if

        // activate the new page
        activating
            .addClass('current')
            .trigger('pageActivate', hashedPageId);
            
        // now clear the referrer
        activating.data('referrer', null);

        // update the location hash
        location.hash = '!/' + unhash(hashedPageId);
        
        debug('activating page: ' + hashedPageId + ', hash change event = ' + hashChangeEvent);
        
        // update the current control stages
        refreshControlStates();
        
        if ((! animate) && callback) {
            callback();
        } // if..else        
    } // activatePage
    
    function deactivateCurrent(pager, hashedPageId, callback, transition, reverse) {
        var deactivating = pager.find('.current'),
            animate = capsAnimationEvents && transition && deactivating[0];
        
        // blur any focused controls, which should hide the on-screen keyboard...
        $(':focus').each(function() {
            this.blur();
        });
        
        debug('deactivating current page, animate = ' + animate + ', transition = ' + transition);

        if (animate) {
            deactivating
                .bind('webkitAnimationEnd', function(evt) {
                    // debug('animation end');
                    deactivating
                        .removeClass('animating-out')
                        .css('-webkit-animation-name', null)
                        .unbind('webkitAnimationEnd');
                    
                    if (callback) {
                        callback();
                    } // if
                })
                .addClass('animating-out')
                .css('-webkit-animation-name', transition + (reverse ? 'Reverse' : '') + 'Out');
        } // if
        
        // deactivate the current page (if one currently exists)
        deactivating.trigger('pageDeactivate', hashedPageId);
        pager.children().removeClass('current');
            
        if ((! animate) && callback) {
            callback();
        } // if..else
    } // deactivateCurrent
    
    function changePage(page, resetStack, transition, reverse) {
        if (! page) {
            page = $('.mf-pager').children()[0];
            
            if (! page) {
                return;
            }
        } // if
        
        // if the transition parameter is undefined, then use the options default
        if (typeof transition === 'undefined') {
            transition = options.transition;
        } // if
        
        debug('page change requested: ' + page.id + ', transition = ' + transition);
        
        // initialise variables
        var pageId = page.id, 
            pager = $(getPager(page)),
            newPageId;
            
        if (options.iScroll && $(page).hasClass('mf-scroll') && (! scrollers[pageId])) {
            // create the scroller
            scrollers[pageId] = new iScroll(pageId, {
                checkDOMChanges: false
            });
        } // if
        
        // if we have a scroller for the page, then refresh it
        if (scrollers[pageId]) {
            // refresh the scroller
            setTimeout(function() {
                scrollers[pageId].refresh();
                
                // TODO: make the scroll to top configurable
                scrollers[pageId].scrollTo(0, 0);
            }, 0);
        } // if
        
        if ('#' + pageId !== currentPage) {
            if (changeInProgress) {
                queued = {
                    page: page,
                    resetStack: resetStack,
                    transition: transition,
                    reverse: reverse
                };
                return;
            } // if
            
            // determine the new target page id
            newPageId = requestPageChange(pageId);
            if (newPageId) {
                changeInProgress = true;
                queued = null;
                
                // update the current page
                currentPage = '#' + newPageId;

                // look for the current page in the stack
                var pageIndex = pageStack.indexOf(currentPage);
                
                // if we need to reset the stack, then do that now
                if (resetStack) {
                    pageStack = [];
                } // if

                // if it exists, then we need to pop pages off
                if (pageIndex >= 0) {
                    pageStack.pop();
                    reverse = true;
                } // if
                // otherwise, push the page onto the stack
                else {
                    pageStack.push(currentPage);
                } // if..else

                // deactivate the current page, and then activate the new
                deactivateCurrent(pager, currentPage, function() {
                    activatePage(pager, currentPage, function() {
                        changeInProgress = false;

                        if (queued) {
                            changePage(queued.page, queued.resetStack, queued.transition, queued.reverse);
                        } // if
                    }, transition, reverse);
                }, transition, reverse);                
            } // if
        } // if        
    } // changePage
    
    function debug(message) {
        // console.debug(message);
    } // debug
    
    function getPage(pageId, callback) {
        // unhash the page id
        pageId = unhash(pageId);
        
        // find the page in the existing elements
        var page = pageId ? $('#' + pageId)[0] : null;
        
        // debug('looking for page id: ' + pageId + ', page = ' + page + ', callback = ' + callback);
        
        // if it exists, fire the callback
        if (page && callback) {
            callback(page);
        }
        // otherwise, attempt to load the page into the document and then fire the callback
        else if (callback) {
            callback(null);
        } // if..else
        
        // return the page
        return page;
    } // getPage
    
    /**
    This function takes a string page id and locates the specified
    DOM element, and then returns the parent DOM element
    */
    function getPager(page) {
        return page ? page.parentNode : null;
    } // getParent
    
    function iScrollInit() {
        /*
        // initialise variables
        options.iScroll = 
            options.iScroll && 
            (typeof iScroll !== 'undefined') && 
            (! $('html').hasClass('mf-noiscroll'));
        
        // flag iscroll availability in the html elements
        $('html').addClass(options.iScroll ? 'mf-iscroll' : 'mf-noiscroll');
        
        // if we have no iscroll support
        if (! options.iScroll) {
            // see if we have a bottom menu
            var bottomMenu = $('footer.mf-menu'),
                header = $('header');

            // add a top menu instead of the button menu
            // TODO: work out the best place to drop the menu
            if (bottomMenu[0]) {
                // NOTE: Unescaped as firefox automatically escapes
                var menuHtml = '<div class="mf-menu">' + unescape(bottomMenu.html()) + '</div>';
                
                // if we have a header, then add the menu after the header
                if (header[0]) {
                    header.after(menuHtml);
                }
                // otherwise add as the first element in the body
                else {
                    $('body').prepend(menuHtml);
                } // if..else
            } // if
        } // if
        */
    } // iScrollCheck
    
    function refreshControlStates() {
        var pageUrl = unhash(currentPage.replace(/^#?(.*)?\-.*$/, '$1')),
            pageRegex = new RegExp('^.*#(\!\/)?' + pageUrl, 'i');
            
        globalRegex = pageRegex;
        debug('refreshing control states, page stack contains ' + pageStack.length + ' items');
        // debug('activating button: ' + pageUrl);
        
        // add the styling for the links that are active
        $('a.active').removeClass('active');
        $('a').each(function() {
            pageRegex.lastIndex = -1;
            if (pageRegex.test(this.href)) {
                $(this).addClass('active');
            } // if
        });

        // debug('page stack has ' + pageStack.length + ' items');
        if (pageStack.length > 1) {
            $('header.mf a.back').show();
        }
        else {
            $('header.mf a.back').hide();
        } // if..else
    } // refreshControlStates
    
    function requestPageChange(pageId) {
        // initialise the event data
        var eventData = {
            pageId: pageId,
            currentPage:  unhash(currentPage),
            allow: true
        };
        
        // fire the page changing event
        eve('mobiflex.page.change', module, eventData);
        
        // return the page id (which can be overriden in the page changing event)
        return eventData.allow ? eventData.pageId : null;
    } // requestPageChange    
    
    function switchTo(pageId, resetStack, transition, reverse) {
        // unhash the page id
        pageId = unhash(pageId);
        
        // if reset stack has not been specified, then guess based on the page id
        resetStack = typeof resetStack !== 'undefined' ? 
            resetStack : 
            pageId.indexOf('-') < 0;
        
        // ('switching page, page id = ' + pageId + ', reset stack = ' + resetStack);

        // get the requested page
        getPage(pageId, function(page) {
            changePage(page, resetStack, transition, reverse);
        });
    } // switchTo
    
    function unhash(input) {
        return input ? input.replace(/^.*?#?(\!\/)?([^#\/]*)$/, '$2') : '';
    } // unhash
    
    /* event handlers */
    
    /*
    This function is used to provide referrer information as per jQTouch.  David Kaneda's approach 
    was ingenious and I personally came to rely on it... can't live without it so mobiflex get's a 
    version of sorts...
    */
    function handleDocumentClick(evt) {
        var matches = $(evt.target).closest('a'),
            actionId = matches.length > 0 ? unhash(matches[0].href) : null,
            targetPage = actionId ? getPage(actionId) : null;
            
        if (targetPage) {
            $(targetPage).data('referrer', matches);
        } // if
        
        // if hash changes aren't supported, then bind to click events 
        if (actionId && (! hashChangeEvent)) {
            switchTo(actionId);
        } // if
    } // handleDocumentClick
    
    function handleHashChange(evt) {
        var newPage = unhash(location.hash);
        
        // debug('captured hash change, location.hash = ' + location.hash);
        
        if (newPage && (newPage !== unhash(currentPage))) {
            // debug('changing page in response to hash change');
            switchTo(newPage);
        } // if
    } // handleHashChange
    
    function handleMenuItemClick(evt) {
        // initialise variables
        var menu = $(this).get(0).parentNode,
            actionId = this.href.replace(/^.*#(.*)$/, '$1');
            
        // fire the action exec method
        eve('mobiflex.action', module, unhash(actionId));
    } // handleMenuItemClick
    
    /* exports */
    
    function changeOptions(params) {
        options = $.extend(options, params);
    } // changeOptions
    
    function stack(replacement) {
        if (typeof replacement != 'undefined') {
            return pageStack = [].concat(replacement);
        }
        else {
            return pageStack;
        } // if..else
    } // getStack
    
    function init() {
        // attach to the hash change event
        if (hashChangeEvent) {
            window.onhashchange = handleHashChange;
        } // if
        
        // TODO: set the screen height if we are on an iPhone and know 
        // we are in a browser window
        
        // preview click events
        $(document.body).bind('click', handleDocumentClick);
        
        // handle click events for menu anchors
        $('.mf-menu a').live('click', handleMenuItemClick);
        $('header.mf a.back').bind('click', function() {
            popLastPage();
        });
        
        // initialise the pager to the use the appropriate first page
        $('.mf-pager').each(function() {
            var activePage = $(this).find('.current').get(0);
            
            if (options.startScreen) {
                switchTo(options.startScreen, true, null);
            }
            else if (location.hash) {
                switchTo(location.hash, true, null);
            }
            else {
                switchTo(activePage ? activePage.id : $(this).children().first().attr('id'), true, null);
            }
        });
        
        // refresh the control states
        refreshControlStates();
        
        // run an iscroll availability check
        iScrollInit();
        
        // flag mobiflex as ready
        $('html')
            // flag as loaded (will hide splash elements)
            .addClass('mf-loaded')
            // remove the loading class (will display other elements)
            .removeClass('mf-loading');        
        $(document).trigger('mobiflexReady');
    } // init
    
    function maskDisplay(message, effect) {
        var mask = $('#mobimask'),
            maskHTML = '';
        
        // if the mask is already defined, simply update the message
        if (mask[0]) {
            mask.html(message);
        }
        // otherwise, create the mask
        else {
            // define the mask html
            maskHTML = '<div id="mobimask" class="' + 
                (effect ? effect : 'mfx-gradient-simple') + 
                '">' + message + '</div>';
            $(document.body).prepend(maskHTML);
        } // if..else
    } // maskDisplay
    
    function popLastPage() {
        if (pageStack.length > 1) {
            // debug('going back to page: ' + pageStack[pageStack.length - 2]);
            switchTo(pageStack[pageStack.length - 2], false, undefined, true);
        } // if
    } // popLastPage
    
    function refreshPage(pageId, callback) {
        pageId = unhash(pageId);
        
        if (scrollers[pageId]) {
            setTimeout(function() {
                scrollers[pageId].refresh();
                
                // if we have a callback, then trigger it and pass the scroller through
                if (callback) {
                    callback(scrollers[pageId]);
                } // if
            }, 0);
        } // if
    } // refreshPage
    
    function showPage(pageId, args) {
        var opts = $.extend({
            resetStack: false,
            transition: options.transition
        }, args);
        
        switchTo(pageId, opts.resetStack, opts.transition);
    } // showPage
    
    function unmaskDisplay() {
        $('#mobimask').remove();
    } // unmaskDisplay
    
    /* define the module */
    
    var module = {
        init: init,
        opt: changeOptions,
        mask: maskDisplay,
        refresh: refreshPage,
        show: showPage,
        unmask: unmaskDisplay,
        unwind: popLastPage,
        stack: stack
    };
    
    /* initialization */
    
    $(document).ready(function() {
        if (options.autoInit) {
            init();
        } // if
    });
    
    return module;
})();