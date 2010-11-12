MOBIFLEX = (function() {
    // initialise variables
    var currentPage = '',
        hashChangeEvent = 'onhashchange' in window,
        scrollers = {};
        
    /* internal types */
    
    function FlexPager(target) {
        
        // initialise variables
        var yPan = 0,
            jQTarget = $(target);
        
        /* event handlers */
        
        function handlePan(evt, x, y) {
            // update the ypan
            yPan = yPan - y;
            
            debug('total pan = ' + yPan);
            
            // update the transform on the object
            jQTarget.css('-webkit-transform', 'translateY(' + yPan + 'px)');
        } // handlePan
        
        var self = {
            
        };
        
        if (typeof COG.Touch !== 'undefined') {
            // make this observable
            COG.observable(self);
            
            // capture touches
            COG.Touch.capture(target, {
                observable: self
            });

            // bind event handlers
            self.bind('pan', handlePan);
        } // if
        
        
        return self;
    } // FlexPager
    
    /* internal functions */
    
    function debug(msg) {
        console.debug(msg);
    } // debug
    
    /**
    This function takes a string page id and locates the specified
    DOM element, and then returns the parent DOM element
    */
    function getPager(page) {
        return page.get(0).parentNode;
    } // getParent
    
    function init() {
        // clear the location hash
        location.hash = '';
        
        // attach to the hash change event
        if (hashChangeEvent) {
            window.addEventListener('hashchange', handleHashChange, false);
        } // if
    } // init
    
    function unhash(input) {
        return input.replace(/^#(.*)/, '$1');
    } // unhash
    
    function switchTo(pageId) {
        // unhash the page id
        pageId = unhash(pageId);
        
        // initialise variables
        var page = $('#' + pageId),
            pager = $(getPager(page)),
            scrollingSupport = typeof iScroll !== 'undefined';
            
        if (scrollingSupport && page.hasClass('mf-scroll') && (! scrollers[pageId])) {
            // create the scroller
            scrollers[pageId] = new iScroll(pageId, {
                checkDOMChanges: false
            });
            
            // refresh the scroller
            setTimeout(function() {
                scrollers[pageId].refresh();
            }, 0);
        } // if
        
        // update the current page
        currentPage = '#' + (pageId);
        
        // switch the display
        pager.find('.current').removeClass('current');
        pager.find(currentPage).addClass('current');
    } // switchTo
    
    /* event handlers */
    
    function handleHashChange(evt) {
        if (location.hash) {
            switchTo(location.hash);
        } // if
    } // handleHashChange
    
    function handleTouchMove(evt) {
        var targetParent = evt.target ? evt.target.parentNode : null;
        if (targetParent && $(targetParent).hasClass('mf-pager')) {
            debug('in a pager...');
        } // if
        
        evt.preventDefault();
    } // handleTouchMove
    
    /* exports */
    
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
    
    function showPage(pageId) {
        // standardize the page id
        pageId = '#' + unhash(pageId);
        
        // find the specified element
        var targetPage = $(pageId).get(0);
        
        // if found, update the location hash
        if (targetPage) {
            location.hash = pageId;
        } // if
    } // showPage
    
    /* define the module */
    
    var module = {
        refresh: refreshPage,
        show: showPage,
        unwind: popLastPage
    };
    
    /* initialization */
    
    $(document).ready(init);
    
    return module;
})();