/**
 * The DOM object on the page being highlighted.
 * If null, no element is selected yet (usually will get the first navigable one on the page).
 * @type {Element|null}
 */
var selectEl = null;

/**
 * The ID of the EZ masking span tag.
 * @type {string}
 */
var maskId = 'EZ_mask';
/**
 * Selector ID to use on the page
 * @type {string}
  */
var ezSelectorId = 'ezselected';

/**
 * Whether EZ navigation mode is activated or not
 * @type {boolean}
 */
var ez_navigateToggle = false;

/**
 * Wrap elements on the screen
 * @type {boolean}
 */
var screenWrap = false;

/**
 * Whether to allow reordering elements manually from DOM standard.
 * @type {boolean}
 */
var allowReorder = false;


/**
 * An array/list of input types and tags that are interactive and should be
 * highlighted separately from other elements.
 */
var INTERACTIVE_TYPES = [
    'checkbox', 'radio', 'select', 'button', 'submit', 'reset',
    'range', 'number',
    'text', 'password', 'email', 'search', 'url', 'tel', 'textarea'];

/**
 * An array/list of HTML tags that are inline and should not normally be
 * navigated to in an individual manner. In general, these tags are safe
 * to be "fused" together with other similar types of content.
 * @const
 */
var INLINE_TAGS = [
    'a', //<a> without an href attribute is treated as inline
    'abbr', 'acronym', 'address', 'b',
    'bdi', 'bdo',
    'big', 'blink', 'br',
    'cite', 'code',
    'data', //experimental in HTML spec
    'del', 'dfn', 'em',
    'figcaption', //To be lumped together with everything else in the <caption>
    'font', 'hr', 'i',
    'img', //<img> alt-text generally included with other content
    'ins', 'kbd', 'mark', 'q', 's',
    'samp', 'small', 'span', 'strike',
    'strong', 'sub', 'sup', 'time',
    'tt', 'u', 'var', 'wbr', 'xmp'];


/**
 * An array/list of tags associated with tabular content.
 * This content is not specifically supported at this point.
 * @const
 */
var TABLE_TAGS = [
    'col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr'];

/**
 * An array/list of tags that are not supported by EZ Access.
 * @const
 */
var UNSUPPORTED_TAGS = [
    'iframe',
    'ruby', 'rp', 'rt',
    'keygen',
    'menu'];

/**
 * An array/list of tags that encapsulate data that does not make sense to be
 * navigated by the user.
 * @const
 */
var UNNAVIGABLE_TAGS = [
    'map', 'area',
    'datalist', 'option', 'optgroup',
    'menuitem', 'command',
    'script', 'noscript'];

/**
 * These tags generally contain content that must be rendered using
 * a plugin or other browser module. They are not supported by
 * EZ Access.
 * @const
 */
var PLUGIN_TAGS = [
    'applet', 'canvas', 'embed', 'object', 'param',
    'audio', 'bgsound', 'video', 'source', 'track'];

/**
 * These tags have been deprecated or are obselete and are not supported
 * by EZ Access.
 * Note that some deprecated tags (namely those that may contain
 * inline content) are supported by EZ Access.
 * @const
 */
var DEPRECATED_TAGS = [
    'basefont', 'dir', 'frame', 'frameset', 'isindex', 'listing',
    'nobr', 'noframes', 'plaintext', 'spacer', 'command'];

/**
 * These tags should never be present in the <body> and should be skipped
 * by EZ Access unless they have specific attributes.
 * @const
 */
var HEAD_TAGS = [
    'html', 'head', 'base', 'body', 'link', 'meta', 'style', 'title'];

/**
 * This is an array/list of HTML tags that should be completely skipped
 * when navigating or pointing to elements unless they have specific attributes.
 * Some of these tags are unsupported in EZ Access.
 * @const
 */
var SKIPPED_TAGS = [].concat(UNSUPPORTED_TAGS, UNNAVIGABLE_TAGS, PLUGIN_TAGS,
    DEPRECATED_TAGS, HEAD_TAGS);


/**
 * An array of all tags in HTML, including deprecated, obsolete, and
 * non-standard tags. This list should only be used when looking for
 * unknown or custom tags in the DOM. The data for this list came from:
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element
 * as of 2013-06-17 and may be updated as HTML continues to evolve.
 * @const
 */
var ALL_HTML_TAGS = [
    'a', 'abbr', 'acronym', 'address', 'applet', 'area',
    'article', 'aside', 'audio', 'b', 'base', 'basefont', 'bdi', 'bdo',
    'bgsound', 'big', 'blink', 'blockquote', 'body', 'br', 'button',
    'canvas', 'command', 'caption', 'center', 'cite', 'code', 'col',
    'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dir',
    'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure',
    'font', 'footer', 'form', 'frame', 'frameset',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup',
    'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'isindex',
    'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'listing',
    'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta',
    'meter', 'nav', 'nobr', 'noframes', 'noscript', 'object', 'ol',
    'optgroup', 'option', 'output', 'p', 'param', 'plaintext', 'pre',
    'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script',
    'section', 'select', 'small', 'source', 'spacer', 'span', 'strike',
    'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td',
    'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track',
    'tt', 'u', 'ul', 'var', 'video', 'wbr', 'xmp'];


/**
 * Checks to see if the DOM Object o is focusable in EZ Access when
 * the user is navigating (i.e., using EZ Up or EZ Down).
 * The data-ez-focusable attribute is inherited,
 * so this function checks for inheritance.
 * @author J. Bern Jordan, Alexander Harding
 * @param {object} o The DOM object to be checked.
 * @param [{'nav'|'point'}] source Navigation method passed from calling function
 * @return {boolean} Whether o is focusable with EZ Access navigation.
 */
function isFocusable(o, source) {
    'use strict';

    // Look for nodes and elements only; return false otherwise
    if(o === document.doctype) return false; // For some reason this isn't caught below + can cause exceptions
    else if(isElement(o));
    else if(isNode(o)) o = o.parentElement;
    else return false;

    if(source === undefined) source = 'nav';

    if (SKIPPED_TAGS.indexOf(o.tagName.toLowerCase()) !== -1) {
        return false;
    }

    var attr = '';

    /** Check to see if immediate element is focusable or not */
    if (o.hasAttribute('data-ez-focusable')) {
        attr = o.getAttribute('data-ez-focusable');
    }
    if (source === 'nav' && o.hasAttribute('data-ez-focusable-nav')) {
        attr = o.getAttribute('data-ez-focusable-nav');
    }
    if (source === 'point' && o.hasAttribute('data-ez-focusable-point')) {
        attr = o.getAttribute('data-ez-focusable-point');
    }

    if (attr === 'true') {
        return true;
    }
    if (attr === 'false') {
        return false;
    }

    //Check recursively to see if the parents are focusable
    var parent = o.parentElement;
    if (parent === null || parent.tagName === 'BODY') {
        return true; //by default element is focusable if nothing to inherit
    }
    return isFocusable(parent);
}

//Returns true if it is a DOM node
function isNode(o){
    return (
        typeof Node === "object" ? o instanceof Node :
            o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
        );
}

//Returns true if it is a DOM element
function isElement(o){
    return (
        typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
        );
}

/**
 * Checks to see if the DOM Object o is a supported interactive element.
 * @author J. Bern Jordan, Alexander Harding
 * @param {object} o The DOM object to be checked.
 * @return {boolean} Whether o is a supported interactive element.
 */
function isInteractive(o) {
    'use strict';

    // Look for nodes and elements only; return false otherwise
    if(isElement(o));
    else if(isNode(o)) o = o.parentElement;
    else return false;

    if (o.hasAttribute('onlick')) {
        return true;
    }
    var type = o.tagName.toLowerCase();
    if (type === 'a') {
        //<a> without href is not interactive
        return o.hasAttribute('href');
    }
    return INTERACTIVE_TYPES.indexOf(type) > -1;
}

/**
 * Checks to see whether the passed node can be inline with other inline
 * nodes (i.e., it can be safely combined with other inline elements when
 * being highlighted and read.
 * Note: A return of false implies that the node may be a block-level element,
 * but its decendendants need to be checked to make sure all of them are
 * inline elements.
 * @author J. Bern Jordan, Alexander Harding
 * @param {object} o A Node object or DOM element to be checked.
 * @param {'nav'|'point'} source Navigation method passed from calling function
 * @throws {Error} Throws an error if o is neither a text or DOM node.
 */
function isInlineElement(o, source) {
    'use strict';

    // Look for nodes and elements only; return false otherwise
    if(isElement(o));
    else return isNode(o);

    if(source === undefined) source = 'nav';

    if (o.nodeType !== 1) {
        if (o.nodeType === 3) {
            return true; //text node can be inline with other nodes
        } //else
        throw new Error('Node not a DOM or text node.');
    } //Else: o is a DOM element

    /** Interactive elements should not be inline with other elements */
    if (isInteractive(o)) {
        return false;
    }

    /**
     * Check to see if o has an attribute which would otherwise override
     * the inline presentation behavior.
     */
    if (o.hasAttribute('data-ez-chunking')) {
        var chunking = o.getAttribute('data-ez-chunking');

        if (source === 'nav') {
            if (chunking === 'block-nav') {
                return false;
            }
            if (chunking === 'inline-nav') {
                return true;
            }
        }

        if (source === 'point') {
            if (chunking === 'block-point') {
                return false;
            }
            if (chunking === 'block-inline') {
                return true;
            }
        }

        if (chunking === 'block') {
            return false;
        }
        if (chunking === 'inline') {
            return true;
        }
    }

    /** Now, have to check the type of element (tag) o is */
    var tag = o.tagName.toLowerCase();

    /** Check to see if o is an inline tag */
    if (INLINE_TAGS.indexOf(tag) !== -1) {
        return true;
    }

    /** Check to see if o is an unknown tag */
    if (ALL_HTML_TAGS.indexOf(tag) === -1) {
        //a custom/unknown tag should be treated as inline by default
        return true;
    }

    /** If not explicitly an inline tag, treat potentially as block-level */
    return false;
}

/**
 * Checks all descendants of the given node to see if all of them are either
 * inline or have "display: none".
 * @author J. Bern Jordan
 * @param o {object} A Node object to be checked.
 * @param source ['nav'|'point'} Navigation method passed from calling function
 */
function areAllChildrenInline(o, source) {
    'use strict';

    var children = getChildNodes(o, source);

    if (children === null) {
        return true;
    }

    var i, n; //loop control variables
    var result;

    /** Go through children using recursive calls as necessary */
    for (i = 0, n = children.length; i < n; i++) {
        if (o.style.display === 'none') {
            result = true;
            //if a node is not displayed, it is "inline" for these
            //purposes and the decendants do not need to be checked
        } else {
            result = isInlineElement(children[i], source) &&
                areAllChildrenInline(children[i], source);
        }

        if (!result) {
            return false; //shortcut if any false result
        }
    }

    /** No false result found */
    return true;
}

/**
 * A version of |Node.childNodes| that skips nodes that are entirely
 * whitespace or comments. Unlike Node.childNodes, this function returns an
 * actual array of nodes rather than a NodeList.
 * @author J. Bern Jordan
 * @param {Node} nod The node object for which to get all children.
 * @param source ['nav'|'point'} Navigation method passed from calling function
 * @return {null|Node[]} An actual array of child nodes that are "useful"
 * in HTML. If there are no appropriate child nodes, the function returns null.
 */
function getChildNodes( nod, source ) {
    'use strict';
    /** The array to be returned */
    var ret = [];

    var child = first_child(nod);
    if (child === null) {
        return null;
    }

    while (child !== null) {
        ret.push(child);
        child = node_after(child, source);
    }

    return ret;
}

/** All following code from
 https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Whitespace_in_the_DOM */

/**
 * Throughout, whitespace is defined as one of the characters
 *  "\t" TAB \u0009
 *  "\n" LF  \u000A
 *  "\r" CR  \u000D
 *  " "  SPC \u0020
 *
 * This does not use Javascript's "\s" because that includes non-breaking
 * spaces (and also some other characters).
 */


/**
 * Determine whether a node's text content is entirely whitespace.
 *
 * @preserve This function came from:
 * https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Whitespace_in_the_DOM
 * on 2013-06-14 and is available either under the MIT License or is in the
 * public domain (please check the site if the exact license is important to
 * you).
 * @param nod  A node implementing the |CharacterData| interface (i.e.,
 *             a |Text|, |Comment|, or |CDATASection| node
 * @return     True if all of the text content of |nod| is whitespace,
 *             otherwise false.
 */
function is_all_ws( nod ) {
    return !(/[^\t\n\r ]/.test(nod.data));
}

/**
 * Determine if too short
 * @param nod A node implementing the |CharacterData| interface (i.e.,
 *            a |Text|, |Comment|, or |CDATASection| node
 * @returns {boolean} Returns true if length <= 1 indicating that it probably shouldn't be navigable.
 */
function is_all_punct( nod ) {
    if(nod.data === undefined) return false;
    return nod.data.length <= 1;
}


/**
 * Determine if a node should be ignored by the iterator functions.
 *
 * @preserve This function came from:
 * https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Whitespace_in_the_DOM
 * on 2013-06-14 and is available either under the MIT License or is in the
 * public domain (please check the site if the exact license is important to
 * you).
 * @param nod  An object implementing the DOM1 |Node| interface.
 * @return     true if the node is:
 *                1) A |Text| node that is all whitespace
 *                2) A |Comment| node
 *             and otherwise false.
 */
function is_ignorable( nod ) {
    return ( nod.nodeType == 8) || // A comment node
        ( (nod.nodeType == 3) && is_all_ws(nod)); // a text node, all ws
}

/**
 * Version of |previousSibling| that skips nodes that are entirely
 * whitespace or comments.  (Normally |previousSibling| is a property
 * of all DOM nodes that gives the sibling node, the node that is
 * a child of the same parent, that occurs immediately before the
 * reference node.)
 * @preserve This function came from:
 * https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Whitespace_in_the_DOM
 * on 2013-06-14 and is available either under the MIT License or is in the
 * public domain (please check the site if the exact license is important to
 * you).
 * @param sib  The reference node.
 * @return     Either:
 *               1) The closest previous sibling to |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function node_before( sib, source ) {
    while ((sib = sib.previousSibling)) {
        if (!is_ignorable(sib) && isFocusable(sib, source)) {
            return sib;
        }
    }
    return null;
}

/**
 * Version of |nextSibling| that skips nodes that are entirely
 * whitespace or comments.
 *
 * @preserve This function came from:
 * https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Whitespace_in_the_DOM
 * on 2013-06-14 and is available either under the MIT License or is in the
 * public domain (please check the site if the exact license is important to
 * you).
 * @param sib  The reference node.
 * @return     Either:
 *               1) The closest next sibling to |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function node_after( sib, source ) {
    while ((sib = sib.nextSibling)) {
        if (!is_ignorable(sib) && isFocusable(sib, source)) {
            return sib;
        }
    }
    return null;
}

/**
 * Version of |lastChild| that skips nodes that are entirely
 * whitespace or comments.  (Normally |lastChild| is a property
 * of all DOM nodes that gives the last of the nodes contained
 * directly in the reference node.)
 *
 * @preserve This function came from:
 * https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Whitespace_in_the_DOM
 * on 2013-06-14 and is available either under the MIT License or is in the
 * public domain (please check the site if the exact license is important to
 * you).
 * @param sib  The reference node.
 * @return     Either:
 *               1) The last child of |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function last_child( par, source ) {
    // If interactive == leaf node; no children
    if(isInteractive(par)) return null;

    var res=par.lastChild;
    while (res) {
        if (!is_ignorable(res) && isFocusable(res, source)) {
            return res;
        }
        res = res.previousSibling;
    }
    return null;
}

/**
 * Version of |firstChild| that skips nodes that are entirely
 * whitespace and comments.
 *
 * @preserve This function came from:
 * https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Whitespace_in_the_DOM
 * on 2013-06-14 and is available either under the MIT License or is in the
 * public domain (please check the site if the exact license is important to
 * you).
 * @param sib  The reference node.
 * @return     Either:
 *               1) The first child of |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function first_child( par, source ) {
    // If interactive == leaf node; no children
    if(isInteractive(par)) return null;

    var res=par.firstChild;
    while (res) {
        if (!is_ignorable(res) && isFocusable(res, source)) {
            return res;
        }
        res = res.nextSibling;
    }
    return null;
}

/**
 * Version of |data| that doesn't include whitespace at the beginning
 * and end and normalizes all whitespace to a single space.  (Normally
 * |data| is a property of text nodes that gives the text of the node.)
 *
 * @preserve This function came from:
 * https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Whitespace_in_the_DOM
 * on 2013-06-14 and is available either under the MIT License or is in the
 * public domain (please check the site if the exact license is important to
 * you).
 * @param txt  The text node whose data should be returned
 * @return     A string giving the contents of the text node with
 *             whitespace collapsed.
 */
function data_of( txt ) {
    var data = txt.data;
    // Use ECMA-262 Edition 3 String and RegExp features
    data = data.replace(/[\t\n\r ]+/g, " ");
    if (data.charAt(0) == " ") {
        data = data.substring(1, data.length);
    }
    if (data.charAt(data.length - 1) == " ") {
        data = data.substring(0, data.length - 1);
    }
    return data;
}

/**
 *
 * @param wrap
 */
function getInnerGrouping(wrap) {
    var first = wrap.first;
    var last = wrap.last;

    // Get inner-most grouping (if possible)
    while(first === last) {
        if(first_child(first) === null || last_child(last) === null) break;
        first = first_child(first);
        last = last_child(last);
    }

    return {first: first, last: last};
}

/**
 * Version of |data| that doesn't include whitespace at the beginning
 * and end and normalizes all whitespace to a single space.  (Normally
 * |data| is a property of text nodes that gives the text of the node.)
 *
 * @preserve This function came from:
 * https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Whitespace_in_the_DOM
 * on 2013-06-14 and is available either under the MIT License or is in the
 * public domain (please check the site if the exact license is important to
 * you).
 * @param startEl  The text node whose data should be returned
 * @param source ['nav'|'point'} Navigation method passed from calling function
 * @return {object|[object, object]|null} Returns node, element, an element to-from, or null (for end of document)
 */
function getNextNodes(startEl, source) {
    // Through recursion, reached end of document.
    if(startEl === null) return null;

    if(startEl.last !== undefined) startEl = startEl.last;

    var first = node_after(startEl, source);
    if(first === null) {
        // Fall back onto the parent; no first el exists at this level
        return getNextNodes(startEl.parentNode, source);
    }
    // First el exists, so check if child of first el exists
    while(first_child(first, source) !== null && !areAllChildrenInline(first, source)) {
        first = first_child(first, source);
    }

    var last = first;

    if(isInlineElement(first, source)) {
        while(node_after(last, source) !== null && isInlineElement(node_after(last, source), source)) {
            last = node_after(last, source);
        }
    }

    return getInnerGrouping({first: first, last: last});
}

/**
 * Version of |data| that doesn't include whitespace at the beginning
 * and end and normalizes all whitespace to a single space.  (Normally
 * |data| is a property of text nodes that gives the text of the node.)
 *
 * @preserve This function came from:
 * https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/Whitespace_in_the_DOM
 * on 2013-06-14 and is available either under the MIT License or is in the
 * public domain (please check the site if the exact license is important to
 * you).
 * @param startEl  The text node whose data should be returned
 * @param source ['nav'|'point'} Navigation method passed from calling function
 * @return {{first: Node, last: Node}|null} Returns an element to-from, or null (for end of document)
 */
function getPrevNodes(startEl, source) {
    // Through recursion, reached end of document.
    if(startEl === null) return null;

    if(startEl.first !== undefined) startEl = startEl.first;

    var last = node_before(startEl, source);
    if(last === null) {
        // Fall back onto the parent; no first el exists at this level
        return getPrevNodes(startEl.parentNode, source);
    }
    // First el exists, so check if child of first el exists
    while(last_child(last, source) !== null && !areAllChildrenInline(last, source)) {
        last = last_child(last, source);
    }

    var first = last;

    if(isInlineElement(first, source)) {
        while(node_before(first, source) !== null && isInlineElement(node_before(first, source), source)) {
            first = node_before(first, source);
        }
    }

    return getInnerGrouping({first: first, last: last});
}

/**
 * Gets the first node (or range of nodes) that is navigable
 * @param start The starting element. If wanting first node, start === document.body.
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {Element|{first: Node, last: Node}} Reference to first (or range) of navigable nodes
 */
function getFirstElement(start, source) {

    var first = first_child(start, source);

    if(first === null || orphanTxtNode(first)) {
        var last = start;
        while(isInlineElement(node_after(last, source), source)) {
            last = node_after(last);
        }

        return getInnerGrouping({first: start, last: last});

    }
    else return getFirstElement(first, source);
}

function orphanTxtNode( nod ) {
    return node_before(nod) === null && node_after(nod) === null && nod.nodeType === 3;
}

/**
 * Gets the last node (or range of nodes) that is navigable
 * @param start The starting element. If wanting last node, start === document.body.
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {Element|{first: Node, last: Node}} Reference to first (or range) of navigable nodes
 */
function getLastElement(start, source) {

    var last = last_child(start, source);

    if(last === null || orphanTxtNode(last)) {
        var first = start;
        while(isInlineElement(node_before(first, source), source)) {
            first = node_before(first);
        }
        return getInnerGrouping({first: first, last: start});
    }
    else return getLastElement(last, source);
}

/**
 * Gets the maskId to select
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {HTMLElement} The maskId reference
 */
function getNextSelection(source) {
    var fromEl = last_child(selectEl);

    strip_masking();

    var selectedNodes = getNextNodes(fromEl, source);
    if (selectedNodes === null) return null;
    else return mask_DOMObjs(selectedNodes);
}

/**
 * Gets the maskId to select
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {HTMLElement} The maskId reference
 */
function getPrevSelection(source) {
    var fromEl = first_child(selectEl);

    strip_masking();

    var selectedNodes = getPrevNodes(fromEl, source);
    if (selectedNodes === null) return null;
    else return mask_DOMObjs(selectedNodes);
}

/**
 * Gets the maskId to select
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {HTMLElement} The maskId reference
 */
function getFirstSelection(source) {

    strip_masking();

    var selectedNodes = getFirstElement(document.body, 'nav');
    if (selectedNodes === null) return null;
    else return mask_DOMObjs(selectedNodes);
}

/**
 * Gets the maskId to select
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {HTMLElement} The maskId reference
 */
function getLastSelection(source) {

    strip_masking();

    var selectedNodes = getLastElement(document.body, 'nav');
    if (selectedNodes === null) return null;
    else return mask_DOMObjs(selectedNodes);
}

/**
 * Masks either a range of nodes (with the same parents) inclusively from first to last, or one node
 * @param {Element|{first: Node, last Node}} wrap The range of nodes (or just node)
 * @returns {HTMLElement} The masked element reference with the nodes masked inside
 */
function mask_DOMObjs(wrap) {

    var first = wrap.first;
    var last = wrap.last;

    if(first.parentElement !== last.parentElement) throw new Error('DOM Objects must have same parent');

    var parentEl = first.parentElement;

    var maskEl = document.createElement('span');
    maskEl.id = maskId;

    parentEl.insertBefore(maskEl, first);

    var next = first;
    while(next !== last) {
        var insert = next;
        next = next.nextSibling;
        maskEl.insertBefore(insert, null);
    }
    maskEl.insertBefore(last, null); // Mask last element

    return maskEl;

}

/**
 * Removes maskId span el, and replaces it with child nodes inside.
 */
function strip_masking() {
    var maskEl = document.getElementById(maskId);

    if(maskEl !== null) {
        while(maskEl.childNodes.length !== 0) {
            maskEl.parentElement.insertBefore(maskEl.firstChild, maskEl);
        }

        maskEl.parentElement.removeChild(maskEl);

    }
}

/**
 * Starts EZ Access navigation on the current page, whether automatically or from an EZ Access keypress.
 * @param {boolean} propagated Whether or not the EZ Access was enabled previously (startid depends on this, and some other
 * things like a url with a #element reference do as well.
 */
function ez_navigate_start(propagated) {
	ez_navigateToggle = true;
	sessionStorage.setItem("EZ_Toggle", "1");
	if(document.body.hasAttribute('data-ez-startat')) {
        var startid;
		if(propagated) {
			// Of "#<id> #<id>" of second element
			startid = document.body.getAttribute('data-ez-startat').split(" ")[1].slice(1);
		} else {
			// Of "#<id> #<id>" of first element
            startid = document.body.getAttribute('data-ez-startat').split(" ")[0].slice(1);
		}
		ez_jump(startid);
	} else {
		if(propagated) {
			if(document.URL.indexOf("#") != -1) {
				var jumpTo = document.URL.substring(document.URL.indexOf("#") + 1);
                ez_jump(jumpTo);
			}
		}
	}
	// TODO auto_advance_set(); // Find if autoadvancing element

    if(selectEl === null) {
        selectEl = mask_DOMObjs(getFirstElement(document.body, 'nav'));
    }

	if(!propagated) {
		sounds[getElementAudio()].feed.play();
	}
	drawSelected(selectEl);
	voice(selectEl, 'nav');
}

/**
 * Loads one-time stuff to start EZ Access (such as audio, multitouch library & external JSON data).
 * Determines if EZ Access should be started by default (or just loaded).
 */
function load_ez() {
	if(document.body.hasAttribute('data-ez-allowreorder')) {
		allowReorder = true;
	}

	if(document.body.getAttribute('data-ez-autorepeat') === 'keyboard') {
		autoRepeat = 'keyboard';
	} else if(document.body.getAttribute('data-ez-autorepeat') === 'on') {
		autoRepeat = 'on';
	}

	var lastEvent;
	var heldKeys = {};
	map = {}; // Have to do this weird thing in order to detect two keys at same time (e.g., shift+tab)
	onkeydown = function (event) {
        autoAdvance = 0; // Stop any autoadvancing timers
		window.clearInterval(autoAdvTimer);
		if(autoRepeat == 'keyboard') {
            return1 = multikey_event(event);
		} else if(autoRepeat == 'on') {
			return1 = multikey_event(event);
            return2 = key_event(event);
		}
		if(lastEvent && lastEvent.keyCode == event.keyCode) {
			return false;
		}
		lastEvent = event;
		heldKeys[event.keyCode] = true;
		if(autoRepeat == 'off') {
			return1 = multikey_event(event);
			return2 = key_event(event);
		} else if(autoRepeat == 'keyboard') {
			return2 = key_event(event);
		}
        if (!(return1 && return2)) {
            return false;
        }
	};
	onkeyup = function (event) {
		multikey_event(event);
		lastEvent = null;
		delete heldKeys[event.keyCode];
		return false;
	};

	load_audio();

	set_volume(); // If exists from previous page

	// "Universal" body tag stuff
	if(document.body.hasAttribute('data-ez-screenwrap')) {
		screenWrap = true;
	}

	// Not actually implemented yet (just default is)
	if(document.body.getAttribute('data-ez-tabnav') == 'standard') {
		tabNav = 'standard';
	} else if(document.body.getAttribute('data-ez-tabnav') == 'hybrid') {
		tabNav = 'hybrid';
	} else if(document.body.getAttribute('data-ez-tabnav') == 'none') {
		tabNav = 'none';
	}

	if(document.body.getAttribute('data-ez-slidetoread') == 'off') {
		slideToRead = false;
	}
	if(document.body.getAttribute('data-ez-startingmode') == 'ezon') {
		// On chrome, will not draw until a small amount of time passes for some reason
		setTimeout(function () {
			ez_navigate_start();
			drawSelected(selectEl);
		}, 10);
	} else if(parseInt(sessionStorage.getItem("EZ_Toggle")) == true && document.body.getAttribute('data-ez-startingmode') != 'ezoff') {
		setTimeout(function () {
			ez_navigate_start(true);
			drawSelected(selectEl);
		}, 10);
	}

	//idle_loop(); // TODO/ TEMP

	// Multitouch gesture dragging
    /* TODO
	if(slideToRead) { // If not allowed, do not initialize
		var hammer = new Hammer(document.body);
		hammer.ondrag = function (ev) {
			var currElement = selectElements[currIndex];
			index_ez();
			currIndex = 0;
			for(var i = 0; i < selectElements.length; i++) {
				if(selectElements[i] == currElement) {
					currIndex = i;
				}
			}
			mouseOver(document.elementFromPoint(parseFloat(ev.position.x) - parseFloat(window.scrollX), parseFloat(ev.position.y) - parseFloat(window.scrollY)));
		};
		hammer.ontap = function () {
			stopEZ();
		};
	}*/

	// Load any potential dictionary
	if(document.body.hasAttribute('data-ez-pronounce')) {
		Lib.ajax.getJSON({
			url: document.body.getAttribute('data-ez-pronounce'),
			type: 'json'
		}, function (getDictionary) {
			dictionary = JSON.parse(getDictionary);
		});
	}
}

/**
 * Draws selected box around DOM object referenced to. Creates selected box if & inserts into DOM if it doesn't
 * previously exist.
 * @param {object} obj DOM Object to draw box selected box around.
 * @returns {boolean} If finding dimensions of element failed (such as if hidden).
 */
function drawSelected(obj) {
	//var tmp = obj.style.display;  // INLINE BLOCK OUTLINE FIXER
	//obj.style.display = "inline-block"; // INLINE BLOCK OUTLINE FIXER
	var pos = getElementAbsolutePos(obj);
	if(!pos || obj.offsetWidth == 0 || obj.offsetWidth == 0) {
		// If there is a problem finding the element position
		return false;
	}
	var old = document.getElementById(ezSelectorId);
	if(old === null) {
		var div = document.createElement('div');
		div.setAttribute("data-ez-focusable", "false");
		var rgb = "rgba(" + hexToRgb(EzCustomColor).r + "," + hexToRgb(EzCustomColor).g + "," + hexToRgb(EzCustomColor).b + ",";
		var rgbinverse = "rgba(" + (255 - hexToRgb(EzCustomColor).r) + "," + (255 - hexToRgb(EzCustomColor).g) + "," + (255 - hexToRgb(EzCustomColor).b) + ",";
		// Load the CSS pulsing Stuff
		var cssAnimation = document.createElement('style');
		cssAnimation.type = 'text/css';
		var rules = document.createTextNode('@-webkit-keyframes pulse {' +
			'from { border:5px solid ' + rgb + '1); }' +
			'50% { border:5px solid ' + rgbinverse + '0.5); }' +
			'to { border:5px solid ' + rgb + '0); }' +
			'}');
		cssAnimation.appendChild(rules);
		document.getElementsByTagName("head")[0].appendChild(cssAnimation);

		div.style.border = "5px solid " + rgb + "1)";
		div.style['boxShadow'] = "0px 0px 15px 5px " + rgb + ".80)";
		div.id = ezSelectorId;
		if(document.body.firstChild) {
			document.body.insertBefore(div, document.body.firstChild);
		} else {
			document.body.appendChild(div);
		}
		old = document.getElementById(ezSelectorId); // Redefine the new selected div
	}
	old.style.visibility = "visible";
	old.style.left = pos.x - 10 + 'px';
	old.style.top = pos.y - 10 + 'px';
	old.style.width = obj.offsetWidth + 10 + 'px';
	old.style.height = obj.offsetHeight + 10 + 'px';
	//obj.style.display = tmp; // INLINE BLOCK OUTLINE FIXER
	return true;
}

/**
 * Event listener if window is resized ==> The selected box will be redrawn.
 */
window.onresize = function () {
	if(ez_navigateToggle) {
		drawSelected(getBlock(selectEl));
	}
};

/**
 * Stops EZ Access navigation, hides EZ Access selector and resets variables.
 */
function stopEZ() {
	ez_navigateToggle = false;
	idle_loop();
    selectEl = null;
	voice("");
	sessionStorage.setItem("EZ_Toggle", "0");
	var old = document.getElementById(ezSelectorId);
	if(old !== null) {
		old.style.visibility = "hidden";
		old.style.left = 0 + "px";
		old.style.top = 0 + "px";
		old.style.width = 0 + "px";
		old.style.height = 0 + "px";
	}
}