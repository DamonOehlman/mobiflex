MOBIFLEX = (function() {
    // initialise constants
    // empty image converted using http://www.motobit.com/util/base64-decoder-encoder.asp
    // var EMPTY_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAANSURBVAiZY/j//z8DAAj8Av6Fzas0AAAAAElFTkSuQmCC';
    var EMPTY_IMAGE = 'R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
        
    
    // initialise variables
    var currentPage = '',
        hashChangeEvent = 'onhashchange' in window,
        scrollers = {},
        pageStack = [],
        loadAttempted = {},
        changeInProgress = false,
        queued = null,
        options = {
            autoInit: true,
            ajaxLoad: true,
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
        $(':focus').blur();
        
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
    
    function createPage(pageId, content) {
        var container = $('.mf-pager')[0],
            pageContent = content;
            
        // if we are creating containers for the loaded content, 
        // then wrap the page in div
        if (options.createContainers) {
            pageContent = '<div id="' + pageId + '" class="mf-scroll">' + content + '</div>';
        } // if

        $(container ? container : document.body).append(pageContent);
        // debug('content = ' + content);
        $(module).trigger('pageCreate', pageId);
        return $('#' + pageId)[0];
    } // createPage
    
    function debug(message) {
        console.debug(message);
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
            // debug('attempting ajax load, loadattempted = ' + loadAttempted[pageId]);
            
            if (options.ajaxLoad && $.ajax && (! loadAttempted[pageId])) {
                // flag that we have attempted to load the page previously
                loadAttempted[pageId] = true;
                
                // attempt to load the page
                $.ajax({
                    url: options.pagePath + pageId + options.pageExt, 
                    success: function(content, status, rawRequest) {
                        callback(createPage(pageId, content));
                    },
                    error: function(rawRequest, status, error) {
                        debug('could not load page: ' + pageId);
                        callback(null);
                    }
                });
            }
            else {
                callback(null);
            } // if..else
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
        $(module).trigger('pageChanging', eventData);
        
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
        
        COG.Log.info('switching page, page id = ' + pageId + ', reset stack = ' + resetStack);

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
        $(module).trigger('actionSelect', unhash(actionId));
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
        $('.mf-menu a').bind('click', handleMenuItemClick);
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