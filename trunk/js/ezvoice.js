/**
 * Alert of how many times user has pressed up
 * @type {number}
 */
var repeatAlert = 0;

/**
 * Global text to be read before next speech synthesis; can be set anywhere
 * @type {string}
 */
var globalSayBefore = "";

/**
 * Global text to be read before next speech synthesis; can be set anywhere
 */
var dictionary = null;

/**
 * Regular expression for alphabetical characters in ASCII.
 * NOTE: It would seem to be better to also allow for non-ASCII letters
 * using something like: http://xregexp.com/
 * @const
 */
var ALPHABET_CHAR = /[a-zA-Z]/;

/**
 * A parameter for whether speech should be generated with SSML markup.
 * @const
 */
var SSML = true;


/**
 * Provide easy place to change method of speech synthesis
 * @param {Array|string} obj A string to be voiced, or an object to be voiced
 * @param source {'nav'|'point'} Navigation method passed from calling function
 * @param repeat If speech is being repeated (EZ Action + no possible action)
 */
function voice(obj, source, repeat) {
	var speech = "";
	if(typeof (obj) == 'string') {
		speech = obj;
	} else {
        // Loop through all selected elements
        for(i = 0; i < obj.length; i++) {
            if(isElement(obj[i])) speech += voice_element(obj[i], source);
            else speech += voice_node(obj[i]);
        }
	}

	// Global speech appendages
	if(repeat == true) {
		speech = "Repeating... " + speech;
	}
	if(globalSayBefore != "") {
		speech = globalSayBefore + speech;
		globalSayBefore = "";
	}

	if(dictionary !== null) {
		speech = fixPronunciation(speech, dictionary);
	}

	var req = {
		"tts": speech,
		"volume": String(audioVolume / 100)
	};

	chrome.extension.sendRequest(req);
}

function voice_node( nod ) {
    // Remove line breaks
    return nod.nodeValue.replace(/(\r\n|\n|\r)/gm," ");
}

/**
 * Voices an object by putting together name, role and value.
 * @param {object} obj The object to be voiced
 * @param {'nav'|'point'} source The navigation method
 * @returns {string} The object voiced text
 */
function voice_element(obj, source) {
	/**
	 * The name or label of the interactive object.
	 */
	var name = '';

	/**
	 * The role or type of interactive object.
	 */
	var role = '';

	/**
	 * The value or status of the interactive object along with a connecting
	 * phrase.
	 */
	var value = '';

	/**
	 * Extra spoken information that follows the value.
	 */
	var extra = '';

	/**
	 * The concatenated speech string that will be returned from this function.
	 */
	var speech = '';

	/** A string representation of the type of object */
	var type = getType(obj);
	
	/**
	 * Get speech strings for concatenation
	 */
	name = getName(obj, source);
	value = getValueSubstring(obj);
	
	if (isUserEditable(obj)) {
		role = getRole(obj);
	} else if (type === 'button') {
		role = 'unavailable ' + getRole(obj);
	} //else role should be left blank

    /**
     * Get other speech for different elements
     */
    if (type === 'range') {
        if(obj.hasAttribute('min') && obj.hasAttribute('max')) {
            extra = 'and ranges from ' + obj.min + ' to ' + obj.max;
            //The following are "sort of" error cases
        } else if(obj.hasAttribute('min')) {
            //With no max, Chrome returns '' but uses 100
            extra = 'and ranges from ' + obj.min + ' to 100';
        } else if(obj.hasAttribute('max')) {
            //With no min, Chrome returns '' but uses 0
            extra = 'and ranges from 0 to ' + obj.max;
        } else {
            extra = 'and ranges from 0 to 100';
        }
    }

	/**
	 * Potentially add SSML tags to different speech substrings.
	 */
	if(SSML) {
		role = '<prosody pitch="low" rate="fast">' + role + '</prosody>';
	}

	/**
	 * Concatenation for the speech string to be returned.
	 */
	if(speech === '') { //default concatenation
		speech = name + ', ' + role + ', ' + value + ' ' + extra + '.';
	}

	if(obj.tagname === 'A' && obj.hasAttribute('href')) {
		speech = role + ': ' + name;
	}

	// Replace override custom EZ Access
	speech = say_replace(obj, speech, source);

    /**
     * Adding SSML wrapper markup if required.
     */
    if (SSML) {
        speech = '<?xml version="1.0"?>' +
            '<speak>' +
            speech +
            '</speak>';
    }

    if(debugMode) console.log(speech);
	return speech;
}

/**
 * Gets the type of the object and returns type as a string. Aria-role can overwrite.
 * @param {object} obj The object to be checked. Returns lowercase.
 * For inputs, returns type. For select w/ multiple, returns 'multiple'. Otherwise, returns tag name.
 */
function getType(obj) {
    /**
     * Defines supported aria-roles
     * @type {Array}
     * @const
     */
    var ariaRoles = ['checkbox','radio','button'];

    // Check for aria-role, and return iff valid
    if(obj.hasAttribute('aria-role')) {
        var type = obj.getAttribute('aria-role').toLowerCase();
        for(i = 0; i < ariaRoles.length; i++) {
            if(type === ariaRoles[i]) {
                 return type;
            }
        }
    }

    // Special case
    if(obj.tagName === 'INPUT') {
       return obj.type.toLowerCase();
    }

    // Else return tag name
    return obj.tagName.toLowerCase();

}

/**
 * This function looks for potential names for the element
 * by looking at different ways of labeling that control type.
 * In precedence order, the name will be the object's:
 * data-ez-sayname > aria-labelledby > aria-label > <label> >
 * tag-specific "labels" > defaultString
 * @author J. Bern Jordan
 * @param {object} obj The DOM object for which to get an
 * accessible name.
 * @param {'nav'|'point'} source The source modality: either 'nav' for navigation
 * or 'point' for pointing.
 * @param {String} [defaultString=''] A default string for the object's
 * name if a more appropriate one is not found.
 * @return {String} An accessible name for the passed object.
 * The returned string is the default string if an overriding
 * accessible name is not found.
 */
function getName(obj, source, defaultString) {
	'use strict';
	var ret;

	if(defaultString === undefined) {
		ret = '';
	} else {
		ret = defaultString;
	}

	var label = get_label(obj);
	var type = getType(obj);

	if(obj.hasAttribute('aria-labelledby')) {
		ret = '';
		var labelIDs = obj.getAttribute('aria-labelledby').split(' ');
		for(var i = 0; i < labelIDs.length; i++) {
			ret += document.getElementById(labelIDs[i]).textContent;
			ret += ' ';
		}
	} else if(obj.hasAttribute('aria-label')) {
		ret = obj.getAttribute('aria-label');
	} else if(label !== null) {
		//always check for a label before checking for default names
		if(typeof label === "object") {
			ret = say_replace(label, get_inner_alt(label, source), source);
		} else {
			ret = label;
		}
	}
    // Get generic name for specific input types
    else if(obj.hasAttribute('readonly') || obj.hasAttribute('disabled')) {
        ret = 'Disabled field';
    } else if(type === 'submit') {
        if(obj.hasAttribute('value')) {
            ret = obj.value;
        } else {
            ret = 'Submit';
        }
    } else if(type === 'reset') {
        if(obj.hasAttribute('value')) {
            ret = obj.value;
        } else {
            ret = 'Reset';
        }
    } else if(type === 'button') {
        if(obj.hasAttribute('value')) {
            ret = obj.value;
        } 
        if (obj.tagName === 'BUTTON') {
            // <button>s are special -- need to read similar to other input type="button"s
            if (ret === '') {
                ret = obj.innerText;
            }
        }
    } else if(type === 'image') {
        //alt is preferred, title is second choice
        if(obj.hasAttribute('alt')) {
            ret = obj.alt;
        } else if(obj.title) {
            ret = obj.title;
        } else {
            ret = 'Image';
        }
    } else if(type === 'password' || type === 'text' ||
        type === 'email' || type === 'search' ||
        type === 'url' || type === 'tel' ||
        type === 'number' || type === 'textarea') {
        if(obj.hasAttribute('placeholder')) {
            /**
             * Using a placeholder as a label is NOT generally recommended,
             * but it is probably better than nothing in this case (because
             * no other more appropriate label/name can be found).
             */
            ret = obj.getAttribute('placeholder');
        }
	} else if(type === 'img') { //TODO - check if necessary
		if(obj.alt) {
			ret = obj.alt;
		}
	} else if(type === 'a' && obj.hasAttribute('href')) {
		ret = get_inner_alt(obj, source);
	} else if (type === 'select') {
		//do nothing
		//don't want to get_inner_alt, which would read all of the <option>s
	} else {
		ret = get_inner_alt(obj, source);
	}

	return ret;
} //End function getName()

/**
 * This function looks for a potential role string and returns it.
 * In precedence order, the role string will be the object's:
 * data-ez-sayrole > aria-role > input-specific roles > defaultString.
 * If obj does not have a role, defaultString will be returned.
 * @author J. Bern Jordan
 * @param {object} obj The DOM object for which to get role.
 * @param {String} [defaultString=''] A default string for the object's
 * role if a more appropriate one is not found.
 * @return {String} An accessible role for the passed object.
 * The returned string is the default if an overriding role
 * is not found.
 */
function getRole(obj, defaultString) {
	'use strict';
	var ret;

	if(defaultString === undefined) {
		ret = '';
	} else {
		ret = defaultString;
	}

	if(obj.hasAttribute('data-ez-sayrole')) {
		ret = obj.getAttribute('data-ez-sayrole');
	}

    var type = getType(obj);

	// Roles for specific input types
    if(type === 'submit' || type === 'button' ||
        type === 'reset') {
        ret = 'Button';
    } else if(type === 'image') {
        ret = 'image input';
    } else if(type === 'radio') {
        ret = 'Radio Button';
    } else if(type === 'checkbox') {
        ret = 'Checkbox';
    } else if(type === 'range') {
        ret = 'Slider';
    } else if(type === 'password') {
        ret = 'Password field';
    } else if(type === 'text') {
        ret = 'Text field';
    } else if(type === 'email') {
        ret = 'E-mail field';
    } else if(type === 'search') {
        ret = 'Search field';
    } else if(type === 'url') {
        ret = 'Web address field';
    } else if(type === 'tel') {
        ret = 'Telephone field';
    } else if(type === 'number') {
        ret = 'Number field'; //spinner in Chrome
    } else if(type === 'button') {
        ret = 'Button';
	} else if(type === 'img') { //TODO - check if necessary
		if(!obj.hasAttribute('alt')) {
			ret = "Image";
		}
	} else if(type === 'a' && obj.hasAttribute('href')) {
		ret = 'Link';
	} else if(type === 'select') {
		if(obj.hasAttribute('multiple')) {
			ret = 'Multiple-selections menu';
		} else {
			ret = 'Menu';
		}
	} else if(type === 'textarea') {
		ret = 'Text area';
	}

	return ret;
} //End function getRole()

/**
 * This function looks for a potential value and returns it. This 
 * value is not necessarily a good representation of the value in speech. For 
 * that, call getValueSubstring().
 * In precedence order, the value will be the object's:
 * data-ez-sayvalue > aria-valuetext > aria-valuenow > 
 * value/status associated with that element type > defaultString
 * This function does not support aria-role="listbox" currently.
 * @author J. Bern Jordan
 * @param {object} obj The DOM object for which to get role.
 * @param {string} [defaultString=''] A default string for the object's
 * value if a more appropriate one is not found.
 * @return {boolean|number|NaN|string|string[]} The value/s for the passed object, 
 * the type of which depends on the object. Checkboxes, radio buttons, and 
 * aria toggle buttons return boolean values or the string "mixed". Numeric 
 * inputs return numbers or NaN. Other inputs return strings or if there are multiple 
 * values (as with some listboxes), then an array of strings is returned.
 */
function getValue(obj) {
	'use strict';
	var ret, type, value;

	type = getType(obj);

	if (obj.hasAttribute('data-ez-sayvalue')) {
		ret = obj.getAttribute('data-ez-sayvalue');
	} else if (obj.hasAttribute('aria-valuetext')) {
		ret = obj.getAttribute('aria-valuetext');
	} else if (obj.hasAttribute('aria-valuenow')) {
		ret = obj.getAttribute('aria-valuenow');
	} 
	//Radio buttons and checkboxes
	else if (type === 'radio' || type === 'checkbox') {
		if (obj.hasAttribute('aria-role')) {
			value = obj.getAttribute('aria-checked');
			if (value === 'true') { 
				ret = true; 
			} else if (value === 'false') {
				ret = false;
			} else if (value === 'mixed') {
				ret = 'mixed';
			} else {
				ret = 'ERROR';
				_debug('Bad HTML attribute: aria-checked=' + value);
			}
		} else {
			ret = obj.checked;
		}
	}
	//Numeric data
	else if (type === 'range' || type === 'number') {
		if (obj.value.length === 0) {
			ret = Number.NaN;
		} else {
			ret = Number(obj.value);
		}
		//if ARIA slider or spinbutton, then ret=aria-valuenow (set above)
	} 
	//Various text input fields
	else if (type === 'text'   || type === 'textarea' || type === 'email' || 
	         type === 'search' || type === 'url'      || type === 'tel'   || 
	         type === 'password' ) {
		ret = obj.value;
		//if ARIA, then ret=aria-valuetext (set above)
	}
	//Toggle buttons (only via ARIA)
	else if (type === 'button' && obj.hasAttribute('aria-pressed')) {
		value = obj.getAttribute('aria-pressed');
		if (value === 'true') { 
			ret = true; 
		} else if (value === 'false') {
			ret = false;
		} else if (value === 'mixed') {
			ret = 'mixed';
		} else {
			ret = 'ERROR';
			_debug('Bad HTML attribute: aria-pressed=' + value);
		}
	}
	//HTML <select>
	else if (type === 'select') {
		if (obj.hasAttribute('multiple')) {
			ret = [];
			for (var i = 0; i < obj.length; i++) {
				if (obj.options[i].selected) {
					ret.push(obj.options[i].value + ', option ' + (i + 1));
				}
			}
		} else {
			if(obj.selectedIndex !== -1) {
				ret = obj.options[obj.selectedIndex].value;
			} else {
				ret = '';
			}
		}
	}

	return ret;
} //End function getValue()

/**
 * Gets a value substring for the particular DOM object. The string depends on 
 * the type of DOM object and may be its value or status.
 * @author J. Bern Jordan
 * @param {object} obj The DOM object for which to get role.
 * @param {'nav'|'action'|'type'} [userDid='nav'] What the user just did, in order 
 * to get a more sensible string. 
 *     nav    = user just navigated
 *     action = user just pressed EZ Action
 *     type   = user just typed a character and waited
 * @return {string} The value substring to concatenate with other substrings 
 *
 * @TODO need to have another userDid added and checked for, b/c there are 
 * two things that can result when a user presses EZ Action: 
 * (1) the user enters a heirarchical control (such as number, or select), 
 * in which case the user needs to know details about obj and its current value
 * (2) the user "submits" or makes a change to a control (activate a checkbox 
 * or activate an option within a heirarchical <select>), in which case the 
 * user might want to know the value they set.
 */
function getValueSubstring(obj, userDid) {
	'use strict';
	var ret, type, value;
	
	// Check to see if a valid userDid value
	if (userDid === undefined) {
		userDid = 'nav';
	}
	if (userDid !== 'nav' && userDid !== 'action' && userDid !== 'type') {
		throw new TypeError('Invalid "userDid=' + userDid + 
		  '" passed to getValueSubstring()');
	}
	
	/** {string} The string to return */
	ret = '';
	/** {string} type The type of DOM object */
	type = getType(obj);
	/** {string|string[]} value The stringified value of obj */
	value = getValue(obj);
	
	
	//Password
	if (type === 'password') {
		if (userDid === 'type') {
			ret = 'you have typed ' + value.length + ' characters';
		} else {
			ret = 'contains ' + value.length + ' characters';
		}
	}
	//Radio buttons and checkboxes
	else if (type === 'radio' || type === 'checkbox') {
		//turn boolean into friendlier string
		if (value === true) {
			value = 'checked';
		} else if (value === false) {
			value = 'unchecked';
		} //else value typeof string stays as it is
		if (userDid === 'action') {
			ret = 'is now ' + value;
		} else {
			ret = 'is ' + value;
		}
	}
	//Numeric data
	else if (type === 'range' || type === 'number') {
		if (Number.isNaN(value)) {
			if (userDid === 'action') {
				ret = 'currently blank';
			} else {
				ret = 'is blank';
			}
		} else {
			if (userDid === 'action') {
				ret = 'current value is ' + value;
			} else {
				ret = 'is ' + value;
			}
		}
	}
	//Various text input fields
	else if (type === 'text'   || type === 'textarea' || type === 'email' || 
	         type === 'search' || type === 'url'      || type === 'tel' ) {
		if (value.length <= 0) {
			ret = 'is blank'
		} else if (userDid === 'type') {
			ret = 'you have typed ' + getTypedSpeech(value);
		} else {
			ret = 'contains ' + value;
		}
	}
	//Toggle buttons (only via ARIA)
	else if (type === 'button' && obj.hasAttribute('aria-pressed')) {
		//turn boolean into friendlier string
		if (value === true) {
			value = 'pressed';
		} else if (value === false) {
			value = 'unpressed';
		} //else value typeof string stays as it is
		if (userDid === 'action') {
			ret = 'is now ' + value;
		} else {
			ret = 'is ' + value;
		}
	}
	//HTML <select>
	else if (type === 'select') {
		if (typeof value === 'string' || value instanceof String) {
			if (value.length <= 0) {
				ret = 'is blank'
			} else if (userDid === 'action') {
				ret = 'is now ' + value;
			} else {
				ret = 'is ' + value;
			}
		} else { //string[], which means multiple options selected
			var options = '';
			var length = value.length;
			for (var i=0; i<length; i++) {
				if (i === length - 1 && length > 1) {
					options += ', and ' + value[i];
				} else if (i === 0) {
					options += value[i];
				} else {
					options += ", " + value[i];
				}
			}
			if (length === 1) {
				ret += 'is ' + options;
			} else if (length !== 0) {
				ret += 'options ' + options + ' are selected';
			} else {
				ret += 'is blank';
			}
		}
	}
	
	return ret;
}

/**
 * Returns the substring that tells the user about the data domain of the
 * interactive DOM Object. 
 * The substring is intended to be read after the name/label of the
 * element when the user has activated that element.
 * @author J. Bern Jordan
 * @param {object} obj The DOM object for which to get the data domain 
 * substring.
 * @return {string} The data domain substring to concatenate with other 
 * substrings 
 */
function getDataDomainSubstring(obj) {
	'use strict';
	var type = getType(obj);
	var ret = '';

	if (type === 'range') {
		var min = getMin(obj);
		var max = getMax(obj);
		if (min !== null && max !== null) {
			ret = 'ranges from ' + min + ' to ' + max;
			//The following are "sort of" error cases
		} else if (min !== null) {
			//With no max, Chrome returns '' but uses 100
			ret = 'ranges from ' + min + ' to 100';
			_debug('No max value specified');
		} else if (max !== null) {
			//With no min, Chrome returns '' but uses 0
			ret = 'ranges from 0 to ' + max;
			_debug('No min value specified');
		} else {
			ret = 'ranges from 0 to 100';
			_debug('Neither min nor max values specified');
		}
	} else if (type === 'number') {
		var min = getMin(obj);
		var max = getMax(obj);
		if(min !== null && max !== null) {
			ret = 'ranges from ' + min + ' to ' + max;
		} else if (min !== null) {
			ret = 'has a minimum of ' + min;
		} else if (max !== null) {
			ret = 'has a maximum of ' + max;
		} else {
			ret = ''; //no range specified
		}
	} else if (type === 'select') {
		var num = getNumOptions(obj);
		if (num !== null) {
			ret = 'has ' + num + ' options';
		} else {
			ret = '';
			_debug('No options within select element');
		}
	}

	return ret;
} //end getDataDomainSubstring()


/**
 * Returns the minimum value specified by the DOM obj.
 * @author J. Bern Jordan
 * @param {object} obj The DOM object for which to get the minimum value.
 * @return {null|number} The minimum value or null if no minimum value.
 */
function getMin(obj) {
	'use strict';
	var ret, type;
	type = getType(obj);

	if (type !== 'number' || type !== 'range') { 
		return null; 
	}

	if (obj.hasAttribute('aria-valuemin')) {
		ret = Number(obj.getAttribute('aria-valuemin')); 
	}
	if (obj.hasAttribute('min')) { //native attribute takes precedence
		ret = Number(obj.min); 
	}

	return ret;
}
/**
 * Returns the maximum value specified by the DOM obj.
 * @author J. Bern Jordan
 * @param {object} obj The DOM object for which to get the maximum value.
 * @return {null|number} The maximum value or null if no maximum value.
 */
function getMax(obj) {
	'use strict';
	var ret, type;
	type = getType(obj);

	if (type !== 'number' || type !== 'range') { 
		return null; 
	}

	if (obj.hasAttribute('aria-valuemax')) {
		ret = Number(obj.getAttribute('aria-valuemax')); 
	}
	if (obj.hasAttribute('max')) { //native attribute takes precedence
		ret = Number(obj.max); 
	}

	return ret;
}
/**
 * Returns the number of options specified by the DOM obj.
 * This function does not yet support aria-role="listbox"
 * @author J. Bern Jordan
 * @param {object} obj The DOM object for which to get the number of options.
 * @return {null|number} The number of options or null if not applicable.
 */
function getNumOptions(obj) {
	'use strict';
	var ret, type;
	type = getType(obj);

	if (type !== 'select' || type !== 'listbox') { 
		return null; 
	}

	//FUTURE WORK: Add ARIA support

	if (obj.tagname === 'SELECT') {
		ret = Number(obj.options.length); 
	}

	return ret;
}


/**
 * Gets the inner elements of an object and gets the voice parsing of that element, combining at the end. Needed for
 * tailoring to EZ Access.
 * @param {object} obj The object to look for child elements of
 * @param {'nav'|'point'} source The source of navigation
 * @returns {string} The inner elements voice
 */
function get_inner_alt(obj, source) {
	var speech = "";
	for(var i = 0; i < obj.childNodes.length; i++) {
		if(obj.childNodes[i].nodeType == 3) {
			speech += obj.childNodes[i].nodeValue;
		} else if(obj.childNodes[i].nodeType == 1 && obj.tagName !== 'LABEL') {
			speech += voice_element(obj.childNodes[i], source);
		}
	}
	return speech;
}

/**
 * Looks for EZ Access attributes to append or replace the regular speech synthesized speech
 * @param {object} obj The object in question
 * @param {string} speech The speech string to modify
 * @param {'nav'|'point'} source The navigation method
 * @returns {string} The (potentially) modified speech output
 */
function say_replace(obj, speech, source) {
	// data-ez-sayalt
	if(source == 'nav' && obj.hasAttribute('data-ez-sayalt-nav')) {
		speech = obj.getAttribute('data-ez-sayalt-nav');
	} else if(source == 'point' && obj.hasAttribute('data-ez-sayalt-point')) {
		speech = obj.getAttribute('data-ez-sayalt-point');
	} else if(obj.hasAttribute('data-ez-sayalt')) {
		speech = obj.getAttribute('data-ez-sayalt');
	}
	// data-ez-saybefore
	if(source == 'nav' && obj.hasAttribute('data-ez-saybefore-nav')) {
		speech = obj.getAttribute('data-ez-saybefore-nav') + ' ' + speech;
	} else if(source == 'point' && obj.hasAttribute('data-ez-saybefore-point')) {
		speech = obj.getAttribute('data-ez-saybefore-point') + ' ' + speech;
	} else if(obj.hasAttribute('data-ez-saybefore')) {
		speech = obj.getAttribute('data-ez-saybefore') + ' ' + speech;
	}

	// data-ez-sayafter
	if(source == 'nav' && obj.hasAttribute('data-ez-sayafter-nav')) {
		speech += ' ' + obj.getAttribute('data-ez-sayafter-nav');
	} else if(source == 'point' && obj.hasAttribute('data-ez-sayafter-point')) {
		speech += ' ' + obj.getAttribute('data-ez-sayafter-point');
	} else if(obj.hasAttribute('data-ez-sayafter')) {
		speech += ' ' + obj.getAttribute('data-ez-sayafter');
	}

	return speech;

}

/**
 * This function provides speech output for strings that the user has typed.
 * The speech output spells the last word or partial word entered if the
 * string passed ends with an alphabetical character.
 * NOTE: This function only supports alphabetical characters provided in the
 * ALPHABET_CHAR regex constant.
 * @author J. Bern Jordan
 * @param {string} s The string to be parsed into speech output
 * @param {string} [regex=ALPHABET_CHAR] The regular expression object that is
 * to be used for alphabetic characters.
 * @return {string} The string for the speech output
 */
function getTypedSpeech(s, regex) {
	/** The regex object for finding alphabet characters */
	var alphaChars;
	if(regex === undefined) {
		alphaChars = ALPHABET_CHAR;
	} else {
		alphaChars = regex;
	}

	if(s.slice(-1).search(alphaChars) === -1) {
		return s;
	} //else the last letter is an alphabetical character

	/** The string to be returned */
	var ret;
	/** An array of words that were separated by spaces in s */
	var words;
	/**
	 * An array of letters of the last partial word in s, which is
	 * separated by a space from earlier words and ends with the last
	 * non-alphabet character in the final word string.
	 */
	var penultimateWord;
	/** 
	 * An array of letters in the last word (or part of a word if
	 * it contains non-alphabet characters). This word/part of a word
	 * will be spelled letter-by-letter.
	 */
	var lastWord = [];

	/** while-loop control boolean */
	var done = false;

	words = s.split(' ');
	penultimateWord = words.pop().split('');

	//Split the last space-delimited "word" into two if it contains other than 
	//alphabet chars.
	while(!done) {
		if(penultimateWord[penultimateWord.length - 1].search(alphaChars) !== -1) {
			lastWord.unshift(penultimateWord.pop());
		} else {
			done = true;
		}

		if(penultimateWord <= 0) {
			done = true;
		}
	}

	//Concatenate and return the ret string
	ret = words.join(' ');
	if(penultimateWord.length > 0) {
		ret += ' ' + penultimateWord.join('');
	}
	ret += ' ' + lastWord.join(', ');
	return ret;
}


/**
 * This function fixes the pronunciation of a string given a dictionary
 * (hash) of keyword:replacement pairs.
 * @author J. Bern Jordan
 * @param {string} s The string to be checked for keywords to be replaced.
 * @param {Object} dictionary The dictionary/hash to be used. It should be
 * of the form: '{ "key1":"replacement1", "key2":"replacement2" }'
 * @param {boolean} [caseSensitive=false] if a case sensitive search should
 * be made.
 * @return {string} The string with replacements made.
 */
function fixPronunciation(s, dictionary, caseSensitive) {
	'use strict';
	/** The string to be made into a RegExp obj */
	var exp;
	/** An array of substrings of s to be searched for keys */
	var array;
	/** The array to be returned after join() into a string */
	var ret = [];

	if(caseSensitive === undefined) {
		caseSensitive = false;
	}

	/** Associative array to map lowercase key to real dictionary key */
	var lowerCaseShadow = {};
	if(!caseSensitive) {
		for(keyword in dictionary) {
			//noinspection JSUnfilteredForInLoop
            lowerCaseShadow[keyword.toLowerCase()] = keyword;
		}
	}

	//Build regular expression from the keys in the dictionary
	exp = '\\b(';
	for(var keyword in dictionary) {
		exp += keyword + '|';
	}
	exp = exp.slice(0, -1); //remove last pipe
	exp += ')\\b';

	if(caseSensitive) {
		array = s.split(new RegExp(exp, 'g'));
	} else {
		array = s.split(new RegExp(exp, 'gi'));
	}


	if(array.length <= 1) { //Thus keys not found
		return s;
	} // ELSE: need to replace words in the array

	if(caseSensitive) {
		for(var i = 0, n = array.length; i < n; i++) {
			if(dictionary[array[i]] !== undefined) {
				ret[i] = dictionary[array[i]];
			} else {
				ret[i] = array[i];
			}
		}
	} else {
		for(i = 0, n = array.length; i < n; i++) {
			if(lowerCaseShadow[array[i].toLowerCase()] !== undefined) {
				ret[i] = dictionary[lowerCaseShadow[array[i].toLowerCase()]];
			} else {
				ret[i] = array[i];
			}
		}
	}

	return ret.join('');
} //End fixPronunciation()


function alertEdgeNav(move) {

    edgeNavAttempt++;

    if(move !== 'top' && move !== 'bottom') throw new Error('Invalid value for move parameter.');

    if(edgeNavAttempt > alerts[move].length - 1) {
        edgeNavAttempt = alerts[move].length - 1;
    }

    var speak = alerts[move][edgeNavAttempt].value;

    voice(speak);

}