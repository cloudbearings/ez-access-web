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
 * @param {object} param The object to be tested if it is an array.
 * @return {boolean} If object o is an array or not.
 */
function isArray(param) {
    var o = param.o;
	return Object.prototype.toString.call(o) === '[object Array]';
}