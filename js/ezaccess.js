/*----------------------------------------------------------------------------------------------------------------------
 |  COPYRIGHT       (c) 2012 - 2013 Trace Research and Development Center,
 |                  The Board of Regents of the University of Wisconsin System.
 |                  All rights reserved.
 |
 |  LICENSE         New BSD License
 |
 |  CODE            Alexander Harding and Bern Jordan
 |  SPECIFICATIONS  Bern Jordan
 |
 |  FILE            ezaccess.js
 |  DESCRIPTION     This file contains the low-level DOM parsing for the current page, including deciding where to
 |                  move the highlight to, and the process of actually doing so. This file also manages
 |                  loading of EZ Access content pages & initialization.
 *--------------------------------------------------------------------------------------------------------------------*/


/**
 * The DOM node(s), if any, in order, on the page being highlighted.
 * @type {Array}
 */
var selectedEls = [];

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
 * Whether EZ is loaded
 * @type {boolean}
 */
var ez_loaded = false;

/**
 * Whether the EZ Access Debug Mode is enabled from the options
 * @type {boolean}
 */
var debugMode = false;

/**
 * To decide if touched element or nothing happened (drag).
 * @type {Boolean}
 */
var touchTap = true;

/**
 * Time first 'tapped'
 * @type {number}
 */
var touchStartTime = 0;

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
 * NOTE: 'image' refers to the <input type="image">, and not the <img> tag (which
 * getType returns as 'img')
 * Multiselect refers to a <select> element with the 'multiple' attribute
 */
var INTERACTIVE_TYPES = [
    'checkbox', 'radio', 'select', 'multiselect', 'button', 'submit', 'reset',
    'range', 'number', 'image',
    'text', 'password', 'email', 'search', 'url', 'tel', 'textarea',
    'hyperlink'];

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
    'font', 'i',
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
 * An array/list of tags that encapsulate data (or encapsulate nothing)
 * that does not make sense to be navigated by the user.
 * @const
 */
var UNNAVIGABLE_TAGS = [
    'hr', 'br',
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
 * @param source {'nav'|'point'} Navigation method passed from calling function
 * @return {boolean} Whether o is focusable with EZ Access navigation.
 */
function isFocusable(o, source) {
    'use strict';

    // Look for nodes and elements only; return false otherwise
    if (o === document.doctype) return false; // For some reason this isn't caught below + can cause exceptions
    else if (isElement(o));
    else if (isNode(o)) return !isMumboJumbo(o.data);
    else return false;

    if (source === undefined) source = 'nav';

    if (SKIPPED_TAGS.indexOf(o.tagName.toLowerCase()) !== -1) {
        return false;
    }

    if (o.hasAttribute('aria-flowto')) return true;

    if (o.hasAttribute('id')) {
        if (ariaFlowFrom(o.getAttribute('id')) !== null) return true;
    }

    // If grouped at a higher level
    if (isParentGrouped(o)) return false;

    var attr = '';

    /**
     * Check to see if immediate element is focusable or not.
     * More specific attributes should override less specific ones.
     * data-ez-focusable* attributes should override aria-hidden.
     */
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


    attr = '';

    if (o.hasAttribute('aria-hidden')) {
        attr = o.getAttribute('aria-hidden');
    }
    if (attr === 'true') {
        return false;
    }

    var voiced = voice_element(o, source);
    if (isMumboJumbo(voiced)) return false;

    // If hidden
    if (o.hasAttribute('hidden')) return false;

    // If css hidden
    if (o.style.display === 'none') return false;

    // If css invisible
    if (o.style.visibility === 'hidden') return false;

    // If hidden input tag
    if (o.tagName === 'INPUT' && o.type === 'hidden') {
        return false;
    }

    //Check recursively to see if the parents are focusable
    var parent = o.parentElement;
    if (parent === null || parent.tagName === 'BODY') {
        return true; //by default element is focusable if nothing to inherit
    }
    return isFocusable(parent);
}

/**
 *  Punctuation mumbo-jumbo is not highlighteable.
 * @param str String to check
 * @returns {boolean} If mumbo jumbo or not
 */
function isMumboJumbo(str) {
    str = str.replace(/<(?:.|\n)*?>/gm, '');
    str = str.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    str = str.replace('|', '');
    str = str.replace(/\s{2,}/g, " ");
    return str.length <= 1;
}

//Returns true if it is a DOM node
function isNode(o) {
    return (
        typeof Node === "object" ? o instanceof Node :
            o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
        );
}

//Returns true if it is a DOM element
function isElement(o) {
    return (
        typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string"
        );
}

/**
 * Checks to see if the DOM Object o is a supported interactive element.
 * This function does not check to see if o is a disabled input or not.
 * (For that, use isUserEditable().)
 * @author J. Bern Jordan, Alexander Harding
 * @param {object} o The DOM object to be checked.
 * @return {boolean} Whether o is a supported interactive element.
 */
function isInteractive(o) {
    'use strict';

    // Look for nodes and elements only; return false otherwise
    if (isElement(o));
    else if (isNode(o)) o = o.parentElement;
    else return false;

    if (o.hasAttribute('onlick')) {
        return true;
    }
    return INTERACTIVE_TYPES.indexOf(getType(o)) > -1;
}

/**
 * Checks to see if the element passed can be edited, changed, or otherwise
 * interacted with by the user.
 * @author J. Bern Jordan
 * @param {object} obj The DOM object to check.
 * @return {boolean} Whether the element can be edited.
 */
function isUserEditable(obj) {
    //Non-interactive elements cannot be edited
    if (!isInteractive(obj)) {
        return false;
    }

    if (obj.hasAttribute('readonly') || obj.hasAttribute('disabled')) {
        return false;
    }
    if (obj.hasAttribute('aria-readonly')) {
        return !Boolean(obj.getAttribute('aria-readonly'));
    }
    if (obj.hasAttribute('aria-disabled')) {
        return !Boolean(obj.getAttribute('aria-disabled'));
    }
    else return true;
}

/**
 * Returns true if grouped through being inline or ez attributes.
 * @param {object} o A Node object or DOM element to be checked.
 * @param {'nav'|'point'} source Navigation method passed from calling function
 * @returns {boolean} If grouped o
 */
function isGrouped(o) {

    var ezGroup = false;
    if (isElement(o) && o.hasAttribute('data-ez-chunking')) {
        ezGroup = o.getAttribute('data-ez-chunking') === 'group';
    }

    return isInteractive(o) || ezGroup;
}

/**
 * Looks to see if inherits a grouping element. DOES NOT check itself!
 * @param o Object to check.
 * @returns {boolean} True if grouped via EZ Access, interactive element, etc.
 */
function isParentGrouped(o) {
    while (o !== null) {
        o = o.parentElement;
        if (isGrouped(o)) return true;
    }
    return false;
}

/**
 * Returns true iff o contains one child element.
 *
 * @param o
 * @returns {boolean}
 */
function oneChild(o) {
    return (first_child(o) === last_child(o)) && isElement(first_child(o));
}

/**
 * Returns the childmost element that is the only child.
 * @param o
 * @returns {Element}
 */
function singleChildMost(o) {
    if (!oneChild(o)) return o;
    return singleChildMost(first_child(o));
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
    if (isElement(o));
    else return isNode(o);

    if (source === undefined) source = 'nav';

    if (o.nodeType !== 1) {
        if (o.nodeType === 3) {
            return true; //text node can be inline with other nodes
        } //else
        throw new Error('Node not a DOM or text node.');
    } //Else: o is a DOM element

    // If "alone", get "deepest" element
    o = singleChildMost(o);

    /** Grouped elements should not be inline with other elements */
    if (isGrouped(o)) {
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
 * Checks all elements of an array to see if all of them are either
 * inline or have "display: none".
 * @author J. Bern Jordan
 * @param o {Array} Array of nodes to be checked
 * @param source ['nav'|'point'} Navigation method passed from calling function
 */
function areAllChildrenInline(o, source) {
    'use strict';

    var children = getChildNodes(o);

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
function getChildNodes(nod, source) {
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
function is_all_ws(nod) {
    return !(/[^\t\n\r ]/.test(nod.data));
}

/**
 * Determine if too short
 * @param nod A node implementing the |CharacterData| interface (i.e.,
 *            a |Text|, |Comment|, or |CDATASection| node
 * @returns {boolean} Returns true if length <= 1 indicating that it probably shouldn't be navigable.
 */
function is_all_punct(nod) {
    if (nod.data === undefined) return false;
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
function is_ignorable(nod) {
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
 * @param source {'nav'|'point'} The EZ Access navigation method
 * @return     Either:
 *               1) The closest previous sibling to |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function node_before(sib, source) {
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
 * @param source {'nav'|'point'} The navigation method
 * @return     Either:
 *               1) The closest next sibling to |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function node_after(sib, source) {
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
function last_child(par, source) {
    // If isGrouped == leaf node; no children
    if (isGrouped(par)) return null;

    var res = par.lastChild;
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
 * @param par  The reference node.
 * @param source {'nav'|'point'} The EZ Access navigation method
 * @return     Either:
 *               1) The first child of |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function first_child(par, source) {
    // If isGrouped == leaf node; no children
    if (isGrouped(par)) return null;

    var res = par.firstChild;
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
function data_of(txt) {
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
 * Gives an array of the nodes between the first and last node.
 * NOTE: Nodes MUST be on the same level (same parent).
 * @param first First node (inclusive)
 * @param last Last node (inclusive)
 * @returns {Array} Array of all sibling nodes betweeen.
 */
function getChildNodRange(first, last) {
    var ret = [];
    var obj = first;

    while (obj !== last) {
        ret.push(obj);
        obj = node_after(obj);
        if (obj === null) throw new Error("Invalid range object!" + first + last);
    }
    ret.push(obj);

    return ret;
}

/**
 * If one element is selected, this function can be helpful to 'navigate' inside it and provide a more detailed
 * selection.
 * For example, [nod] is not as helpful as [nod.sibling[0], nod.sibling[1], nod.sibling[n]) in terms of parsing +
 * drawing the node selection on the screen.
 * @param e
 */
function getInnerGrouping(e) {
    var first = e[0];
    var last = e[e.length - 1];


    // Get inner-most grouping (if possible)
    while (first === last) {
        if (first_child(first) === null || last_child(last) === null) break;
        first = first_child(first);
        last = last_child(last);
    }

    return getChildNodRange(first, last);
}

/**
 * Gets the next node/nodes, if possible, from a starting element.
 * By intended bahavior, this function considers the next sibling (if available) at that level,
 * and then navigates inside to the first child as deep as possible. If not possible, it goes to the parent
 * and gets the next sibling of the parent.
 * Lastly, the function checks if that one node is 'groupeable', and if so, if the next node(s) are too.
 * @param startEl  The text node whose data should be returned
 * @param source ['nav'|'point'} Navigation method passed from calling function
 * @return {Array|null} Returns an array of node(s), or null (for end of document)
 */
function getNextNodes(startEl, source) {

    // Through recursion, reached end of document.
    if (startEl === null) return [];

    var first = node_after(startEl, source);
    if (first === null) {
        // Fall back onto the parent; no first el exists at this level
        return getNextNodes(startEl.parentNode, source);
    }
    // First el exists, so check if child of first el exists
    while (first_child(first, source) !== null && !areAllChildrenInline(first, source)) {
        first = first_child(first, source);
    }

    // By this point, we have the 'first' node
    var ret = [first];

    if (isInlineElement(first, source)) {
        while (node_after(ret[ret.length - 1], source) !== null && isInlineElement(node_after(ret[ret.length - 1], source), source)) {
            ret.push(node_after(ret[ret.length - 1], source));
        }
    }

    return getInnerGrouping(ret);
}

/**
 * Gets the previous node/nodes, if possible, from a starting element.
 * By intended bahavior, this function considers the previous sibling (if available) at that level,
 * and then navigates inside to the last child as deep as possible. If not possible, it goes to the parent
 * and gets the previous sibling of the parent.
 * Lastly, the function checks if that one node is 'groupeable', and if so, if the next node(s) are too.
 * @param startEl  The text node whose data should be returned
 * @param source ['nav'|'point'} Navigation method passed from calling function
 * @return {Array|null} Returns an array of node(s), or null (for end of document)
 **/
function getPrevNodes(startEl, source) {
    // Through recursion, reached end of document.
    if (startEl === null) return [];

    var last = node_before(startEl, source);
    if (last === null) {
        // Fall back onto the parent; no first el exists at this level
        return getPrevNodes(startEl.parentNode, source);
    }
    // First el exists, so check if child of first el exists
    while (last_child(last, source) !== null && !areAllChildrenInline(last, source)) {
        last = last_child(last, source);
    }

    // By this point, we have the 'last' node
    var ret = [last];

    if (isInlineElement(last, source)) {
        while (node_before(ret[0], source) !== null && isInlineElement(node_before(ret[0], source), source)) {
            ret.unshift(node_before(ret[0], source));
        }
    }

    return getInnerGrouping(ret);
}

/**
 * Gets the first node (or range of nodes) that is navigable
 * @param start The starting element. If wanting first node, start === document.body.
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {Array} Reference to first (or range) of navigable nodes
 */
function getFirstElement(start, source) {

    var first = first_child(start, source);

    if (first === null || orphanTxtNode(first)) {
        var ret = [start];
        if (isInlineElement(start, source)) {
            while (isInlineElement(node_after(ret[ret.length - 1], source), source)) {
                ret.push(node_after(ret[ret.length - 1]));
            }
        }
        return getInnerGrouping(ret);

    }
    else return getFirstElement(first, source);
}

/**
 * Looks to see if orphan. This is useful if we have something like:
 * <h1>Hello! Blah</h1>
 * Where <h1>[text]</h1> is the element containing the oprhan node, and
 * "Hello! Blah" is the orphaned node.
 * @param nod
 * @returns {boolean}
 */
function orphanTxtNode(nod) {
    return node_before(nod) === null && node_after(nod) === null && nod.nodeType === 3;
}

/**
 * Gets the last node (or range of nodes) that is navigable
 * @param start The starting element. If wanting last node, start === document.body.
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {Array} Reference to first (or range) of navigable nodes
 */
function getLastElement(start, source) {

    var last = last_child(start, source);

    if (last === null || orphanTxtNode(last)) {
        var ret = [start];
        if (isInlineElement(start, source)) {
            while (isInlineElement(node_before(ret[0], source), source)) {
                ret.unshift(node_before(ret[0]));
            }
        }
        return getInnerGrouping(ret);
    }
    else return getLastElement(last, source);
}

/**
 * Gets the maskId to select
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {Array} The maskId reference
 */
function getNextSelection(source) {

    var fromEl = selectedEls[selectedEls.length - 1];
    var actionable = getActionableElement(selectedEls, 'nav');

    var selectedNodes;

    var nod = null;
    if (actionable.hasAttribute('aria-flowto')) {
        nod = document.getElementById(actionable.getAttribute('aria-flowto'));
    }

    if (nod !== null) {
        selectedNodes = getInnerGrouping([nod]);
    } else {
        selectedNodes = getNextNodes(fromEl, source);
    }

    return selectedNodes;
}

/**
 * Gets the maskId to select
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {Array} The maskId reference
 */
function getPrevSelection(source) {

    var fromEl = selectedEls[0];
    var actionable = getActionableElement(selectedEls, 'nav');

    var selectedNodes;


    var nod = null;
    if (actionable.hasAttribute('id')) nod = ariaFlowFrom(actionable.getAttribute('id'));

    if (nod !== null) {
        selectedNodes = getInnerGrouping([nod]);
    } else {
        selectedNodes = getPrevNodes(fromEl, source);
    }

    return selectedNodes;
}

/**
 * Returns node that aria-flowto references from given id
 * @param id ID to be checked if flow'd-from
 * @returns {Node} Returns el with aria-flowto = id
 */
function ariaFlowFrom(id) {
    return document.querySelector("[aria-flowto~='" + id + "']");
}

/**
 * Gets the maskId to select
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {Array} The maskId reference
 */
function getFirstSelection(source) {

    return getFirstElement(document.body, source);

}

/**
 * Gets the maskId to select
 * @param {'nav'|'point'} source Method of navigating initiated from.
 * @returns {Array} The maskId reference
 */
function getLastSelection(source) {

    return getLastElement(document.body, source);

}

/**
 * Masks either a range of nodes (with the same parents) inclusively from first to last, or one node
 * @param {Element|{first: Node, last Node}} wrap The range of nodes (or just node)
 * @returns {HTMLElement} The masked element reference with the nodes masked inside
 */
function mask_DOMObjs(wrap) {

    var first = wrap.first;
    var last = wrap.last;

    if (first.parentElement !== last.parentElement) throw new Error('DOM Objects must have same parent');

    var parentEl = first.parentElement;

    var maskEl = document.createElement('span');
    maskEl.id = maskId;

    parentEl.insertBefore(maskEl, first);

    var next = first;
    while (next !== last) {
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

    if (maskEl !== null) {
        while (maskEl.childNodes.length !== 0) {
            maskEl.parentElement.insertBefore(maskEl.firstChild, maskEl);
        }

        maskEl.parentElement.removeChild(maskEl);

    }
}

/**
 * Starts EZ Access navigation on the current page, whether automatically or from an EZ Access keypress.
 * @param {boolean} propagated Whether or not the EZ Access was enabled previously (startid depends on this, and some other
 * things like a url with a #element reference do as well.
 * @param {'nav'|'point'} source The navigation method
 */
function ez_navigate_start(propagated, source) {
    ez_navigateToggle = true;
    sessionStorage.setItem("EZ_Toggle", "1");

    // Reset edge nav attempts
    edgeNavAttempt = -1;

    var obj;
    if (document.body.hasAttribute('data-ez-startat')) {
        var startid;
        if (propagated) {
            // Of "#<id> #<id>" of second element
            startid = document.body.getAttribute('data-ez-startat').split(" ")[1].slice(1);
        } else {
            // Of "#<id> #<id>" of first element
            startid = document.body.getAttribute('data-ez-startat').split(" ")[0].slice(1);
        }
        obj = document.getElementById(startid);
        if (obj !== null) ez_jump([obj], source);
    } else {
        if (propagated) {
            if (document.URL.indexOf("#") != -1) {
                var jumpTo = document.URL.substring(document.URL.indexOf("#") + 1);
                obj = document.getElementById(jumpTo);
                if (obj !== null) ez_jump([obj], source);
            }
        }
    }

    // TODO auto_advance_set(); // Find if autoadvancing element

    // Start navigation
    ez_navigate('top', {alert: !propagated});

}

/**
 * Loads one-time stuff to start EZ Access (such as audio, multitouch library & external JSON data).
 * Determines if EZ Access should be started by default (or just loaded).
 */
function load_ez() {

    // EZ TIMEOUT DIALOGUE
    if (document.body.hasAttribute('data-ez-allowreorder')) {
        allowReorder = true;
    }

    if (document.body.hasAttribute('data-ez-timeout')) {
        idleSpeech = document.body.getAttribute('data-ez-timeout')
    }

    if (document.body.hasAttribute('data-ez-timeout-delay')) {
        var parseAttr = document.body.getAttribute('data-ez-timeout-delay').split(' ');

        if(parseAttr.length >= 1) {
            if (!isNaN(parseAttr[0])) {
                idleDelay = Number(parseAttr[0]);
            }
        }
        if(parseAttr.length >= 2) {
            if (!isNaN(parseAttr[1])) {
                idleDelayAfter = Number(parseAttr[1]);
            }
        }
    }

    if (document.body.hasAttribute('data-ez-timeout-href')) {
        idleTimeoutHref = document.body.getAttribute('data-ez-timeout-href');
    }

    // EZ IDLESPEECH
    if (document.body.hasAttribute('data-ez-idlespeech')) {
        idleVoiceSpeech = document.body.getAttribute('data-ez-idlespeech')
    }

    if (document.body.hasAttribute('data-ez-idlespeech-delay')) {
        if (!isNaN(document.body.getAttribute('data-ez-idlespeech-delay'))) {
            beginIdleTimerInterval = Number(document.body.getAttribute('data-ez-idlespeech-delay'));
        }
    }

    if (document.body.hasAttribute('data-ez-idlespeech-loop')) {
        beginIdleTimerLoop = document.body.getAttribute('data-ez-idlespeech-loop') === 'true';
        //so that an invalid value will default to 'false'
    }


    if (document.body.getAttribute('data-ez-autorepeat') === 'keyboard') {
        autoRepeat = 'keyboard';
    } else if (document.body.getAttribute('data-ez-autorepeat') === 'on') {
        autoRepeat = 'on';
    }

    var lastEvent;
    var heldKeys = {};
    map = {}; // Have to do this weird thing in order to detect two keys at same time (e.g., shift+tab)
    onkeydown = function (event) {
        autoAdvance = 0; // Stop any autoadvancing timers
        window.clearInterval(autoAdvTimer);
        if (autoRepeat == 'keyboard') {
            return1 = multikey_event(event);
        } else if (autoRepeat == 'on') {
            return1 = multikey_event(event);
            return2 = key_event(event);
        }
        if (lastEvent && lastEvent.keyCode == event.keyCode) {
            return false;
        }
        lastEvent = event;
        heldKeys[event.keyCode] = true;
        if (autoRepeat == 'off') {
            return1 = multikey_event(event);
            return2 = key_down_event(event);
        } else if (autoRepeat == 'keyboard') {
            return2 = key_event(event);
        }
        if (!(return1 && return2)) {
            return false;
        }
    };
    onkeyup = function (event) {
        key_up_event(event);
        multikey_event(event);
        lastEvent = null;
        delete heldKeys[event.keyCode];
        return false;
    };

    load_audio();

    set_volume(); // If exists from previous page

    // "Universal" body tag stuff
    if (document.body.hasAttribute('data-ez-screenwrap')) {
        screenWrap = true;
    }

    // Not actually implemented yet (just default is)
    if (document.body.getAttribute('data-ez-tabnav') == 'standard') {
        tabNav = 'standard';
    } else if (document.body.getAttribute('data-ez-tabnav') == 'hybrid') {
        tabNav = 'hybrid';
    } else if (document.body.getAttribute('data-ez-tabnav') == 'none') {
        tabNav = 'none';
    }

    if (document.body.getAttribute('data-ez-slidetoread') == 'off') {
        slideToRead = false;
    }
    if (document.body.getAttribute('data-ez-start') == 'on') {
        // On chrome, will not draw until a small amount of time passes for some reason
        setTimeout(function () {
            ez_navigate_start(false, 'nav');
            drawSelected(selectedEls);
        }, 10);
    } else if (parseInt(sessionStorage.getItem("EZ_Toggle")) == true && document.body.getAttribute('data-ez-start') != 'off') {
        setTimeout(function () {
            ez_navigate_start(true, 'nav');
            drawSelected(selectedEls);
        }, 10);
    }

    if(!document.body.hasAttribute('data-ez-reset') || document.body.getAttribute('data-ez-reset') === 'false') {
        ezBackEnabled = true;
        audioVolume = 100;
        set_volume();
    }

    resetTimeouts();
    document.onmousemove = function() { resetTimeouts(); };

    // Touch gesture dragging
    if (slideToRead) {
        document.addEventListener('touchmove', function (e) {
            resetTimeouts();

            e = e || window.event;

            var target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            if ((selectedEls.length !== 1 || selectedEls[0] != target) && new Date().getTime() - touchStartTime > 250) {
                if (!ez_loaded) load_ez();
                target = jumpToElFinder(target);
                if (target !== null) {
                    ez_navigateToggle = true;
                    ez_jump([target], 'point');
                }
                touchTap = false;
            }
        }, false);

        document.addEventListener('touchstart', function (e) {
            resetTimeouts();

            touchStartTime = new Date().getTime();

            touchTap = true;

        });

        document.addEventListener('touchend', function (e) {
            if (touchTap === true || new Date().getTime() - touchStartTime < 250) { // If not 'dragged' or quickly 'dragged'
                if (!tinyHelpOpen) stopEZ();
            }
        });

    }

    // Mouse clicks always turn off EZ Access
    document.addEventListener('mousedown', function (e) {
        stopEZ();
    });

    // Load any potential dictionary
    if (document.body.hasAttribute('data-ez-pronounce')) {
        Lib.ajax.getJSON({
            url: document.body.getAttribute('data-ez-pronounce'),
            type: 'json'
        }, function (getDictionary) {
            dictionary = JSON.parse(getDictionary);
        });
    }

    ez_loaded = true;
}

/**
 *
 * @param e Determines if given Element is valid for highlighting (a 'leaf' node or something)
 * @returns {Element}null} Null if not valid, e if it is.
 */
function jumpToElFinder(e) {

    if (e === null) return null;

    var children = getChildNodes(e);
    if (children !== null) {
        var allInline = true;
        for (i = 0; i < children.length; i++) {
            if (!isInlineElement(children[i])) {
                allInline = false;
                break;
            }
        }
        if (allInline === true && isFocusable(e)) return e;
    }

    if (children === null && isFocusable(e)) return e;

    return null;

}

/**
 * Gets the node position by either surrounding with a span temporarily to get rect pos, or directly via
 * getBoundingClientRect().
 * @param nod Node to find dimensions of.
 * @returns {*} Look at getBoundingClientRect() specs online (ret.left, right, top, bottom, width, height etc).
 */
function getNodPos(nod) {
    if (!isElement(nod)) {
        pos = mask_DOMObjs({first: nod, last: nod}).getBoundingClientRect();
        strip_masking();
    } else pos = nod.getBoundingClientRect();

    return pos;
}

/**
 * Draws selected box around DOM object referenced to. Creates selected box if & inserts into DOM if it doesn't
 * previously exist.
 * @param {Array} nodArr DOM Object to draw box selected box around.
 * @returns {boolean} If finding dimensions of element failed (such as if hidden).
 */
function drawSelected(nodArr) {

    var minHoriz = 0;
    var minVert = 0;
    var maxHoriz = 0;
    var maxVert = 0;
    var pos;

    if (nodArr.length > 0) {
        pos = getNodPos(nodArr[0]);

        minVert = pos.top + window.pageYOffset;
        minHoriz = pos.left + window.pageXOffset;
        maxVert = pos.bottom + window.pageYOffset;
        maxHoriz = pos.right + window.pageXOffset;

    }

    for (i = 1; i < nodArr.length; i++) {

        pos = getNodPos(nodArr[i]);

        if (pos.left + window.pageXOffset < minHoriz) minHoriz = pos.left + window.pageXOffset;
        if (pos.top + window.pageYOffset < minVert) minVert = pos.top + window.pageYOffset;
        if (pos.bottom + window.pageYOffset > maxVert) maxVert = pos.bottom + window.pageYOffset;
        if (pos.right + window.pageXOffset > maxHoriz) maxHoriz = pos.right + window.pageXOffset;

    }

    var top = minVert;
    var left = minHoriz;
    var width = maxHoriz - minHoriz;
    var height = maxVert - minVert;


    if (width == 0 && height == 0) {
        // If there is a problem finding the element position
        return false;
    }
    var old = document.getElementById(ezSelectorId);
    if (old === null) {
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
        if (document.body.firstChild) {
            document.body.insertBefore(div, document.body.firstChild);
        } else {
            document.body.appendChild(div);
        }
        old = document.getElementById(ezSelectorId); // Redefine the new selected div
    }
    old.style.visibility = "visible";
    old.style.left = left - 10 + 'px';
    old.style.top = top - 10 + 'px';
    old.style.width = width + 10 + 'px';
    old.style.height = height + 10 + 'px';

    // Un-hide highlight, if once hidden
    old.style.visibility = '';

    smoothScroll(top - (document.documentElement.clientHeight / 4));

    return true;
}

/**
 * Event listener if window is resized ==> The selected box will be redrawn.
 */
window.onresize = function () {
    if (ez_navigateToggle) {
        var actionable = getActionableElement(selectedEls, 'nav');
        var label = get_label(actionable);
        if (label !== null) drawSelected(selectedEls.concat([label]));
        else drawSelected(selectedEls);
    }
};

/**
 * Stops EZ Access navigation, hides EZ Access selector and resets variables.
 */
function stopEZ() {
    ez_navigateToggle = false;

    idle_loop();
    idleVoiceLoop(false);

    selectedEls = [];

    chrome.extension.sendMessage({stop: "true"});

    sessionStorage.setItem("EZ_Toggle", "0");
    var old = document.getElementById(ezSelectorId);
    if (old !== null) {
        old.style.visibility = "hidden";
        old.style.left = 0 + "px";
        old.style.top = 0 + "px";
        old.style.width = 0 + "px";
        old.style.height = 0 + "px";
    }
}

/**
 * Prints the string s to the console log if the system is in debug mode
 * @param {*} s The object (usually a string) to be logged.
 * @returns {boolean} Debug status
 */
function _debug(s) {
    if (debugMode) {
        console.log(s);
    }
    return debugMode;
}