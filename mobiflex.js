MOBIFLEX = (function() {
    // initialise variables
    var currentPage = '',
        hashChangeEvent = 'onhashchange' in window,
        scrollers = {};
        
    /* internal types */
    
    /* internal functions */
    
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
        // clear the location hash
        location.hash = '';
        
        // attach to the hash change event
        if (hashChangeEvent) {
            window.addEventListener('hashchange', handleHashChange, false);
        } // if
        
        // update the menu to contain the items laid out correctly...
        $('.mf-menu a').each(function() {
            $(this).html('<img/><strong>' + this.innerText + '</strong>');
        });
        
        // handle click events for menu anchors
        $('.mf-menu a').click(handleMenuItemClick);
    } // init
    
    function unhash(input) {
        return input.replace(/^#(.*)/, '$1');
    } // unhash
    
    function switchTo(pageId) {
        // unhash the page id
        pageId = unhash(pageId);
        
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
        
        // update the current page
        currentPage = '#' + pageId;
        
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
    
    function handleMenuItemClick(evt) {
        // initialise variables
        var menu = $(this).get(0).parentNode,
            page = getPage(this.href.replace(/^.*#(.*)$/, '$1'));
        
        // TODO: run exec requests

        // if the page exists, then update the active state 
        if (page) {
            // remove the active classes from the menu
            $(menu).find('a').removeClass('active');
            $(this).addClass('active');

            return true;
        } // if
        
        return false;
    } // handleMenuItemClick
    
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
        var targetPage = getPage(pageId);
        
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