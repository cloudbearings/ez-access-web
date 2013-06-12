/**
 * Keep track if the TINY modal is open or not
 */
var tinyOpen = false;

/**
 * Dictionary stored for page load duration
 */
var dictionary;

/**
 * Creates a TINY lightbox given a reference.
 * @param {string|object} alert A string to display or object to get help info about.
 */
function ez_help(alert) {
	var helptext = "";

	if(typeof alert === 'string') {
		helptext = String(alert);
	} else if(typeof alert === 'object') {
		helptext = getHelpArray(alert)[0]; // TODO
	}
	TINY.box.show("<span style='font-size:150%'>" + helptext + "</span>", 0, 400, 0, 0);
	voice(String(helptext));
}

/**
 * Alerts EZ Access idle loop lightbox asking user if still there.
 * TODO Not currently b/c of debugging + development
 * @param {boolean} display If false, start timer for idle loop. Otherwise, display lightbox + reset.
 */
function idle_loop(display) {
	if(!display) {
		if(alerts.idle.wait != -1) {
			idleLoop = self.setInterval(function () {
				idle_loop(true)
			}, alerts.idle.wait);
		}
	} else {
		if(!tinyOpen && !ez_navigateToggle) {
			idleLoop = self.clearInterval(idleLoop);
			tinyOpen = true;
			ez_help(alerts.idle.value);
		}
	}
}

/**
 * The delimiter between layers in the data-ez-help attribute.
 * @const
 */
DELIMITER = '|';
/**
 * The terminator in the data-ez-help attribute. If the attribute ends with
 * the TERMINATOR, then no additional help layers are provided.
 * @const
 */
TERMINATOR = '||';

/**
 * Takes a DOM object and creates an array of all of the help layers associated
 * with that object (given with the data-ez-help attribute). This function is
 * recursive so that the help layers from ancestor elements are included
 * (unless the help string associated with an object ends with the TERMINATOR
 * character string).
 * @author J. Bern Jordan
 * @param {Object} obj The DOM object for which to get the help layers.
 * @return {null|string[]} The help layers (or null if there are no help layers).
 */
function getHelpArray(obj) {
	'use strict';
	/**
	 * The return, which is either an array of strings with each help layer or
	 * null if there are no help layers associated with obj.
	 */
	var ret;
	/**
	 * The value of the data-ez-help attribute.
	 * @type {string}
	 */
	var attr;
	/**
	 * Whether the function should end or not.
	 * @type {boolean}
	 */
	var end;

	if(obj.hasAttribute('data-ez-help')) {
		attr = obj.getAttribute('data-ez-help');

		//See if this function needs to make a recursive call
        end = attr.slice(-TERMINATOR.length) === TERMINATOR;

		ret = attr.split(DELIMITER);

		for(var i = 0; i < ret.length;) {
			if(ret[i] == '' || ret[i] === null) {
				ret.splice(i, 1);
			} else {
				var parsedRet = parseHelpPageString(ret[i]);
				// Merge this array at pos; delete ret[i]
				ret.splice(i, 1);
				ret.splice.apply(ret, [i, 0].concat(parsedRet));
				i += parsedRet.length;
			}
		}
	} else {
		ret = null;
	}

	/**
	 * This function may be called recursively on parent elements.
	 */
	if(!end) {
		var parent = obj.parentNode;

		//End the recursion because there are no more parent elements
		if(parent === null || parent.tagName === 'HTML') {
			return ret;
		}

		var recursive = getHelpArray(parent);

		if(isArray({o: recursive}) && recursive !== null) {
			if(ret === null) {
				ret = [];
			}
			ret = ret.concat(recursive);
		} else if(recursive !== null) {
			throw new Error('Array not passed to getHelpArray()');
		} //else (thus recursive === null) ret does not change (ret = ret;)
	}
	return ret;
} //End function getHelpArray()

/**
 * Takes a string for a single help layer (from the data-ez-help attribute)
 * and parses it. If the string is a reference to a part of another file,
 * then the proper string from that file is returned. If the string is not a
 * reference, it is cleaned up so that only plain text remains.
 * @param s {string} The single help layer string to be parsed.
 * @return {string[]} The resulting layer(s) from the parsing.
 */
function parseHelpPageString(s) {
	/**
	 * The string to be returned.
	 */
	var ret;

	//First check if the string is a reference to another string
	if(s.indexOf('#') !== -1) {

		// Potentially ID-referencing
		var ref = s.split('#');

		if(ref[0].trim().length === 0) {
			//Referencing ID of el on current page

			//Hashes are *not* allowed in IDs (http://goo.gl/YgTLi), but get 
			//rest just to be safe.
			id = s.slice(s.indexOf('#') + 1);

			div = document.getElementById(id);

			ret = getHelpFromObj(div, 'current page', id);

			if(ret !== null) return ret;

		} else {
			// (Potentially) referencing an external file
			var url = ref[0];
			var ext = url.slice(url.lastIndexOf('.') + 1);

			if(ext == 'htm' || ext == 'html') {
				// Forms URL: HTM or HTML. Still don't know if exists
				var externalDocument = getDocument(url);
				if(externalDocument !== null) {
					// Document exists. Still don't know if specific ID exists

					var id = s.slice(s.indexOf('#') + 1);
					var div = externalDocument.getElementById(id);

					ret = getHelpFromObj(div, url, id);

					if(ret !== null) return ret;

				} else {
					// Document doesn't exist; is an error
					console.log("Error: Could not find file '" + url + "' for help layers");
				}
			} // ELSE: Invalid URL; not an error: Could just be a normal file
		}
	} // ELSE: Content is string (as-is)

	ret = new Array(s);
	return ret;
}

/**
 * Gets help information from an object.
 * @param obj Object to look for help layers from.
 * @param url For console debugging: URL of HTML file looking inside for object.
 * @param id For console debugging: ID of element.
 * @returns {string[]} Returns array of strings of 'help layers' that can be used from a given object.
 */
function getHelpFromObj(obj, url, id) {
	if(obj !== null) {
		if(obj.hasAttribute('data-ez-help')) {
			var sections = obj.getElementsByTagName('section');
			if(sections.length == 0) {
				console.log("Error: No sections in ID '" + id + "' with data-ez-help attribute in '" + url + "' for help layers");
			} else {
				for(var i = 0; i < sections.length; i++) sections[i] = sections[i].textContent;
				return sections;
			}
		}
		return new Array(obj.textContent);
	} else {
		console.log("Error: Could not find ID '" + id + "' in '" + url + "' for help layers");
	}
	return null;
}

/**
 * Create XMLHttpRequest to get HTML file of help layers on page load.
 * @type {XMLHttpRequest}
 */
var xmlhttp = new XMLHttpRequest();

/**
 * Gets
 * TODO DOM Parser can break! No error message provided if it does.
 * @param {string} url Location (relative to current page) of help layers reference file.
 * @returns {document} Returns DOM of URL requested.
 */
function getDocument(url) {
	xmlhttp.open("GET", url + '?t=' + new Date().getTime(), false); // TODO : Disable caching for troubleshooting
	xmlhttp.send();
	if(xmlhttp.status == 200) {
		var xmlString = xmlhttp.responseText,
			parser = new DOMParser();
        // returns a HTMLDocument, which also is a Document.
		return parser.parseFromString(xmlString, "text/html");
	} else {
		return null;
	}
}