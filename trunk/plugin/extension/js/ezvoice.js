// Alert of how many times user has pressed up
var repeatAlert = 0;

// Global text to be read before next speech synthesis; can be set anywhere
var globalSayBefore = "";

var dictionary = null;

/**
  * Regular expression for alphabetical characters in ASCII.
  * NOTE: It would seem to be better to also allow for non-ASCII letters 
  * using something like: http://xregexp.com/
  * @const
  */
 var ALPHABET_CHAR = /[a-zA-Z]/;


// Provide easy place to change method of speech synthesis
function voice(obj,source,repeat) {
  var speech = "";
  if(typeof(obj)=='string') {
    speech = obj;
  }
  else {
		speech = voice_object(obj, source);
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
  
  var req = {"tts": speech,
			 "volume": String(audioVolume/100)};
	
  chrome.extension.sendRequest(req);
}




function voice_object(obj, source) {
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
  
  /**
   * Get name & role
   */
  name = getName(obj, source, name);
	role = getRole(obj, role);
  
  /**
   * Get value & extra for different elements
   */
	// obj is a DOM object; parse accordingly
	// Check if an input type
	if (obj.tagName === 'INPUT') {
		if (obj.hasAttribute('readonly') || obj.hasAttribute('disabled')) {
			if (obj.value) {
				value = 'is ' + obj.value;
			} else {
				value = 'is blank';
			}
		} else if (obj.type === 'radio') {
			value = obj.checked ? 'is checked' : 'is unchecked';
		} else if (obj.type === 'checkbox') {
			value = obj.checked ? 'is checked' : 'is unchecked';
		} else if (obj.type === 'range') {
			value = 'is at ' + obj.value;
			if (obj.hasAttribute('min') && obj.hasAttribute('max')) {
				extra = 'and ranges from ' + obj.min + ' to ' + obj.max;
			//The following are "sort of" error cases
			} else if (obj.hasAttribute('min')) {
				//With no max, Chrome returns '' but uses 100
				extra = 'and ranges from ' + obj.min + ' to 100';
			} else if (obj.hasAttribute('max')) {
				//With no min, Chrome returns '' but uses 0
				extra = 'and ranges from 0 to ' + obj.max;
			} else {
				extra = 'and ranges from 0 to 100';
			}
		} else if (obj.type === 'password') {
			value = 'contains ' + obj.value.length + ' characters';
		} else if (obj.type === 'text') {
			if (obj.value) {
				value = 'contains ' + getTypedSpeech(obj.value);
			} else {
				value = 'is blank';
			}
		} else if (obj.type === 'email') {
			if (obj.value) {
				value = 'contains ' + obj.value;
			} else {
				value = 'is blank';
			}
		} else if (obj.type === 'search') {
			if (obj.value) {
				value = 'contains ' + obj.value;
			} else {
				value = 'is blank';
			}
		} else if (obj.type === 'url') {
			if (obj.value) {
				value = 'contains ' + obj.value;
			} else {
				value = 'is blank';
			}
		} else if (obj.type === 'tel') {
			if (obj.value) {
				value = 'contains ' + obj.value;
			} else {
				value = 'is blank';
			}
		} else if (obj.type === 'number') {
			if (obj.value) {
				value = 'is ' + obj.value;
			} else {
				value = 'is blank';
			}
		}
	} else if (obj.tagName === 'SELECT') {
		if (obj.hasAttribute('multiple')) {
			var total = 0;
			var selected = [];
			for (var i = 0; i < obj.length; i++) {
				if (obj.options[i].selected) {
					selected.push(obj.options[i].value + "option " + (i+1));
					total++;
				}
			}
			var options = '';
			for (var i = 0; i < selected.length; i++) {
				if (i == selected.length-1 && selected.length > 1) {
					options += ' and ' + selected[i];
				} else if (i == 0) {
					options += selected[i];
				} else {
					options += ", " + selected[i];
				}
			}
			if (total == 1) {
				value += 'selected is ' + options;
			} else if(total != 0) {
				value += 'selected are ' + options;
			} else {
				value += 'is blank';
			}
		} else {
			if (obj.selectedIndex != -1) {
				value = 'is ' + obj.options[obj.selectedIndex].value;
			} else {
				value = 'is blank';
			}
		}
	} else if(obj.tagName === 'TEXTAREA') {
		if(obj.value) {
			value = "contains " + getTypedSpeech(obj.value);
		} else {
			value = 'is blank';
		}
	} else {
		speech = get_inner_alt(obj, source);
	}
	
	
	/**
	 * Get value which might override the ones found above
	 */
	value = getValue(obj, value);
	
	/**
	 * Concatenation for the speech string to be returned.
	 */
	if (speech === '') { //default concatenation
    speech = name + ' ' + role + ' ' + value + ' ' + extra + '.';
  }
  
	if (obj.tagname === 'A' && obj.hasAttribute('href')) {
    speech = role + ': ' + name;
  }

	// Replace override custom EZ Access
	speech = say_replace(obj, speech, source);

	return speech;
}

/**
 * This function looks for potential names for the element 
 * by looking at different ways of labeling that control type.
 * In precedence order, the name will be the object's:
 * data-ez-sayname > aria-labelledby > aria-label > <label> > 
 * tag-specific "labels" > defaultString
 * @author J. Bern Jordan
 * @param {DOM Object} obj The DOM object for which to get an 
 * accessible name.
 * @param {String} source The source modality: either 'nav' for navigation
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

	if (defaultString === undefined) {
		ret = '';
	} else {
		ret = defaultString;
	}
	
	var label = get_label(obj);

	if (obj.hasAttribute('aria-labelledby')) {
		ret = '';
		var labelIDs = obj.getAttribute('aria-labelledby').split(' ');
		for (var i = 0; i < labelIDs.length; i++) {
			ret += document.getElementById(labelIDs[i]).textContent;
			ret += ' ';
		}
	} else if (obj.hasAttribute('aria-label')) {
		ret = obj.getAttribute('aria-label');
	} else if (label !== null) { 
		//always check for a label before checking for default names
		if(typeof label === "object") {
			ret = say_replace(label, get_inner_alt(label, source), source);
		} else {
			ret = label;
		}
	}
  // Get generic name for specific input types
  else if (obj.tagName === 'INPUT') {
		if (obj.hasAttribute('readonly') || obj.hasAttribute('disabled')) {
			ret = 'Disabled field';
		} else if (obj.type === 'submit') {
			if (obj.hasAttribute('value')) {
				ret = obj.value;
			} else {
				ret = 'Submit';
			}
		} else if (obj.type === 'reset') {
			if (obj.hasAttribute('value')) {
				ret = obj.value;
			} else {
				ret = 'Reset';
			}
		} else if (obj.type === 'button') {
			if (obj.hasAttribute('value')) {
				ret = obj.value;
			}
		} else if (obj.type === 'image') {
			//alt is preferred, title is second choice
			if (obj.hasAttribute('alt')) {
				ret = obj.alt;
			} else if (obj.title) {
				ret = obj.title;
			} else {
				ret = 'Image';
			}
		} else if (obj.type === 'password' || obj.type === 'text'   ||
               obj.type === 'email'    || obj.type === 'search' ||
               obj.type === 'url'      || obj.type === 'tel'    ||
               obj.type === 'number'                               ) {
			if (obj.hasAttribute('placeholder')) {
        /**
         * Using a placeholder as a label is NOT generally recommended, 
         * but it is probably better than nothing in this case (because 
         * no other more appropriate label/name can be found).
         */
        ret = obj.getAttribute('placeholder');
      }
		} //Now tags besides <input />...
	} else if(obj.tagName === 'BUTTON') {
		ret = get_inner_alt(obj, source);
	} else if(obj.tagName === 'IMG') { //TODO - check if necessary
		if(obj.alt) {
			ret = obj.alt;
		}
	} else if(obj.tagName === 'A' && obj.hasAttribute('href')) {
		ret = get_inner_alt(obj, source); 
	} else if(obj.tagName === 'TEXTAREA') {
		if (obj.hasAttribute('placeholder')) {
      /**
       * Using a placeholder as a label is NOT generally recommended, 
       * but it is probably better than nothing in this case (because 
       * no other more appropriate label/name can be found).
       */
      ret = obj.getAttribute('placeholder');
    }
	}

	return ret;
} //End function getName()

/**
 * This function looks for a potential role string and returns it.
 * In precedence order, the role string will be the object's:
 * data-ez-sayrole > aria-role > input-specific roles > defaultString
 * @author J. Bern Jordan
 * @param {DOM Object} obj The DOM object for which to get role.
 * @param {String} [defaultString=''] A default string for the object's 
 * role if a more appropriate one is not found.
 * @return {String} An accessible role for the passed object. 
 * The returned string is the default if an overriding role
 * is not found.
 */
 function getRole(obj, defaultString) {
	'use strict';
	var ret;
  
	if (defaultString === undefined) {
		ret = '';
	} else {
		ret = defaultString;
	}

	if(obj.hasAttribute('data-ez-sayrole')) {
		ret = obj.getAttribute('data-ez-sayrole');
	} else if (obj.hasAttribute('aria-role')) {
		ret = obj.getAttribute('aria-role');
	}
  
  // Roles for specific input types
	else if (obj.tagName === 'INPUT') {
		if(obj.type === 'submit' || obj.type === 'button' || 
       obj.type === 'reset'                              ) {
			ret = 'Button';
		} else if (obj.type === 'image') {
			ret = 'image input';
		} else if (obj.type === 'radio') {
			ret = 'Radio Button';
		} else if (obj.type === 'checkbox') {
			ret = 'Checkbox';
		} else if (obj.type === 'range') {
			ret = 'Slider';
		} else if (obj.type === 'password') {
			ret = 'Password field';
		} else if (obj.type === 'text') {
			ret = 'Text field';
		} else if (obj.type === 'email') {
			ret = 'E-mail field';
		} else if (obj.type === 'search') {
			ret = 'Search field';
		} else if (obj.type === 'url') {
			ret = 'Web address field';
		} else if (obj.type === 'tel') {
			ret = 'Telephone field';
		} else if (obj.type === 'number') {
			ret = 'Number field'; //spinner in Chrome
		}
	} else if (obj.tagName === 'BUTTON') {
		ret = 'Button';
	} else if (obj.tagName === 'IMG') { //TODO - check if necessary
		if (!obj.hasAttribute('alt')) {
			ret = "Image";
		}
	} else if (obj.tagName === 'A' && obj.hasAttribute('href')) {
		ret = 'Link';
	} else if (obj.tagName === 'SELECT') {
		if (obj.hasAttribute('multiple')) {
			ret = 'Multiple-selections menu';
		} else {
			ret = 'Menu';
		}
	} else if (obj.tagName === 'TEXTAREA') {
		ret = 'Text area';
	} 

	return ret;
} //End function getRole()

/**
 * This function looks for a potential value string and returns it.
 * In precedence order, the value string will be the object's:
 * data-ez-sayvalue > aria-valuetext > aria-valuenow > defaultString
 * This function does NOT look for values specific to different tags.
 * @author J. Bern Jordan
 * @param {DOM Object} obj The DOM object for which to get role.
 * @param {String} [defaultString=''] A default string for the object's 
 * value if a more appropriate one is not found.
 * @return {String} An value for the passed object. The returned string is 
 * the defaultString if an overriding value is not found.
 */
 function getValue(obj, defaultString) {
	'use strict';
	var ret, temp;
	if (defaultString === undefined) {
		ret = '';
	} else {
		ret = defaultString;
	}

	if(obj.hasAttribute('data-ez-sayvalue')) {
		ret = obj.getAttribute('data-ez-sayvalue');
	} else if (obj.hasAttribute('aria-valuetext')) {
		temp = obj.getAttribute('aria-valuetext');
    if (temp.length > 0) {
		  ret = 'is ' + temp;
    }
	} else if (obj.hasAttribute('aria-valuenow')) {
		temp = obj.getAttribute('aria-valuenow');
    if (temp.length > 0) {
      ret = 'is ' + temp;
    }
	}

	return ret;
} //End function getValue()


function get_inner_alt(obj, source) {
	var speech = "";
	for(var i = 0; i < obj.childNodes.length; i++) {
		if(obj.childNodes[i].nodeType == 3) {
			speech += obj.childNodes[i].nodeValue;
		} else if(obj.childNodes[i].nodeType == 1 && obj.tagName !== 'LABEL') {
			speech += voice_object(obj.childNodes[i], source);
		}
	}
	return speech;
}

// Sayalt
function say_replace(obj, speech, source) {
	
	// data-ez-sayalt
	if(source == 'nav' && obj.hasAttribute('data-ez-sayalt-nav')) {
		speech = obj.getAttribute('data-ez-sayalt-nav');
	}
	else if(source == 'point' && obj.hasAttribute('data-ez-sayalt-point')) {
		speech = obj.getAttribute('data-ez-sayalt-point');
	}
	else if(obj.hasAttribute('data-ez-sayalt')) {
		speech = obj.getAttribute('data-ez-sayalt');
	}
	// data-ez-saybefore
	if(source == 'nav' && obj.hasAttribute('data-ez-saybefore-nav')) {
		speech = obj.getAttribute('data-ez-saybefore-nav') + ' ' + speech;
	}
	else if(source == 'point' && obj.hasAttribute('data-ez-saybefore-point')) {
		speech = obj.getAttribute('data-ez-saybefore-point') + ' ' + speech;
	}
	else if(obj.hasAttribute('data-ez-saybefore')) {
		speech = obj.getAttribute('data-ez-saybefore') + ' ' + speech;
	}
	
	// data-ez-sayafter
	if(source == 'nav' && obj.hasAttribute('data-ez-sayafter-nav')) {
		speech += ' ' + obj.getAttribute('data-ez-sayafter-nav');
	}
	else if(source == 'point' && obj.hasAttribute('data-ez-sayafter-point')) {
		speech += ' ' + obj.getAttribute('data-ez-sayafter-point');
	}
	else if(obj.hasAttribute('data-ez-sayafter')) {
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
 * @param {Regex} [regex=ALPHABET_CHAR] The regular expression object that is 
 * to be used for alphabetic characters.
 * @return {string} The string for the speech output
 */
function getTypedSpeech(s, regex) {
  /** The regex object for finding alphabet characters */
  var alphaChars;
  if (regex === undefined) {
    alphaChars = ALPHABET_CHAR;
  } else {
    alphaChars = regex;
  }

	if (s.slice(-1).search(alphaChars) === -1) {
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
	/** The last word spelled character by character */
	var spelledWord;
	/** while-loop control boolean */
	var done = false;
	
	words = s.split(' ');
	penultimateWord = words.pop().split('');
	
  //Split the last space-delimited "word" into two if it contains other than 
  //alphabet chars.
	while (!done) {
		if (penultimateWord[penultimateWord.length-1].search(alphaChars) !== -1) {
			lastWord.unshift(penultimateWord.pop());
		} else {
			done = true;
		}
		
		if (penultimateWord <= 0) {
			done = true;
		}
	}
	
  //Concatenate and return the ret string
	ret = words.join(' ');
	if (penultimateWord.length > 0) {
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
   
  if (caseSensitive === undefined) {
    caseSensitive = false;
  }
  
  /** Associative array to map lowercase key to real dictionary key */
	var lowerCaseShadow = { };
  if(!caseSensitive) {
		for(var keyword in dictionary) {
			lowerCaseShadow[keyword.toLowerCase()] = keyword;
		}
	}
	
	//Build regular expression from the keys in the dictionary
	exp = '\\b(';
	for (var keyword in dictionary) {
		exp += keyword + '|';
	}
	exp = exp.slice(0,-1); //remove last pipe
	exp += ')\\b';
	
  if (caseSensitive) {
    array = s.split(new RegExp(exp, 'g'));
  } else {
    array = s.split(new RegExp(exp, 'gi'));
  }
 
   
  if (array.length <= 1) { //Thus keys not found
		return s; 
	} // ELSE: need to replace words in the array
	
	if (caseSensitive) {
		for (var i=0, n=array.length; i<n; i++) {
			if (dictionary[array[i]] !== undefined) {
				ret[i] = dictionary[array[i]];
			} else {
				ret[i] = array[i];
			}
		}
	} else {
		for (var i=0, n=array.length; i<n; i++) {
			if (lowerCaseShadow[array[i].toLowerCase()] !== undefined) {
				ret[i] = dictionary[lowerCaseShadow[array[i].toLowerCase()]];
			} else {
				ret[i] = array[i];
			}
		}
	}

	return ret.join('');
} //End fixPronunciation()