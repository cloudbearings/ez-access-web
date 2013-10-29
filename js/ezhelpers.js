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
 |  FILE            ezhelpers.js
 |  DESCRIPTION     This file contains the functions that help with EZ Access, but are generic and standalone.
 *--------------------------------------------------------------------------------------------------------------------*/


/**
 * Generic anonymous JSON-getter function
 */
(function () {
    Lib = {
        ajax: {
            xhr: function () {
                instance = new XMLHttpRequest();
                return instance;
            },
            getJSON: function (options, callback) {
                var xhttp = this.xhr();
                options.url = options.url || location.href;
                options.data = options.data || null;
                callback = callback ||
                    function () {
                    };
                options.type = options.type || 'json';
                var url = options.url;
                if (options.type == 'jsonp') {
                    window.jsonCallback = callback;
                    var $url = url.replace('callback=?', 'callback=jsonCallback');
                    var script = document.createElement('script');
                    script.src = $url;
                    document.body.appendChild(script);
                }
                xhttp.open('GET', options.url, true);
                xhttp.send(options.data);
                xhttp.onreadystatechange = function () {
                    if (xhttp.status == 200 && xhttp.readyState == 4) {
                        callback(xhttp.responseText);
                    }
                };
            }
        }
    };

    window.Lib = Lib;
})();

/**
 * Converts a hexadecimal to RGB
 * @param {string} hex A valid hexadecimal color
 * @returns {{r: Number, g: Number, b: Number}} RGB object
 */
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Finds and returns the parent attribute value if exists.
 * @param obj The object to look parent-ly from
 * @param attr The attribute name to look for
 * @returns {string|undefined} The value of the attribute (if found)
 */
function find_parent_attr(obj, attr) {
    if (obj == null) {
        return undefined;
    }
    while (obj.nodeType !== 9) {
        if (obj.hasAttribute(attr)) {
            return obj.getAttribute(attr);
        }
        obj = obj.parentNode;
    }
    return undefined;
}

/**
 * Gets first clickable parent element from obj
 * @param {object} obj The object to check from
 * @returns {object|null} The object, if one is found clickable
 */
function getClick(obj) {
    while (obj.nodeType !== 9) {
        if (typeof obj.href == "string") {
            return obj;
        } else if (obj.hasAttribute('onclick') || typeof obj.onclick == "function") {
            return obj;
        }
        obj = obj.parentNode;
    }
    return null;
}

/**
 * Gets the explicit or implicit label of obj
 * @param {object} obj The object to check from
 * @returns {object|null} The label, if found
 */
function get_label(obj) {
    if (obj.tagName == "LABEL") return null;
    var labelElements = document.getElementsByTagName("label");
    if (obj.id) {
        for (var i = 0; i < labelElements.length; i++) {
            if (labelElements[i].getAttribute("for") == obj.id) {
                return labelElements[i];
            }
        }
    }
    var parentLabel = obj;
    while (parentLabel !== null) {
        if (parentLabel.tagName === "LABEL") {
            return parentLabel;
        }
        parentLabel = parentLabel.parentNode;
    }
    return null;
}

/**
 * Returns if label is orphaned or not. Assumes label for="" is valid.
 * @param label Label to be checked
 * @returns {boolean} If valid or not. Error thrown if not passed label.
 */
function orphanedLabel(label) {
    if (label.tagName !== 'LABEL') {
        throw new Error('orphanedLabel() MUST be passed a label!');
    }
    return label.hasAttribute('for') || label.hasChildNodes();

}

/**
 * Looks for if obj is a child of a specific element type
 * @param {object} obj Object to start from
 * @param {string} type Object type to look for
 * @returns {boolean} True iff found
 */
function isChildOfElType(obj, type) {
    if (obj.tagName == undefined) return false;
    if (obj.tagName.toLowerCase() == type.toLowerCase()) return true;
    return isChildOfElType(obj.parentNode, type);
}

/**
 * Parses orphaned text nodes in each object in an array
 * @param {object[]} paragraphTags The objects (as an array) to parse
 */
function parseOrphanedText(paragraphTags) {
    for (var i = 0; i < paragraphTags.length; i++) {
        var para = paragraphTags[i];
        var arr = [];
        for (var j = 0; j < para.childNodes.length; j++) {
            var elem = para.childNodes[j];
            var nextElem = para.childNodes[j + 1];
            var prevElem = para.childNodes[j - 1];
            var parse = false;
            if (nextElem !== undefined) { // && nextElem.tagName === COMPATIBLE_TAGS.split(',')[m].toUpperCase()
                parse = true;
            } else if (prevElem !== undefined) { // && prevElem.tagName === COMPATIBLE_TAGS.split(',')[m].toUpperCase()
                parse = true;
            }
            if (elem.nodeType === 3 && elem.length > 3 && parse) { // > 3 to prevent whitespaces
                var newElem = document.createElement('span');
                newElem.setAttribute("data-ez-parse");
                newElem.innerHTML = elem.nodeValue;
                elem.parentNode.insertBefore(newElem, elem.nextSibling);
                para.removeChild(elem);
                arr.push(newElem);
            } else {
                arr.push(elem)
            }
        }
    }
}

/**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
function merge_options(obj1, obj2) {
    var obj3 = {};
    for (var attrname in obj1) {
        obj3[attrname] = obj1[attrname];
    }
    for (var attrname in obj2) {
        obj3[attrname] = obj2[attrname];
    }
    return obj3;
}

/**
 * Utility function to check if the passed object is an Array
 * From: http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
 * @param {object} param The object to be tested if it is an array.
 * @return {boolean} If object o is an array or not.
 */
function isArray(param) {
    var o = param.o;
    return Object.prototype.toString.call(o) === '[object Array]';
}