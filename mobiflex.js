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
    
    function activatePage(pager, hashedPageId, transition, reverse) {
        var activating = pager.find(hashedPageId),
            animate = capsAnimationEvents && transition && activating[0];
        
        // refresh the page
        refreshPage(hashedPageId);

        if (animate) {
            activating
                .bind('webkitAnimationEnd', function(evt) {
                    debug('animation end');
                    activating
                        .removeClass('animating')
                        .css('-webkit-animation-name', null)
                        .unbind('webkitAnimationEnd');
                })
                .addClass('animating')
                .css('-webkit-animation-name', transition + (reverse ? 'Reverse' : '') + 'In');
        } // if

        // activate the new page
        activating
            .addClass('current')
            .trigger('pageActivate', hashedPageId);

        // update the location hash
        location.hash = '!/' + unhash(hashedPageId);
        
        // update the current control stages
        refreshControlStates();        
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
                    debug('animation end');
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
        deactivating
            .removeClass('current')
            .trigger('pageDeactivate', hashedPageId);
            
        if ((! animate) && callback) {
            callback();
        } // if..else
    } // deactivateCurrent
    
    function changePage(page, transition, reverse) {
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
        
        // initialise variables
        var pageId = page.id, 
            pager = $(getPager(page)),
            scrollingSupport = typeof iScroll !== 'undefined';
            
        if (scrollingSupport && $(page).hasClass('mf-scroll') && (! scrollers[pageId])) {
            // create the scroller
            scrollers[pageId] = new iScroll(pageId, {
                checkDOMChanges: false
            });
            
            // refresh the scroller
            setTimeout(function() {
                scrollers[pageId].refresh();
            }, 0);
        } // if
        
        if ('#' + pageId !== currentPage) {
            $(module).trigger('pageChanging', pageId, unhash(currentPage));
            
            // update the current page
            currentPage = '#' + pageId;
            
            // look for the current page in the stack
            var pageIndex = pageStack.indexOf(currentPage);
            
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
                activatePage(pager, currentPage, transition, reverse);
            }, transition, reverse);
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
        console.debug('content = ' + content);
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
        var page = pageId ? $('#' + pageId).get(0) : null;
        
        // if it exists, fire the callback
        if (page && callback) {
            callback(page);
        }
        // otherwise, attempt to load the page into the document and then fire the callback
        else if (callback) {
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
        var iScrollAvail = opts.iScroll && (typeof iScroll !== 'undefined');
        
        // flag iscroll availability in the html elements
        $('html').addClass(iScrollAvail ? 'iscroll' : 'no-iscroll');
        
        // if we have no iscroll support
        if (! iScrollAvail) {
            // see if we have a bottom menu
            var bottomMenu = $('footer.mf-menu');

            // add a top menu instead of the button menu
            if (bottomMenu[0]) {
                $('body').children().first()
                    .after('<div class="mf-menu">' + bottomMenu.html() + '</div>');
            } // if
        } // if
    } // iScrollCheck
    
    function refreshControlStates() {
        var pageUrl = unhash(currentPage.replace(/^#?(.*)?\-.*$/, '$1')),
            pageRegex = new RegExp('^.*#(\!\/)?' + pageUrl, 'i');
            
        globalRegex = pageRegex;
            
        console.debug('activating button: ' + pageUrl);
        
        // add the styling for the links that are active
        $('a.active').removeClass('active');
        $('a').each(function() {
            pageRegex.lastIndex = -1;
            if (pageRegex.test(this.href)) {
                $(this).addClass('active');
            } // if
        });

        debug('page stack has ' + pageStack.length + ' items');
        if (pageStack.length > 1) {
            $('header.mf a.back').show();
        }
        else {
            $('header.mf a.back').hide();
        } // if..else
    } // refreshControlStates
    
    function switchTo(pageId, resetStack, transition, reverse) {
        // unhash the page id
        pageId = unhash(pageId);
        
        // if we need to reset the stack, then do that now
        if (resetStack) {
            pageStack = [];
        } // if

        // get the requested page
        getPage(pageId, function(page) {
            changePage(page, transition, reverse);
        });
    } // switchTo
    
    function unhash(input) {
        return input ? input.replace(/^#?(\!\/)?(.*)/, '$2') : '';
    } // unhash
    
    /* event handlers */
    
    /*
    This function is used to provide referrer information as per jQTouch.  David Kaneda's approach 
    was ingenious and I personally came to rely on it... can't live without it so mobiflex get's a 
    version of sorts...
    */
    function handleDocumentClick(evt) {
        var matches = $(evt.target).closest('a'),
            actionId = matches.length > 0 ? matches[0].href.replace(/^.*#(.*)$/, '$1') : null,
            targetPage = actionId ? getPage(actionId) : null;
            
        if (targetPage) {
            $(targetPage).data('referrer', matches);
        } // if
    } // handleDocumentClick
    
    function handleHashChange(evt) {
        var newPage = unhash(location.hash);
        
        if (newPage && (newPage !== unhash(currentPage))) {
            debug('changing page in response to hash change');
            switchTo(newPage, pageStack.indexOf('#' + newPage) < 0);
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
        opts = $.extend(options, params);
    } // changeOptions
    
    function getStack() {
        return pageStack;
    } // getStack
    
    function init() {
        // attach to the hash change event
        if (hashChangeEvent) {
            window.onhashchange = handleHashChange;
        } // if
        
        // TODO: set the screen height if we are on an iPhone and know 
        // we are in a browser window
        
        // preview click events
        $(document.body).click(handleDocumentClick);
        
        // handle click events for menu anchors
        $('.mf-menu a').click(handleMenuItemClick);
        $('header.mf a.back').click(function() {
            globalStack = pageStack;
            if (pageStack.length > 1) {
                debug('going back to page: ' + pageStack[pageStack.length - 2]);
                switchTo(pageStack[pageStack.length - 2]);
            } // if
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
        $('html').removeClass('loading');        
        $(document).trigger('mobiflexReady');
    } // init
    
    function popLastPage() {
        
    } // popLastPage
    
    function refreshPage(pageId) {
        pageId = unhash(pageId);
        
        if (scrollers[pageId]) {
            setTimeout(function() {
                scrollers[pageId].refresh();
            }, 0);
        } // if
    } // refreshPage
    
    function showPage(pageId, args) {
        var opts = $.extend({
            resetStack: false,
            transition: options.transition
        }, args);
        
        // standardize the page id
        pageId = '#' + unhash(pageId);
        
        // find the specified element
        var targetPage = getPage(pageId);
        
        // if found, update the location hash
        if (targetPage) {
            switchTo(pageId, opts.resetStack, opts.transition);
        } // if
    } // showPage
    
    /* define the module */
    
    var module = {
        init: init,
        opt: changeOptions,
        refresh: refreshPage,
        show: showPage,
        unwind: popLastPage,
        stack: getStack
    };
    
    /* initialization */
    
    $(document).ready(function() {
        if (options.autoInit) {
            init();
        } // if
    });
    
    return module;
})();