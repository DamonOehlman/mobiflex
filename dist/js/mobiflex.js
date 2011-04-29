MOBIFLEX = (function() {
var _observable = (function() {
    var callbackCounter = 0;

    function getHandlers(target) {
        return target.hasOwnProperty('obsHandlers') ?
                target.obsHandlers :
                null;
    } // getHandlers

    function getHandlersForName(target, eventName) {
        var handlers = getHandlers(target);
        if (! handlers[eventName]) {
            handlers[eventName] = [];
        } // if

        return handlers[eventName];
    } // getHandlersForName

    return function(target) {
        if (! target) { return null; }

        /* initialization code */

        if (! getHandlers(target)) {
            target.obsHandlers = {};
        } // if

        var attached = target.hasOwnProperty('bind');
        if (! attached) {
            target.bind = function(eventName, callback) {
                var callbackId = "callback" + (callbackCounter++);
                getHandlersForName(target, eventName).unshift({
                    fn: callback,
                    id: callbackId
                });

                return callbackId;
            }; // bind

            target.triggerCustom = function(eventName, args) {
                var eventCallbacks = getHandlersForName(target, eventName),
                    evt = {
                        cancel: false,
                        name: eventName,
                        source: this
                    },
                    eventArgs;

                for (var key in args) {
                    evt[key] = args[key];
                } // for

                if (! eventCallbacks) {
                    return null;
                } // if

                eventArgs = Array.prototype.slice.call(arguments, 2);

                if (target.eventInterceptor) {
                    target.eventInterceptor(eventName, evt, eventArgs);
                } // if

                eventArgs.unshift(evt);

                for (var ii = eventCallbacks.length; ii-- && (! evt.cancel); ) {
                    eventCallbacks[ii].fn.apply(this, eventArgs);
                } // for

                return evt;
            };

            target.trigger = function(eventName) {
                var eventArgs = Array.prototype.slice.call(arguments, 1);
                eventArgs.splice(0, 0, eventName, null);

                return target.triggerCustom.apply(this, eventArgs);
            }; // trigger

            target.unbind = function(eventName, callbackId) {
                if (typeof eventName === 'undefined') {
                    target.obsHandlers = {};
                }
                else {
                    var eventCallbacks = getHandlersForName(target, eventName);
                    for (var ii = 0; eventCallbacks && (ii < eventCallbacks.length); ii++) {
                        if (eventCallbacks[ii].id === callbackId) {
                            eventCallbacks.splice(ii, 1);
                            break;
                        } // if
                    } // for
                } // if..else

                return target;
            }; // unbind
        } // if

        return target;
    };
})();

    var EMPTY_IMAGE = 'R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';


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

        capsAnimationEvents = (typeof WebKitAnimationEvent !== 'undefined');

    /* internal types */

    /* internal functions */

    function activatePage(pager, hashedPageId, callback, transition, reverse) {
        var activating = pager.find(hashedPageId),
            animate = capsAnimationEvents && transition && activating[0];

        refreshPage(hashedPageId);

        if (animate) {
            activating
                .bind('webkitAnimationEnd', function(evt) {
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

        activating
            .addClass('current')
            .trigger('pageActivate', hashedPageId);

        activating.data('referrer', null);

        location.hash = '!/' + unhash(hashedPageId);

        debug('activating page: ' + hashedPageId + ', hash change event = ' + hashChangeEvent);

        refreshControlStates();

        if ((! animate) && callback) {
            callback();
        } // if..else
    } // activatePage

    function deactivateCurrent(pager, hashedPageId, callback, transition, reverse) {
        var deactivating = pager.find('.current'),
            animate = capsAnimationEvents && transition && deactivating[0];

        $(':focus').each(function() {
            this.blur();
        });

        debug('deactivating current page, animate = ' + animate + ', transition = ' + transition);

        if (animate) {
            deactivating
                .bind('webkitAnimationEnd', function(evt) {
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

        if (typeof transition === 'undefined') {
            transition = options.transition;
        } // if

        debug('page change requested: ' + page.id + ', transition = ' + transition);

        var pageId = page.id,
            pager = $(getPager(page)),
            newPageId;

        if (options.iScroll && $(page).hasClass('mf-scroll') && (! scrollers[pageId])) {
            scrollers[pageId] = new iScroll(pageId, {
                checkDOMChanges: false
            });
        } // if

        if (scrollers[pageId]) {
            setTimeout(function() {
                scrollers[pageId].refresh();

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

            newPageId = requestPageChange(pageId);
            if (newPageId) {
                changeInProgress = true;
                queued = null;

                currentPage = '#' + newPageId;

                var pageIndex = pageStack.indexOf(currentPage);

                if (resetStack) {
                    pageStack = [];
                } // if

                if (pageIndex >= 0) {
                    pageStack.pop();
                    reverse = true;
                } // if
                else {
                    pageStack.push(currentPage);
                } // if..else

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
    } // debug

    function getPage(pageId, callback) {
        pageId = unhash(pageId);

        var page = pageId ? $('#' + pageId)[0] : null;


        if (page && callback) {
            callback(page);
        }
        else if (callback) {
            callback(null);
        } // if..else

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
        options.iScroll =
            options.iScroll &&
            (typeof iScroll !== 'undefined') &&
            (! $('html').hasClass('mf-noiscroll'));

        $('html').addClass(options.iScroll ? 'mf-iscroll' : 'mf-noiscroll');

        if (! options.iScroll) {
            var bottomMenu = $('footer.mf-menu'),
                header = $('header');

            if (bottomMenu[0]) {
                var menuHtml = '<div class="mf-menu">' + unescape(bottomMenu.html()) + '</div>';

                if (header[0]) {
                    header.after(menuHtml);
                }
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

        $('a.active').removeClass('active');
        $('a').each(function() {
            pageRegex.lastIndex = -1;
            if (pageRegex.test(this.href)) {
                $(this).addClass('active');
            } // if
        });

        if (pageStack.length > 1) {
            $('header.mf a.back').show();
        }
        else {
            $('header.mf a.back').hide();
        } // if..else
    } // refreshControlStates

    function requestPageChange(pageId) {
        var eventData = {
            pageId: pageId,
            currentPage:  unhash(currentPage),
            allow: true
        };

        module.trigger('pageChanging', eventData);

        return eventData.allow ? eventData.pageId : null;
    } // requestPageChange

    function switchTo(pageId, resetStack, transition, reverse) {
        pageId = unhash(pageId);

        resetStack = typeof resetStack !== 'undefined' ?
            resetStack :
            pageId.indexOf('-') < 0;


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

        if (actionId && (! hashChangeEvent)) {
            switchTo(actionId);
        } // if
    } // handleDocumentClick

    function handleHashChange(evt) {
        var newPage = unhash(location.hash);


        if (newPage && (newPage !== unhash(currentPage))) {
            switchTo(newPage);
        } // if
    } // handleHashChange

    function handleMenuItemClick(evt) {
        var menu = $(this).get(0).parentNode,
            actionId = this.href.replace(/^.*#(.*)$/, '$1');

        module.trigger('actionSelect', unhash(actionId));
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
        if (hashChangeEvent) {
            window.onhashchange = handleHashChange;
        } // if


        $(document.body).bind('click', handleDocumentClick);

        $('.mf-menu a').live('click', handleMenuItemClick);
        $('header.mf a.back').bind('click', function() {
            popLastPage();
        });

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

        refreshControlStates();

        iScrollInit();

        $('html')
            .addClass('mf-loaded')
            .removeClass('mf-loading');
        $(document).trigger('mobiflexReady');
    } // init

    function maskDisplay(message, effect) {
        var mask = $('#mobimask'),
            maskHTML = '';

        if (mask[0]) {
            mask.html(message);
        }
        else {
            maskHTML = '<div id="mobimask" class="' +
                (effect ? effect : 'mfx-gradient-simple') +
                '">' + message + '</div>';
            $(document.body).prepend(maskHTML);
        } // if..else
    } // maskDisplay

    function popLastPage() {
        if (pageStack.length > 1) {
            switchTo(pageStack[pageStack.length - 2], false, undefined, true);
        } // if
    } // popLastPage

    function refreshPage(pageId, callback) {
        pageId = unhash(pageId);

        if (scrollers[pageId]) {
            setTimeout(function() {
                scrollers[pageId].refresh();

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

    var module = _observable({
        init: init,
        opt: changeOptions,
        mask: maskDisplay,
        refresh: refreshPage,
        show: showPage,
        unmask: unmaskDisplay,
        unwind: popLastPage,
        stack: stack
    });

    /* initialization */

    $(document).ready(function() {
        if (options.autoInit) {
            init();
        } // if
    });

    return module;
})();
