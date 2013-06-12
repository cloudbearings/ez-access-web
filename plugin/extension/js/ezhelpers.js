/**
 * Checks if parent is a descendant of the child.
 * @param {object} parent The DOM parent object.
 * @param {object} child The DOM child element.
 * @returns {boolean} True iff descendant.
 */
function isDescendant(parent, child) {
	var node = child.parentNode;
	while(node != null) {
		if(node == parent) {
			return true;
		}
		node = node.parentNode;
	}
	return false;
}

/**
 * Generic anonymous JSON-getter function
 */
(function () {
	var Lib = {
		ajax: {
			xhr: function () {
				var instance = new XMLHttpRequest();
				return instance;
			},
			getJSON: function (options, callback) {
				var xhttp = this.xhr();
				options.url = options.url || location.href;
				options.data = options.data || null;
				callback = callback ||
					function () {};
				options.type = options.type || 'json';
				var url = options.url;
				if(options.type == 'jsonp') {
					window.jsonCallback = callback;
					var $url = url.replace('callback=?', 'callback=jsonCallback');
					var script = document.createElement('script');
					script.src = $url;
					document.body.appendChild(script);
				}
				xhttp.open('GET', options.url, true);
				xhttp.send(options.data);
				xhttp.onreadystatechange = function () {
					if(xhttp.status == 200 && xhttp.readyState == 4) {
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
 * Gets the current index by an ID in selectElements
 * @param id The ID of the element
 * @returns {number} The index in selectElements (currIndex-eable)
 */
function getCurrIndexById(id) {
	for(var i = 0; i < selectElements.length; i++) {
		if(selectElements[i].id == id) {
			return i;
		}
	}
	return -1;
}

/**
 * Gets the current index in selectElements by a name
 * @param name The name to look for
 * @returns {number} The index of selectElements it's at
 */
function getCurrIndexByName(name) {
	for(var i = 0; i < selectElements.length; i++) {
		if(selectElements[i].getAttribute('name') == name) {
			return i;
		}
	}
	return -1;
}

/**
 * Finds and returns the parent attribute value if exists.
 * @param obj The object to look parent-ly from
 * @param attr The attribute name to look for
 * @returns {string|undefined} The value of the attribute (if found)
 */
function find_parent_attr(obj, attr) {
	if(obj == null) {
		return undefined;
	}
	while(obj.nodeType !== 9) {
		if(obj.hasAttribute(attr)) {
			return obj.getAttribute(attr);
		}
		obj = obj.parentNode;
	}
	return undefined;
}

/**
 * Gets first clickeable parent element from obj
 * @param {object} obj The object to check from
 * @returns {object|undefined} The object, if one is found clickeable
 */
function getClick(obj) {
	while(obj !== null) {
		if(typeof obj.href == "string") {
			return obj;
		} else if(typeof obj.onclick == "string" || typeof obj.onclick == "function") {
			return obj;
		}
		obj = obj.parentNode;
	}
	return undefined;
}

/**
 * Gets the explicit or implicit label of obj
 * @param {object} obj The object to check from
 * @returns {object|null} The label, if found
 */
function get_label(obj) {
	if(obj.tagName == "LABEL") return null;
	var labelElements = document.getElementsByTagName("label");
	if(obj.id) {
		for(var i = 0; i < labelElements.length; i++) {
			if(labelElements[i].getAttribute("for") == obj.id) {
				return labelElements[i];
			}
		}
	}
	var parentLabel = obj;
	while(parentLabel !== null) {
		if(parentLabel.tagName === "LABEL") {
			return parentLabel;
		}
		parentLabel = parentLabel.parentNode;
	}
	return null;
}

/**
 * Looks for if obj is a child of a specific element type
 * @param {object} obj Object to start from
 * @param {string} type Object type to look for
 * @returns {boolean} True iff found
 */
function isChildOfElType(obj, type) {
	if(obj.tagName == undefined) return false;
	if(obj.tagName.toLowerCase() == type.toLowerCase()) return true;
	return isChildOfElType(obj.parentNode, type);
}

/**
 * Parses orphaned text nodes in each object in an array
 * @param {object[]} paragraphTags The objects (as an array) to parse
 */
function parseOrphanedText(paragraphTags) {
	for(var i = 0; i < paragraphTags.length; i++) {
		var para = paragraphTags[i];
		var arr = [];
		for(var j = 0; j < para.childNodes.length; j++) {
			var elem = para.childNodes[j];
			var nextElem = para.childNodes[j + 1];
			var prevElem = para.childNodes[j - 1];
			var parse = false;
			if(nextElem !== undefined) { // && nextElem.tagName === COMPATIBLE_TAGS.split(',')[m].toUpperCase()
				parse = true;
			} else if(prevElem !== undefined) { // && prevElem.tagName === COMPATIBLE_TAGS.split(',')[m].toUpperCase()
				parse = true;
			}
			if(elem.nodeType === 3 && elem.length > 3 && parse) { // > 3 to prevent whitespaces
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
 * Utility function to check if the passed object is an Array
 * From: http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
 * @param {} o The object to be tested if it is an array.
 * @return {boolean} If object o is an array or not.
 */
function isArray(o) {
	return Object.prototype.toString.call(o) === '[object Array]';
}

// RESIZER SCRIPT
//http://blogs.korzh.com/progtips/2008/05/28/absolute-coordinates-of-dom-element-within-document.html

function __getIEVersion() {
	var rv = -1; // Return value assumes failure.  
	if(navigator.appName == 'Microsoft Internet Explorer') {
		var ua = navigator.userAgent;
		var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
		if(re.exec(ua) != null)
			rv = parseFloat(RegExp.$1);
	}
	return rv;
}

function __getOperaVersion() {
	var rv = 0; // Default value  
	if(window.opera) {
		var sver = window.opera.version();
		rv = parseFloat(sver);
	}
	return rv;
}

var __userAgent = navigator.userAgent;
var __isIE = navigator.appVersion.match(/MSIE/) != null;
var __IEVersion = __getIEVersion();
var __isIENew = __isIE && __IEVersion >= 8;
var __isIEOld = __isIE && !__isIENew;

var __isFireFox = __userAgent.match(/firefox/i) != null;
var __isFireFoxOld = __isFireFox && ((__userAgent.match(/firefox\/2./i) != null) || (__userAgent.match(/firefox\/1./i) != null));
var __isFireFoxNew = __isFireFox && !__isFireFoxOld;

var __isWebKit = navigator.appVersion.match(/WebKit/) != null;
var __isChrome = navigator.appVersion.match(/Chrome/) != null;
var __isOpera = window.opera != null;
var __operaVersion = __getOperaVersion();
var __isOperaOld = __isOpera && (__operaVersion < 10);

function __parseBorderWidth(width) {
	var res = 0;
	if(typeof (width) == "string" && width != null && width != "") {
		var p = width.indexOf("px");
		if(p >= 0) {
			res = parseInt(width.substring(0, p));
		} else {
			//do not know how to calculate other values (such as 0.5em or 0.1cm) correctly now  
			//so just set the width to 1 pixel  
			res = 1;
		}
	}
	return res;
}


//returns border width for some element

function __getBorderWidth(element) {
	var res = new Object();
	res.left = 0;
	res.top = 0;
	res.right = 0;
	res.bottom = 0;
	if(window.getComputedStyle) {
		//for Firefox  
		var elStyle = window.getComputedStyle(element, null);
		res.left = parseInt(elStyle.borderLeftWidth.slice(0, -2));
		res.top = parseInt(elStyle.borderTopWidth.slice(0, -2));
		res.right = parseInt(elStyle.borderRightWidth.slice(0, -2));
		res.bottom = parseInt(elStyle.borderBottomWidth.slice(0, -2));
	} else {
		//for other browsers  
		res.left = __parseBorderWidth(element.style.borderLeftWidth);
		res.top = __parseBorderWidth(element.style.borderTopWidth);
		res.right = __parseBorderWidth(element.style.borderRightWidth);
		res.bottom = __parseBorderWidth(element.style.borderBottomWidth);
	}

	return res;
}


//returns the absolute position of some element within document  

function getElementAbsolutePos(elemID) {
	var element;
	if(typeof (elemID) == "string") {
		element = document.getElementById(elemID);
	} else {
		element = elemID;
	}

	var res = new Object();
	res.x = 0;
	res.y = 0;
	if(element !== null) {
		res.x = element.offsetLeft;

		var offsetParent = element.offsetParent;
		var offsetParentTagName = offsetParent != null ? offsetParent.tagName.toLowerCase() : "";

		if(__isIENew && offsetParentTagName == 'td') {
			res.y = element.scrollTop;
		} else {
			res.y = element.offsetTop;
		}

		var parentNode = element.parentNode;
		var borderWidth = null;

		while(offsetParent != null) {
			res.x += offsetParent.offsetLeft;
			res.y += offsetParent.offsetTop;

			var parentTagName = offsetParent.tagName.toLowerCase();

			if((__isIEOld && parentTagName != "table") || (__isFireFoxNew && parentTagName == "td") || __isChrome) {
				borderWidth = __getBorderWidth(offsetParent);
				res.x += borderWidth.left;
				res.y += borderWidth.top;
			}

			if(offsetParent != document.body && offsetParent != document.documentElement) {
				res.x -= offsetParent.scrollLeft;
				res.y -= offsetParent.scrollTop;
			}


			//next lines are necessary to fix the problem with offsetParent  
			if(!__isIE && !__isOperaOld || __isIENew) {
				while(offsetParent != parentNode && parentNode !== null) {
					res.x -= parentNode.scrollLeft;
					res.y -= parentNode.scrollTop;
					if(__isFireFoxOld || __isWebKit) {
						borderWidth = __getBorderWidth(parentNode);
						res.x += borderWidth.left;
						res.y += borderWidth.top;
					}
					parentNode = parentNode.parentNode;
				}
			}

			parentNode = offsetParent.parentNode;
			offsetParent = offsetParent.offsetParent;
		}
	}
	if(res.x < 0 || res.y < 0 || (res.x == 0 && res.y == 0)) {
		// Finding the element's location probably failed.
		return false;
	}
	return res;
}

/* 
 * DOMParser HTML extension
 * 2012-02-02
 *
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*! @source https://gist.github.com/1129031 */
/*global document, DOMParser*/

(function (DOMParser) {
	"use strict";
	var DOMParser_proto = DOMParser.prototype,
		real_parseFromString = DOMParser_proto.parseFromString;

	// Firefox/Opera/IE throw errors on unsupported types  
	try {
		// WebKit returns null on unsupported types  
		if((new DOMParser).parseFromString("", "text/html")) {
			// text/html parsing is natively supported  
			return;
		}
	} catch(ex) {}

	DOMParser_proto.parseFromString = function (markup, type) {
		if(/^\s*text\/html\s*(?:;|$)/i.test(type)) {
			var doc = document.implementation.createHTMLDocument(""),
				doc_elt = doc.documentElement,
				first_elt;

			doc_elt.innerHTML = markup;
			first_elt = doc_elt.firstElementChild;

			if(doc_elt.childElementCount === 1 && first_elt.localName.toLowerCase() === "html") {
				doc.replaceChild(first_elt, doc_elt);
			}

			return doc;
		} else {
			return real_parseFromString.apply(this, arguments);
		}
	};
}(DOMParser));