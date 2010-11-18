MOBIFLEX = (function() {
    // initialise constants
    // empty image converted using http://www.motobit.com/util/base64-decoder-encoder.asp
    // var EMPTY_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAANSURBVAiZY/j//z8DAAj8Av6Fzas0AAAAAElFTkSuQmCC';
    var EMPTY_IMAGE = 'R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
        
    
    // initialise variables
    var currentPage = '',
        hashChangeEvent = 'onhashchange' in window,
        scrollers = {},
        pageStack = [];
        
    /* internal types */
    
    /* internal functions */
    
    function debug(message) {
        console.debug(message);
    } // debug
    
    function getPage(pageId) {
        // unhash the page id
        pageId = unhash(pageId);
        
        // return the page if the page id is not empty, or null otherwise
        return pageId ? $('#' + pageId).get(0) : null;
    } // getPage
    
    /**
    This function takes a string page id and locates the specified
    DOM element, and then returns the parent DOM element
    */
    function getPager(page) {
        return page ? page.parentNode : null;
    } // getParent
    
    function init() {
        // attach to the hash change event
        if (hashChangeEvent) {
            window.onhashchange = handleHashChange;
        } // if
        
        // TODO: set the screen height if we are on an iPhone and know 
        // we are in a browser window
        
        // update the menu to contain the items laid out correctly...
        $('.mf-menu a').each(function() {
            $(this).html('<img src="data:image/png;base64,' + EMPTY_IMAGE + '"/><strong>' + this.innerText + '</strong>');
        });
        
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
            
            switchTo(activePage ? activePage.id : $(this).children().first().attr('id'), true);
        });
        
        // refresh the control states
        refreshControlStates();
    } // init
    
    function refreshControlStates() {
        var pageUrl = currentPage.replace(/^(.*)?\-.*$/, '$1');
        console.debug('activating button: ' + pageUrl);
        
        // add the styling for the links that are active
        $('a.active').removeClass('active');
        $('a[href="' + pageUrl  + '"]').addClass('active');

        debug('page stack has ' + pageStack.length + ' items');
        if (pageStack.length > 1) {
            $('header.mf a.back').show();
        }
        else {
            $('header.mf a.back').hide();
        } // if..else
    } // refreshControlStates
    
    function switchTo(pageId, resetStack) {
        // unhash the page id
        pageId = unhash(pageId);
        
        // if we need to reset the stack, then do that now
        if (resetStack) {
            pageStack = [];
        } // if
        
        // initialise variables
        var page = getPage(pageId),
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
        
        if (page && ('#' + pageId !== currentPage)) {
            // update the current page
            currentPage = '#' + pageId;
            
            // look for the current page in the stack
            var pageIndex = pageStack.indexOf(currentPage);
            
            // if it exists, then we need to pop pages off
            if (pageIndex >= 0) {
                pageStack.pop();
            } // if
            // otherwise, push the page onto the stack
            else {
                pageStack.push(currentPage);
            } // if..else

            // blur any focused controls, which should hide the on-screen keyboard...
            $(':focus').blur();

            // deactivate the current page (if one currently exists)
            pager.find('.current')
                .removeClass('current')
                .trigger('pageDeactivate', pageId);

            // refresh the page
            refreshPage(pageId);

            // activate the new page
            pager.find(currentPage)
                .addClass('current')
                .trigger('pageActivate', pageId);

            // update the location hash
            location.hash = pageId;
            
            // update the current control stages
            refreshControlStates();
        } // if
    } // switchTo
    
    function unhash(input) {
        return input.replace(/^#(.*)/, '$1');
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
        if (location.hash && (location.hash !== currentPage)) {
            debug('changing page in response to hash change');
            switchTo(location.hash, true);
        } // if
    } // handleHashChange
    
    function handleMenuItemClick(evt) {
        // initialise variables
        var menu = $(this).get(0).parentNode,
            actionId = this.href.replace(/^.*#(.*)$/, '$1');
            
        // fire the action exec method
        $(module).trigger('actionSelect', actionId);
        
        // return true if the page is defined, otherwise false
        return typeof getPage(actionId) !== 'undefined';
    } // handleMenuItemClick
    
    /* exports */
    
    function getStack() {
        return pageStack;
    } // getStack
    
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
    
    function showPage(pageId, resetStack) {
        // standardize the page id
        pageId = '#' + unhash(pageId);
        
        // find the specified element
        var targetPage = getPage(pageId);
        
        // if found, update the location hash
        if (targetPage) {
            switchTo(pageId, resetStack);
        } // if
    } // showPage
    
    /* define the module */
    
    var module = {
        refresh: refreshPage,
        show: showPage,
        unwind: popLastPage,
        stack: getStack
    };
    
    /* initialization */
    
    $(document).ready(init);
    
    return module;
})();