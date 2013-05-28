/*
    Author:   Alexander Harding
              Trace Center
              University of Wisconsin at Madison
            
    Desc:     Designed to parse any webpage (when the JS is included)
              for accessibility -- utilizes custom HTML attributes
              (see the EZ-Access HTML plug-in manual)
              
    License:  Copyright 2012 Trace Center

                 Licensed under the Apache License, Version 2.0 (the "License");
                 you may not use this file except in compliance with the License.
                 You may obtain a copy of the License at

                     http://www.apache.org/licenses/LICENSE-2.0

                 Unless required by applicable law or agreed to in writing, software
                 distributed under the License is distributed on an "AS IS" BASIS,
                 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                 See the License for the specific language governing permissions and
                 limitations under the License.
                 
   Scripts:   A few scripts are used in this program. If not identified, they have been released
              to the public domain:
                  1. hammer.js - Provides multitouch support
                  2. speak.js  - Provides speech generation (not for plugin version)
                  3. TinyBox   - Modal window script for help
*/

// Tab keycodes
var KB_TAB = 9;
var KB_SHIFT = 16;
var KB_ENTER = 13;

//EZ-Access keycode declarations
var EZ_KEY_SKIPFORWARD = 135; // is >>
var EZ_KEY_SKIPBACKWARD = 134; // is <<
var EZ_KEY_HELP = 128; // is ?
var EZ_KEY_BACK = 132; // is BACK
var EZ_KEY_NEXT = 133; // is NEXT
var EZ_KEY_UP = 129; // is up arrow key
var EZ_KEY_DOWN = 130; // is down arrow key
var EZ_KEY_ENTER = 131; // is green circle enter key

/**
* AUDIO CONSTANTS finder function
* loads all audio files into cache
*/
function load_audio() {
  var i;
  for (i = 0; i < sounds.length; i++) {
    sounds[i].feed = new Audio(chrome.extension.getURL(sounds[i].src));
  }
}

/**
 * Searches sounds array of objects for name of sound
 * @param audio_name Name of the audio file to search in object for
 * @return {Number} Position in sounds[].name array
 */
function find_audio(audio_name) {
  for(var i = 0; i < sounds.length; i++) {
      if (audio_name === sounds[i].name) {
          return i;
      }
  }
  console.log('No audio file named "'+audio_name+'" found (below error for more info).'); // Debugging
  return -1;
}

function set_volume() {
  for(var i = 0; i < sounds.length; i++) {
    sounds[i].feed.volume = audioVolume/100;
  }
}

/**
 *  AUDIO CONSTANTS
 * These usually shouldn't be changed (cached indexes): just change
 * the URL for the audio name in the settings.json file.
 */
var AUDIO_MOVE      = find_audio('move');
var AUDIO_SELECT    = find_audio('select');
var AUDIO_DESELECT  = find_audio('deselect');
var AUDIO_NOACTION  = find_audio('noaction');
var AUDIO_BUTTON    = find_audio('button');

function getElementAudio() {
  for(var tmp = ['p','span','div','h1','h2','h3','h4','h5','li'], i = 0; i < tmp.length; i++) {
    // To simplify comparing to a whole lot of possibilities, use a loop
    if(getClick(selectElements[currIndex]) !== undefined || selectElements[currIndex].tagName == 'INPUT') {
      return AUDIO_BUTTON;
    }
    if(selectElements[currIndex].tagName == tmp[i].toUpperCase()) {
      return AUDIO_MOVE;
    }
  }
  console.log('No specific sound for "' + selectElements[currIndex].tagName + '" HTML tag.');
  return AUDIO_MOVE;
}

// Selector ID to use on the page
var ezSelectorId = 'ezselected';

// Tags that are candidates for highlight
var COMPATIBLE_TAGS = 'p,img,a,div,h1,h2,h3,h4,h5,figure,figcaption,ul,ol,li,input,button,textarea,select,article,aside,hgroup,legend,dt,dd';

// Array of tags generated on pageload initialized globally
var selectElements;

// Current index (of selectElements array) for navigation purposes
var currIndex = 0;

// Whether EZ navigation mode is activated or not
var ez_navigateToggle = false;

// If autoadvance is enabled or not
// Also autoadvance timer is global to disable from other functions
var autoAdvance = 0;
var autoAdvTimer;

// Wrap elements on the screen
var screenWrap = false;

// Determines key autorepeat preperty or not
var autoRepeat = 'off';

// Keep track if the TINY modal is open or not
var tinyOpen = false;

// Global idle loop timer if no user action is taken
var idleLoop;

// Volume of the audio elements (0-100)
if(sessionStorage.getItem("EZ_Volume") !== null) {
  var audioVolume = parseInt(sessionStorage.getItem("EZ_Volume"));
} else {
  var audioVolume = 100;
}

// Global text to be read before next speech synthesis; can be set anywhere
var globalSayBefore = "";

// Whether slide to read is enabled universally
var slideToRead = true;

// Whether to allow reordering elements manually from DOM standard.
var allowReorder = false;

// Tabular navigation behavior (& cooperation w/ browser)
var tabNav = 'ezaccess';

// Alert of how many times user has pressed up
var repeatAlert = 0;

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
  if(speech.length > 300) { voice("One moment"); } // If speech generation will take a while
  
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

	// obj is a DOM object; parse accordingly
	
	// Check if an input type
	if(obj.tagName == 'INPUT') {
		if(obj.hasAttribute('readonly') || obj.hasAttribute('disabled')) {
			name = "Disabled field";
			if(obj.value) {
				value = 'is ' + obj.value;
			} else {
				value = 'is blank';
			}
		} else if(obj.type == 'submit') {
			if(obj.hasAttribute('value')) {
				name = obj.value;
			} else {
				name = "Submit";
			}
			role = "Button";
		} else if(obj.type == 'reset') {
			if(obj.hasAttribute('value')) {
				name = obj.value;
			} else {
				name = "Reset";
			}
			role = "Button";
		} else if(obj.type == 'button') {
			if(obj.hasAttribute('value')) {
				name = obj.value;
			}
			role = "Button";
		} else if(obj.type == 'image') {
			//alt is preferred, title is second choice
			if(obj.hasAttribute('alt')) {
				name = obj.alt;
			} else if(obj.title) {
				name = obj.title;
			} else {
				name = "Image";
			}
			role = "image input";
		} else if(obj.type == 'radio') {
			role = "Radio Button";
			value = obj.checked ? 'is checked' : 'is unchecked';
		} else if(obj.type == 'checkbox') {
			role = "Checkbox";
			value = obj.checked ? 'is checked' : 'is unchecked';
		} else if(obj.type == 'range') {
			role = "Slider";
			value = 'is at ' + obj.value;
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
		} else if(obj.type == 'password') {
			role = "Password field";
			value = 'contains ' + obj.value.length + ' characters';
		} else if(obj.type == 'text') {
			role = "Text field";
			if(obj.value) {
				value = "contains " + obj.value;
			} else {
				value = "is blank";
			}
		} else if(obj.type == 'email') {
			role = "E-mail field";
			if(obj.value) {
				value = "contains " + obj.value;
			} else {
				value = "is blank";
			}
		} else if(obj.type == 'search') {
			role = "Search field";
			if(obj.value) {
				value = "contains " + obj.value;
			} else {
				value = "is blank";
			}
		} else if(obj.type == 'url') {
			role = "Web address field";
			if(obj.value) {
				value = "contains " + obj.value;
			} else {
				value = "is blank.";
			}
		} else if(obj.type == 'tel') {
			role = "Telephone field";
			if(obj.value) {
				value = "contains " + obj.value;
			} else {
				value = "is blank";
			}
		} else if(obj.type == 'number') {
			role = "Number field"; //spinner in Chrome
			if(obj.value) {
				value = "contains " + obj.value;
			} else {
				value = "is blank";
			}
		}
	} else if(obj.tagName == "BUTTON") {
		//TODO - check the output
		name = get_inner_alt(obj, source);
		role = 'Button';
	} else if(obj.tagName == "IMG") { //TODO - check if necessary
		if(obj.alt) {
			name = obj.alt;
		} else {
			role = "Image";
		}
	} else if(obj.tagName == "A" && obj.hasAttribute('href')) {
		name = get_inner_alt(obj, source); 
		role = 'Link';
		//Override the speech output for <a href="...">
		speech = role + ': ' + name;
	} else if(obj.tagName == "SELECT") {
		if(obj.hasAttribute('multiple')) {
			role = "Multiple-selections menu";
			var total = 0;
			var selected = new Array();
			for(var i = 0; i < obj.length; i++) {
				if(obj.options[i].selected) {
					selected.push(obj.options[i].value + "option " + (i+1));
					total++;
				}
			}
			var options = "";
			for(var i = 0; i < selected.length; i++) {
				if(i == selected.length-1 && selected.length > 1) {
					options += " and " + selected[i];
				} else if(i == 0) {
					options += selected[i];
				} else {
					options += ", " + selected[i];
				}
			}
			if(total == 1) {
				value += "selected is " + options;
			} else if(total != 0) {
				value += "selected are " + options;
			} else {
				value += "is blank";
			}
		} else {
			if(obj.selectedIndex != -1) {
				role = 'Menu';
				value = 'is ' + obj.options[obj.selectedIndex].value;
			} else {
				role = 'Menu';
				value = 'is blank';
			}
		}
	} else if(obj.tagName == "TEXTAREA") {
		role = "Text area";
		if(obj.value) {
			value = "contains " + obj.value;
		} else {
			value = "is blank";
		}
	} else {
		speech = get_inner_alt(obj, source);
	}
	
	
	/**
	 * Get name, role, and value which might override the ones found above
	 */
	name = getName(obj, source, name);
	role = getRole(obj, role);
	value = getValue(obj, value);
	
	/**
	 * Default concatenation for the speech string to be returned.
	 * This can be overridden if the speech string has already been defined.
	 */
	if (speech === '') {
		speech = name + ' ' + role + ' ' + value + ' ' + extra + '.';
	}

	// Replace override custom EZ Access
	speech = say_replace(obj, speech, source);

	return speech;
}

/**
 * This function looks for potential names for the element 
 * by looking at different ways of labeling that control type.
 * In precedence order, the name will be the object's:
 * data-ez-sayname > aria-labelledby > aria-label > <label> > defaultString
 * @author J. Bern Jordan
 * @param {DOM Object} obj The DOM object for which to get an 
 * accessible name.
 * @param {String} source The source modality: either 'nav' for navigation or
 * 'point' for pointing.
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

	if (obj.hasAttribute('aria-labelledby')) {
		ret = '';
		var labelIDs = obj.getAttribute('aria-labelledby').split(' ');
		for (var i = 0; i < labelIDs.length; i++) {
			ret += document.getElementById(labelIDs[i]).textContent;
			ret += ' ';
		}
	} else if(obj.hasAttribute('aria-label')) {
		ret = obj.getAttribute('aria-label');
	} else {
		var label = get_label(obj);
		if(label !== null) {
			if(typeof label === "object") {
				ret = say_replace(label, get_inner_alt(label, source), source);
			} else {
				ret = label;
			}
		}
	}

	return ret;
} //End function getName()

/**
 * This function looks for a potential role string and returns it.
 * In precedence order, the role string will be the object's:
 * data-ez-sayrole > aria-role > defaultString
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

	return ret;
} //End function getRole()

/**
 * This function looks for a potential value string and returns it.
 * In precedence order, the value string will be the object's:
 * data-ez-sayvalue > aria-valuetext > aria-valuenow > defaultString
 * @author J. Bern Jordan
 * @param {DOM Object} obj The DOM object for which to get role.
 * @param {String} [defaultString=''] A default string for the object's 
 * role if a more appropriate one is not found.
 * @return {String} An value for the passed object. The returned string is 
 * the dafaultString if an overriding value is not found.
 */
 function getValue(obj, defaultString) {
	'use strict';
	var ret;
	if (defaultString === undefined) {
		ret = '';
	} else {
		ret = defaultString;
	}

	if(obj.hasAttribute('data-ez-sayvalue')) {
		ret = obj.getAttribute('data-ez-sayvalue');
	} else if (obj.hasAttribute('aria-valuetext')) {
		//may wish to check if aria-valuetext is blank
		ret = 'is ' + obj.getAttribute('aria-valuetext');
	} else if (obj.hasAttribute('aria-valuenow')) {
		ret = 'is ' + obj.getAttribute('aria-valuenow');
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
	if(source == 'nav' && obj.getAttribute('data-ez-sayalt-nav')) {
		speech = obj.getAttribute('data-ez-sayalt-nav');
	}
	else if(source == 'point' && obj.getAttribute('data-ez-sayalt-point')) {
		speech = obj.getAttribute('data-ez-sayalt-point');
	}
	else if(obj.getAttribute('data-ez-sayalt')) {
		speech = obj.getAttribute('data-ez-sayalt');
	}
	// data-ez-saybefore
	if(source == 'nav' && obj.getAttribute('data-ez-saybefore-nav')) {
		speech = obj.getAttribute('data-ez-saybefore-nav') + ' ' + speech;
	}
	else if(source == 'point' && obj.getAttribute('data-ez-saybefore-point')) {
		speech = obj.getAttribute('data-ez-saybefore-point') + ' ' + speech;
	}
	else if(obj.getAttribute('data-ez-saybefore')) {
		speech = obj.getAttribute('data-ez-saybefore') + ' ' + speech;
	}
	
	// data-ez-sayafter
	if(source == 'nav' && obj.getAttribute('data-ez-sayafter-nav')) {
		speech += ' ' + obj.getAttribute('data-ez-sayafter-nav');
	}
	else if(source == 'point' && obj.getAttribute('data-ez-sayafter-point')) {
		speech += ' ' + obj.getAttribute('data-ez-sayafter-point');
	}
	else if(obj.getAttribute('data-ez-sayafter')) {
		speech += ' ' + obj.getAttribute('data-ez-sayafter');
	}
	
	return speech;
	
}



function ez_help(alert) {
  var helptext = String(alert);
  TINY.box.show("<span style='font-size:150%'>" + helptext + "</span>",0,400,0,0);
  voice(String(helptext));
}

//Finds y value of given object -- for automated scrolling
function findPos(obj) {
    var curtop = -100;
    if (obj.offsetParent) {
        do {
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
    return [curtop];
    }
}

/* http://www.quirksmode.org/dom/getElementsByTagNames.html
   Gets all elements, IN ORDER _AND_ by element name.
   Commands:
   list :: A string with a comma-separated list of tag names.
   obj  :: An optional start element. If it's present the script searches only for tags that
           are descendants of this element, if it's absent the script searches the entire document. */
function getElementsByTagNames(list,obj) {
	if (!obj) var obj = document;
	var tagNames = list.split(',');
	var resultArray = new Array();
	for (var i=0;i<tagNames.length;i++) {
		var tags = obj.getElementsByTagName(tagNames[i]);
		for (var j=0;j<tags.length;j++) {
			resultArray.push(tags[j]);
		}
	}
	var nodeList_parsed = document.querySelectorAll("[data-ez-parse]")
	
	var force_parsed=[], l=nodeList_parsed.length>>>0; // Convert to array
	for( ; l--; force_parsed[l]=nodeList_parsed[l] );
	
	for(var i = 0; i < force_parsed.length;) {
		if(!isDescendant(obj, force_parsed[i])) {
			force_parsed.splice(i, 1);
		} else {
			i++;
		}
	}
	
	resultArray = resultArray.concat(force_parsed);
	
	var testNode = resultArray[0];
	if (!testNode) return [];
	if (testNode.sourceIndex) {
		resultArray.sort(function (a,b) {
				return a.sourceIndex - b.sourceIndex;
		});
	}
	else if (testNode.compareDocumentPosition) {
		resultArray.sort(function (a,b) {
				return 3 - (a.compareDocumentPosition(b) & 6);
		});
	}
	
	return resultArray;
}

function isDescendant(parent, child) {
     var node = child.parentNode;
     while (node != null) {
         if (node == parent) {
             return true;
         }
         node = node.parentNode;
     }
     return false;
}

// Event listener if window is resized the selected box will be redrawn
// TODO: Make not overwrite anything else
window.onresize = function() {
  if(ez_navigateToggle) { drawSelected(selectElements[currIndex]); }
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Draws selected box around DOM object referenced to
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
    div.setAttribute("data-ez-focusable","false");
	var rgb = "rgba("+hexToRgb(EzCustomColor).r+","+hexToRgb(EzCustomColor).g+","+hexToRgb(EzCustomColor).b+",";
    var rgbinverse = "rgba("+(255-hexToRgb(EzCustomColor).r)+","+(255-hexToRgb(EzCustomColor).g)+","+(255-hexToRgb(EzCustomColor).b)+",";
	// Load the CSS pulsing Stuff
	var cssAnimation = document.createElement('style');
	cssAnimation.type = 'text/css';
	var rules = document.createTextNode('@-webkit-keyframes pulse {'+
	'from { border:5px solid '+rgb+'1); }'+
	'50% { border:5px solid '+rgbinverse+'0.5); }'+
	'to { border:5px solid '+rgb+'0); }'+
	'}');
	cssAnimation.appendChild(rules);
	document.getElementsByTagName("head")[0].appendChild(cssAnimation);
    
    div.style.border = "5px solid "+rgb+"1)";
    div.style['boxShadow'] = "0px 0px 15px 5px "+rgb+".80)";
    div.id = ezSelectorId;
    if (document.body.firstChild) {
      document.body.insertBefore(div, document.body.firstChild);
    } else {
      document.body.appendChild(div);
    }
    old = document.getElementById(ezSelectorId); // Redefine the new selected div
  }
  old.style.visibility = "visible";
  old.style.left = pos.x-10+'px';
  old.style.top = pos.y-10+'px';
  old.style.width = obj.offsetWidth+10+'px';
  old.style.height = obj.offsetHeight+10+'px';
  //obj.style.display = tmp; // INLINE BLOCK OUTLINE FIXER
  return true;
}

function ez_navigate_start(propagated) {
  ez_navigateToggle = true;
  sessionStorage.setItem("EZ_Toggle", "1");
  if(document.body.getAttribute('data-ez-startat') !== null) {
    if(propagated) {
      // Of "#<id> #<id>" of second element
      var startid = document.body.getAttribute('data-ez-startat').split(" ")[1].slice(1);
    } else {
      // Of "#<id> #<id>" of first element
      var startid = document.body.getAttribute('data-ez-startat').split(" ")[0].slice(1);
    }
    for(var i = 0; i < selectElements.length;i++) {
      if(selectElements[i].id !== null && selectElements[i].id == startid) {
        currIndex = i;
        break;
      } // Else, default initial currIndex = 0 (from beginning)
    }
  } else {
		if(propagated) {
			if(document.URL.indexOf("#") != -1) {
					var jumpTo = document.URL.substring(document.URL.indexOf("#")+1);
					var idLocation = getCurrIndexById(jumpTo);
					if(idLocation != -1) {
						currIndex = idLocation;
					}
			}
		}
  }
  auto_advance_set(); // Find if autoadvancing element
  if(!propagated) {
    sounds[getElementAudio()].feed.play();
  }
	drawSelected(selectElements[currIndex]);
  voice(selectElements[currIndex],'nav');
}

function groupSkip(move) {
  if(selectElements[currIndex].getAttribute('data-ez-chunking') == 'group' && selectElements[currIndex].getAttribute('data-ez-subnavtype') == 'nested' || selectElements[currIndex].getAttribute('data-ez-subnavtype') == 'hierarchical') {
    if(move == 'down') {
      return currIndex + indexElements(selectElements[currIndex]).length;
    }
  }
  else if(move == 'up') {
    if(selectElements[currIndex].getAttribute("data-tmp-jump") !== null) {
      return parseFloat(selectElements[currIndex].getAttribute("data-tmp-jump"));
    }
  }
  return false;
}

function hierarchicalStopper(move) {
  var oldLevel = selectElements[currIndex].getAttribute('data-tmp-level');
  var newLevel;
  var skip;
  if(move == 'down') {
    skip = currIndex + indexElements(selectElements[currIndex]).length+1;
    newLevel = selectElements[skip].getAttribute('data-tmp-level');
  } else if(move == 'up') {
    skip = selectElements[currIndex-1].getAttribute("data-tmp-jump");
    if(skip === null) {
      skip = currIndex-1;
    } else {
      skip = parseFloat(selectElements[currIndex-1].getAttribute("data-tmp-jump"));
    }
    newLevel = selectElements[skip].getAttribute('data-tmp-level');
  }
  if(newLevel == 0 && oldLevel == 0) { return false; }
  if(newLevel != oldLevel) {
    if(selectElements[findGroupParent()].getAttribute("data-ez-chunking") == 'group' && selectElements[findGroupParent()].getAttribute("data-ez-subnavtype") == 'hierarchical') {
      document.getElementById(ezSelectorId).className = 'pulse';
      setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
      sounds[AUDIO_NOACTION].feed.play();
      voice("Press back to leave the group");
      return true;
    } else if(selectElements[findGroupParent()].getAttribute("data-ez-chunking") == 'group' && selectElements[findGroupParent()].getAttribute("data-ez-subnavtype") == 'nested') {
      globalSayBefore = "Navigating out of group... ";
    }
  }
  return false;
}

function findGroupParent() {
  var oldLevel = selectElements[currIndex].getAttribute('data-tmp-level');
  var i = currIndex;
  while(i > 0 && parseFloat(selectElements[i].getAttribute('data-tmp-level')) >= oldLevel) {
    i--;
  }
  if(i == currIndex) { return currIndex; } // No group (@ 0th level)
  return i; // Return group element currIndex #
}

function idle_loop(display) {
  if(!display) {
	if(alerts.idle.wait != -1) {
		idleLoop = self.setInterval(function(){idle_loop(true)},alerts.idle.wait);
	}
  } else {
    if(!tinyOpen && !ez_navigateToggle) {
      idleLoop = self.clearInterval(idleLoop);
      tinyOpen = true;
      ez_help(alerts.idle.value);
    }
  }
}

function getCurrIndexById(id) {
  for(var i = 0; i < selectElements.length; i++) {
    if(selectElements[i].id == id) {
      return i;
    }
  }
  return -1;
}

function getCurrIndexByName(name) {
	for(var i = 0; i < selectElements.length; i++) {
    if(selectElements[i].getAttribute('name') == name) {
      return i;
    }
  }
  return -1;
}

// Like ez_navigate("down"), but for when navigating to first element inside a group
function ez_navigate_in_group() {
  if(selectElements[currIndex].getAttribute('data-ez-groupdefault') !== null) {
    ez_jump(getCurrIndexById(selectElements[currIndex].getAttribute('data-ez-groupdefault').split(' ')[0]));
    return;
  }
  currIndex++;
  if(selectElements[currIndex].getAttribute('data-ez-focusable-nav') == 'false' || selectElements[currIndex].getAttribute('data-ez-focusable') == 'false') { ez_navigate_in_group(); return; }
  if(!drawSelected(selectElements[currIndex])) { ez_navigate('down'); return; }
  sounds[getElementAudio()].feed.play();
  selectElements[currIndex].focus(); // Add focus to new element
  voice(selectElements[currIndex],'nav',globalSayBefore);
}

// Finds the first or last focusable element of selectElements; returns index
function findFocusable(location) {
	if(location == 'last') {
		for(var i = selectElements.length-1; i > 0;) {
			var pos = getElementAbsolutePos(selectElements[i]);
			if(selectElements[i].getAttribute('data-ez-focusable-nav') == 'false' || selectElements[i].getAttribute('data-ez-focusable') == 'false') {
				i--;
			} else if(!pos || selectElements[i].offsetWidth == 0 || selectElements[i].offsetWidth == 0) {
				// If there is a problem finding the element position
				i--;
			} else {
				return i;
			}
		}
		return 0;
	} else if(location == 'first') {
		for(var i = 0; i < selectElements.length-1;) {
			var pos = getElementAbsolutePos(selectElements[i]);
			if(selectElements[i].getAttribute('data-ez-focusable-nav') == 'false' || selectElements[i].getAttribute('data-ez-focusable') == 'false') {
				i++;
			} else if(!pos || selectElements[i].offsetWidth == 0 || selectElements[i].offsetWidth == 0) {
				// If there is a problem finding the element position
				i++;
			} else {
				return i;
			}
		}
		return selectElements.length-1;
	}
	return null;
}

function ez_navigate(move) {
	var currElement = selectElements[currIndex];
	index_ez();
	currIndex = 0;
	for(var i = 0; i < selectElements.length; i++) {
		if(selectElements[i] == currElement) {
			currIndex = i;
			break;
		}
	}
	
  if(move == 'down') {
    if(currIndex < findFocusable('last')) {
      selectElements[currIndex].blur(); // Add blur to old element
      repeatAlert = 0;
      if(allowReorder && selectElements[currIndex].getAttribute('aria-flowto') !== null) {
        ez_jump(getCurrIndexById(selectElements[currIndex].getAttribute('aria-flowto').split(' ')[0]));
        return;
      }
      if(hierarchicalStopper('down')) {
        return;
      }
      if(groupSkip('down') != false) {
        currIndex = groupSkip('down');
      }
      currIndex++;
      if(selectElements[currIndex].getAttribute('data-ez-focusable-nav') == 'false' || selectElements[currIndex].getAttribute('data-ez-focusable') == 'false') { ez_navigate('down'); return; }
      // If the element location cannot be found; loop through.
      if(!drawSelected(selectElements[currIndex])) { ez_navigate('down'); return; }
			auto_advance_set(); // Find if autoadvancing element
      sounds[getElementAudio()].feed.play();
      selectElements[currIndex].focus(); // Add focus to new element
      voice(selectElements[currIndex],'nav',globalSayBefore);
    } else { // Basically, keep looping through 'warnings' until user stops or if there are no more speech elements, and wrap is true, jump to bottom of screen.
      if(repeatAlert < alerts.bottom.length-1) {
        repeatAlert++;
        document.getElementById(ezSelectorId).className = 'pulse';
        setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
        voice(alerts.bottom[repeatAlert].value);
      } else {
        if(screenWrap) {
          currIndex = findFocusable('first');
          repeatAlert = 0;
          if(!drawSelected(selectElements[currIndex])) { ez_navigate('down'); return; }
          sounds[getElementAudio()].feed.play();
          voice(selectElements[currIndex],'nav');
        } else {
          document.getElementById(ezSelectorId).className = 'pulse';
          setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
          sounds[AUDIO_NOACTION].feed.play();
          voice(alerts.bottom[repeatAlert].value);
        }
      }
    }
  }
  else if(move == 'up') {
    if(currIndex > findFocusable('first')) {
      selectElements[currIndex].blur(); // Add blur to old element
      repeatAlert = 0;
      if(selectElements[currIndex].getAttribute('data-tmp-flowfrom') !== null) {
        ez_jump(selectElements[currIndex].getAttribute('data-tmp-flowfrom'));
        return;
      }
      if(hierarchicalStopper('up')) {
        return;
      }
      currIndex--;
      if(selectElements[currIndex].getAttribute('data-ez-focusable-nav') == 'false' || selectElements[currIndex].getAttribute('data-ez-focusable') == 'false') { ez_navigate('up'); return; }
      if(groupSkip('up') != false) {
        currIndex = groupSkip('up');
      }
      if(!drawSelected(selectElements[currIndex])) { ez_navigate('up'); return; }
			auto_advance_set(); // Find if autoadvancing element
      sounds[getElementAudio()].feed.play();
      selectElements[currIndex].focus(); // Add focus to new element
      voice(selectElements[currIndex],'nav');
    } else {
      if(repeatAlert < alerts.top.length-1) {
        repeatAlert++;
        document.getElementById(ezSelectorId).className = 'pulse';
        setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
        voice(alerts.top[repeatAlert].value);
      } else {
        if(screenWrap) {
          currIndex = findFocusable('last');
          repeatAlert = 0;
          if(!drawSelected(selectElements[currIndex])) { ez_navigate('up'); return; }
          sounds[getElementAudio()].feed.play();
          voice(selectElements[currIndex],'nav');
        } else {
          document.getElementById(ezSelectorId).className = 'pulse';
          setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
          sounds[AUDIO_NOACTION].feed.play();
          voice(alerts.bottom[repeatAlert].value);
        }
      }
    }
  }
}

function find_parent_attr(obj,attr) {
	if(obj == null) { return undefined; }
	while(obj.nodeType !== 9) {
		if(obj.getAttribute(attr) !== null) {
			return obj.getAttribute(attr);
		}
		obj = obj.parentNode;
	}
	return undefined;
}

function auto_advance_set() {
	// If this is a new element to start autoadvancing, set the timer
	if(find_parent_attr(selectElements[currIndex],'data-ez-autoadvance') !== undefined) {
		if(find_parent_attr(selectElements[currIndex-1],'data-ez-autoadvance') === undefined) {
			autoAdvance = find_parent_attr(selectElements[currIndex],'data-ez-autoadvance');
			autoAdvance = parseInt(autoAdvance);
			if(autoAdvance < 100) {
				console.log("Please choose a autoadvance pause of 100 ms or greater.");
				autoAdvance = 100;
			}
			auto_advance_decide();
		}
	}
}

function auto_advance_decide() {
	window.clearInterval(autoAdvTimer);
	if(autoAdvance !== 0) {
		autoAdvTimer = setInterval(function(){
			ez_navigate('down');
			if(currIndex >= findFocusable('last')) {
				autoAdvance = 0;
				window.clearInterval(autoAdvTimer);
			}
			if(find_parent_attr(selectElements[currIndex],'data-ez-autoadvance') === undefined) {
				autoAdvance = 0;
				window.clearInterval(autoAdvTimer);
			}
		},autoAdvance);
	}
}

function ez_jump(location) {
  selectElements[currIndex].blur();
  currIndex = parseFloat(location);
  drawSelected(selectElements[currIndex])
  sounds[getElementAudio()].feed.play();
  selectElements[currIndex].focus();
  voice(selectElements[currIndex],'nav');
}

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

function ez_enter() {
  var obj = selectElements[currIndex];
  if(obj.tagName == "A") {
		if(obj.href.indexOf("#") != -1) {
			var hrefBase = obj.href.substring(0,obj.href.indexOf("#"));
			if(window.location.href.indexOf("#") != -1) {
				var pageBase = window.location.href.substring(0,window.location.href.indexOf("#"));
			} else {
				var pageBase = window.location.href;
			}
			if(hrefBase == "" || hrefBase == pageBase) { // If from same URL base
				var jumpTo = obj.href.substring(obj.href.indexOf("#")+1);
				var idLocation = getCurrIndexById(jumpTo);
				var nameLocation = getCurrIndexByName(jumpTo);
				if(idLocation != -1) {
					ez_jump(idLocation);
					obj.click();
					return;
				} else if(nameLocation != -1) {
					ez_jump(nameLocation);
					obj.click();
					return;
				}
			}
		}
	}
	if(getClick(obj) !== undefined) {
    obj.click();
  } else if(obj.tagName == 'INPUT' && (obj.type == 'radio' || obj.type == 'checkbox') ) {
    obj.click();
    if(obj.checked) {
      sounds[AUDIO_SELECT].feed.play();
    } else {
      sounds[AUDIO_DESELECT].feed.play();
    }
    voice(obj);
  }
  else if(obj.tagName == 'INPUT' && (obj.type == 'submit' || obj.type == 'image') ) {
    obj.click();
  } else if(selectElements[currIndex].getAttribute('data-ez-chunking') == 'group' && selectElements[currIndex].getAttribute('data-ez-subnavtype') == 'nested' || selectElements[currIndex].getAttribute('data-ez-subnavtype') == 'hierarchical') {
    ez_navigate_in_group();
  }
  else {
    document.getElementById(ezSelectorId).className = 'pulse';
    setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
    sounds[AUDIO_NOACTION].feed.play();
    document.getElementById(ezSelectorId).className = 'pulse';
    setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
    voice(obj,0,true);
  }
}

//Index elements on the page.
function indexElements(world) {  
  // INITIAL INDEXING OF PAGE ELEMENTS
  selectElementsTemp = getElementsByTagNames(COMPATIBLE_TAGS,world);
  // Check if ez-focusable to remove (+ CHILDREN)
  for(var i = 0; i < selectElementsTemp.length;i++) {
    if(selectElementsTemp[i].getAttribute('data-ez-focusable') == 'false') {
      var children = getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]);
      for(var j = 0; j < children.length+1; j++) {
        if(selectElementsTemp[i+j].getAttribute('data-ez-focusable') === null || selectElementsTemp[i+j].getAttribute('data-ez-focusable') === 'inherit') {
          selectElementsTemp[i+j].setAttribute('data-ez-focusable','false');
        }
      }
    }
    if(selectElementsTemp[i].getAttribute('data-ez-focusable-nav') == 'false') { // Like above code for *-nav
      var children = getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]);
      for(var j = 0; j < children.length+1; j++) {
        if(selectElementsTemp[i+j].getAttribute('data-ez-focusable-nav') === null || selectElementsTemp[i+j].getAttribute('data-ez-focusable-nav') === 'inherit') {
          selectElementsTemp[i+j].setAttribute('data-ez-focusable-nav','false');
        }
      }
    }
    if(selectElementsTemp[i].getAttribute('data-ez-focusable-point') == 'false') { // Like above code for *-point
      var children = getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]);
      for(var j = 0; j < children.length+1; j++) {
        if(selectElementsTemp[i+j].getAttribute('data-ez-focusable-point') === null || selectElementsTemp[i+j].getAttribute('data-ez-focusable-point') === 'inherit') {
          selectElementsTemp[i+j].setAttribute('data-ez-focusable-point','false');
        }
      }
    }
  }
  
  // Check if ez-chunking == group; if so, group 'em
  for(var i = 0; i < selectElementsTemp.length;) {
    if(selectElementsTemp[i].getAttribute('data-ez-chunking') == 'group' && selectElementsTemp[i].getAttribute('data-ez-subnavtype') == null) {
      var removeAmount = getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]).length;
      selectElementsTemp.splice(i+1,removeAmount);
      i += removeAmount+1;
    }
    else { i++; }
  }
  
  // Check and remove elements with children if tabindex (excluding grouped stuff).
  if(allowReorder) {
		for(var i = 0; i < selectElementsTemp.length;) {
			if(selectElementsTemp[i].getAttribute('tabindex') !== null && getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]).length > 0 && !(selectElementsTemp[i].getAttribute('data-ez-focusable') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-point') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-nav') == 'true')) {
				var removeAmount = getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]).length;
				selectElementsTemp.splice(i+1,removeAmount);
				i += removeAmount+1;
			}
			else { i++; }
		}
  }
  
  // Check and remove elements with children (excluding grouped stuff). MUST BE LAST THING DONE
  for(var i = 0; i < selectElementsTemp.length;) {
    if((!allowReorder || selectElementsTemp[i].getAttribute('tabindex') === null) && getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]).length > 0 && selectElementsTemp[i].getAttribute('data-ez-chunking') != 'group' && selectElementsTemp[i].getAttribute('data-ez-chunking') != 'block' && !(selectElementsTemp[i].getAttribute('data-ez-focusable') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-point') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-nav') == 'true')) {
      selectElementsTemp.splice(i,1); // Remove entry
    }
    else { i++; }
  }
  return selectElementsTemp;
}

function clear_jumppoints() {
	for(var i = 0; i < selectElements.length; i++) {
		selectElements[i].removeAttribute("data-tmp-level");
		selectElements[i].removeAttribute("data-tmp-jump");
	}
}

function load_jumppoints() {
  for(var i = 0; i < selectElements.length; i++) {
    if(selectElements[i].getAttribute('data-ez-chunking') == 'group' && selectElements[i].getAttribute('data-ez-subnavtype') == 'nested' || selectElements[i].getAttribute('data-ez-subnavtype') == 'hierarchical') {
      if(selectElements[i].getAttribute('data-ez-focusable-point') === null) {
        selectElements[i].setAttribute('data-ez-focusable-point','false'); // Default pointer navigates INSIDE the element (not on the wrapper)
      }
      
      var insideElements = indexElements(selectElements[i]);
      
      for(var j = 0; j < insideElements.length; j++) {
        var level = insideElements[j].getAttribute('data-tmp-level');
        if(level === null) {
          level = 0;
        } else {
          level = parseFloat(level);
          level++;
        }
        insideElements[j].setAttribute('data-tmp-level',level);
      }
      
      var endElement = insideElements.length+i;
      if(selectElements[endElement].getAttribute('data-tmp-jump') === null) {
        selectElements[endElement].setAttribute('data-tmp-jump',i);
      }
    }
  }
}

// For getting label of any object
function get_label(obj) {
	if(obj.tagName == "LABEL") return null;
	var labelElements = document.getElementsByTagName("label");
	if(obj.id) {
		for (var i = 0; i < labelElements.length; i++) {
			if (labelElements[i].getAttribute("for") == obj.id) {
				return labelElements[i];
			}
		}
	}
	var parentLabel = obj;
	while(parentLabel !== null) {
		if(parentLabel.tagName == "LABEL") {
			return parentLabel;
		}
		parentLabel = parentLabel.parentNode;
	}
	return null;
}

function index_ez() {
  parseOrphanedText(getElementsByTagNames('p'));
  
  selectElements = indexElements(document);
  
  if(allowReorder) {
	  // Sorting by tabindex
	  var tempselectElement = [];
	  j = 0;
	  for(var i = 0; i < selectElements.length;) {
			if(parseFloat(selectElements[i].getAttribute('tabindex')) < 0) {
				selectElements.splice(i,1); // Skip if < 0
			}
			else if(selectElements[i].getAttribute('tabindex') !== null) {
				tempselectElement[j] = selectElements.splice(i,1)[0];
				j++;
			}
			else { i++; }
		}
	  tempselectElement.sort(function(a,b){
			return a.getAttribute('tabindex')-b.getAttribute('tabindex');
	  });
	  selectElements = tempselectElement.concat(selectElements);
  }
  
  clear_jumppoints();
  load_jumppoints();
  
  if(allowReorder) {
		load_flowfrom();
  }
}

// On page load, load key_event() listener
function load_ez() {
	  if(document.body.getAttribute('data-ez-allowreorder') !== null) {
    allowReorder = true;
  }
  
	if(document.body.getAttribute('data-ez-autorepeat') === 'keyboard') {
    autoRepeat = 'keyboard';
  } else if(document.body.getAttribute('data-ez-autorepeat') === 'on') {
		autoRepeat = 'on';
	}

	var lastEvent;
	var heldKeys = {};
  map={} // Have to do this weird thing in order to detect two keys at same time (e.g., shift+tab)
	onkeydown = function(event) {
		autoAdvance = 0; // Stop any autoadvancing timers
		window.clearInterval(autoAdvTimer);
		if(autoRepeat == 'keyboard') {
			var return1 = multikey_event(event);
		} else if(autoRepeat == 'on') {
			var return1 = multikey_event(event);
			var return2 = key_event(event);
		}
		if (lastEvent && lastEvent.keyCode == event.keyCode) {
			return false;
		}
		lastEvent = event;
		heldKeys[event.keyCode] = true;
		if(autoRepeat == 'off') {
			var return1 = multikey_event(event);
			var return2 = key_event(event);
		} else if(autoRepeat == 'keyboard') {
			var return2 = key_event(event);
		}
		if(return1 && return2) {
			return;
		} else {
			return false;
		}
	};
	onkeyup = function(event) {
		multikey_event(event);
		lastEvent = null;
		delete heldKeys[event.keyCode];
		return false;
	};

	index_ez();	
	
  load_audio();
  
  set_volume(); // If exists from previous page
  
    // "Universal" body tag stuff
  if(document.body.getAttribute('data-ez-screenwrap') !== null) {
    screenWrap = true;
  }
  
  // Not actually implemented yet (just default is)
  if(document.body.getAttribute('data-ez-tabnav') == 'standard') {
    tabNav = 'standard';
  } else if (document.body.getAttribute('data-ez-tabnav') == 'hybrid') {
    tabNav = 'hybrid';
  } else if (document.body.getAttribute('data-ez-tabnav') == 'none') {
    tabNav = 'none';
  }
  
  if(document.body.getAttribute('data-ez-slidetoread') == 'off') {
    slideToRead = false;
  }
  if(document.body.getAttribute('data-ez-startingmode') == 'ezon') {
	// On chrome, will not draw until a small amount of time passes for some reason
    setTimeout(function(){
	  ez_navigate_start();
	  drawSelected(selectElements[currIndex]);
	},10);
  } else if (parseInt(sessionStorage.getItem("EZ_Toggle") ) == true && document.body.getAttribute('data-ez-startingmode') != 'ezoff') {
    setTimeout(function(){
      ez_navigate_start(true);
      drawSelected(selectElements[currIndex]);
    },10);
  }

  //idle_loop(); // TODO/TEMP
  
  // Multitouch gesture dragging
  if(slideToRead) { // If not allowed, do not initialize
    var hammer = new Hammer(document.body);
    hammer.ondrag = function(ev) {
				var currElement = selectElements[currIndex];
				index_ez();
				currIndex = 0;
				for(var i = 0; i < selectElements.length; i++) {
					if(selectElements[i] == currElement) {
						currIndex = i;
					}
				}
      mouseOver(document.elementFromPoint(parseFloat(ev.position.x)-parseFloat(window.scrollX), parseFloat(ev.position.y)-parseFloat(window.scrollY)));
    };
    hammer.ontap = function(ev) {
      stopEZ();
    };
  }
  
}

function parseOrphanedText(paragraphTags) {
	for(var i = 0; i < paragraphTags.length; i++) {
		var para = paragraphTags[i];
		var arr = [];
		for (var j = 0; j < para.childNodes.length; j++) {
				var elem = para.childNodes[j];
				var nextElem = para.childNodes[j+1];
				var prevElem = para.childNodes[j-1];
				var parse = false;
				if(nextElem !== undefined) { // && nextElem.tagName === COMPATIBLE_TAGS.split(',')[m].toUpperCase()
					parse = true;
				} else if(prevElem !== undefined) { // && prevElem.tagName === COMPATIBLE_TAGS.split(',')[m].toUpperCase()
					parse = true;
				}
				if (elem.nodeType === 3 && elem.length > 3 && parse) { // > 3 to prevent whitespaces
						var newElem = document.createElement('span');
						newElem.setAttribute("data-ez-parse");
						newElem.innerHTML = elem.nodeValue;
						elem.parentNode.insertBefore(newElem, elem.nextSibling);
						para.removeChild(elem);
						arr.push(newElem);
				}
				else {
						arr.push(elem)
				}
		}
	}
}

function load_flowfrom() {
  for(var i = 0; i < selectElements.length; i++) {
    if(allowReorder && selectElements[i].getAttribute('aria-flowto') !== null) {
      var flowId = selectElements[i].getAttribute('aria-flowto').split(' ')[0]; // In case multiple exist, grab first
      for(var j = 0; j < selectElements.length; j++) {
        if(selectElements[j].id == flowId) {
          selectElements[j].setAttribute('data-tmp-flowfrom',i);
          break;
        }
      }
    }
  }
}

function stopEZ() {
  ez_navigateToggle = false;
  idle_loop();
  currIndex = 0;
  voice("");
  sessionStorage.setItem("EZ_Toggle", "0");
  var old = document.getElementById(ezSelectorId);
  if (old !== null) {
    old.style.visibility = "hidden";
    old.style.left = 0+"px";
    old.style.top = 0+"px";
    old.style.width = 0+"px";
    old.style.height = 0+"px";
  }
}

// Check if new element (and exists to be highlighted), and then highlights
function mouseOver(e) {
  var newElement = true;
  var found = false;
  for(var i = 0; i < selectElements.length;i++) {
    if(e == selectElements[i]) {
      if(currIndex == i) {
        newElement = false;
      }
      if(selectElements[i].getAttribute('data-ez-focusable-point') === null && selectElements[i].getAttribute('data-ez-focusable') === null) {
        // If we're not supposed to navigate here by pointing
        selectElements[currIndex].blur(); // Add blur to old element
        currIndex = i;
        selectElements[currIndex].focus(); // Add focus to new element
        found = true;
      }
    }
  }
  if( (newElement && found) || !ez_navigateToggle) { //Override if ez is not enabled
    sessionStorage.setItem("EZ_Toggle", "1");
    ez_navigateToggle = true;
    sounds[getElementAudio()].feed.play();
    drawSelected(selectElements[currIndex]);
    voice(selectElements[currIndex],'point');
  }
}

// Smooth Scrolling
// http://www.itnewb.com/tutorial/Creating-the-Smooth-Scroll-Effect-with-JavaScript
function currentYPosition() {
    // Firefox, Chrome, Opera, Safari
    if (self.pageYOffset) return self.pageYOffset;
    // Internet Explorer 6 - standards mode
    if (document.documentElement && document.documentElement.scrollTop)
        return document.documentElement.scrollTop;
    // Internet Explorer 6, 7 and 8
    if (document.body.scrollTop) return document.body.scrollTop;
    return 0;
}

function smoothScroll(stopY) {
    var startY = currentYPosition();
    var distance = stopY > startY ? stopY - startY : startY - stopY;
    if (distance < 100) {
        scrollTo(0, stopY); return;
    }
    var speed = Math.round(distance / 100);
    if (speed >= 20) speed = 20;
    var step = Math.round(distance / 200);
    var leapY = stopY > startY ? startY + step : startY - step;
    var timer = 0;
    if (stopY > startY) {
        for ( var i=startY; i<stopY; i+=step ) {
            setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
            leapY += step; if (leapY > stopY) leapY = stopY; timer++;
        } return;
    }
    for ( var i=startY; i>stopY; i-=step ) {
        setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
        leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
    }
}

function multikey_event(e){
    e=e||event//to deal with IE
    map[e.keyCode]=e.type=='keydown'?true:false
    if (map[KB_TAB] && map[KB_SHIFT] && tabNav != 'none'){ //SHIFT+TAB
      if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
      if(ez_navigateToggle) {
        ez_navigate('up');
        smoothScroll(findPos(selectElements[currIndex]));
        //window.scroll(0,findPos(selectElements[currIndex]));
      } else {
        ez_navigate_start();
      }
      return false; // Overwrite default browser functionality
    } else if(map[KB_TAB] && tabNav != 'none'){//TAB
      if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
      if(ez_navigateToggle) {
        ez_navigate('down');
        smoothScroll(findPos(selectElements[currIndex]));
        //window.scroll(0,findPos(selectElements[currIndex]));
      } else {
        ez_navigate_start();
      }
      return false;
    }
    return true;
}

/* Referred to by window.onload anonymous function.
   http://www.dreamincode.net/code/snippet1246.htm */
function key_event(e) {
  // 'if' keycode statements
  if(e.keyCode == EZ_KEY_HELP) {
    if(tinyOpen) {
      tinyOpen = false;
      TINY.box.hide();
    } else {
      tinyOpen = true;
      ez_help("You have activated the ez help dialogue.");
    }
  }
  else if(e.keyCode == EZ_KEY_UP) {
    if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
    else {
      if(ez_navigateToggle) {
        window.scroll(0,findPos(selectElements[currIndex]));
        ez_navigate('up');
      } else {
        ez_navigate_start();
      }
    }
  }
  else if(e.keyCode == EZ_KEY_DOWN) {
    if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
    else {
      if(ez_navigateToggle) {
        window.scroll(0,findPos(selectElements[currIndex]));
        ez_navigate('down');
      } else {
        ez_navigate_start();
      }
    }
  }
  else if(e.keyCode == EZ_KEY_BACK || e.keyCode == 66) { // 'b' == 66
    // TODO
    var inGroup = findGroupParent();
    if(inGroup == currIndex) {
      if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
      else {
        if(ez_navigateToggle) {
          window.history.back();
        } else {
          ez_navigate_start();
        }
      }
    } else {
      globalSayBefore = "Navigating out of group... ";
      ez_jump(inGroup);
    }
  }
  else if(e.keyCode == EZ_KEY_ENTER || e.keyCode == KB_ENTER) {
    if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
    else {
      if(ez_navigateToggle) {
        ez_enter();
      } else {
        ez_navigate_start();
      }
      return false; // Disable any browser actions
    }
  } else if(e.keyCode == EZ_KEY_SKIPFORWARD) {
    if(selectElements[currIndex].type == 'range') {
      selectElements[currIndex].value = parseFloat(selectElements[currIndex].value) + parseFloat(selectElements[currIndex].step);
      sounds[AUDIO_MOVE].feed.play();
      voice(selectElements[currIndex].value);
    } else if(selectElements[currIndex].tagName == 'SELECT') {
      if(selectElements[currIndex].selectedIndex < selectElements[currIndex].length-1) {
        selectElements[currIndex].selectedIndex++;
        sounds[AUDIO_MOVE].feed.play();
        voice(selectElements[currIndex].value + '... option ' + (selectElements[currIndex].selectedIndex+1) + ' of ' + selectElements[currIndex].length);
      } else {
        document.getElementById(ezSelectorId).className = 'pulse';
        setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
      }
    } else {
      if(audioVolume <= 90) {
        audioVolume += 10;
        sessionStorage.setItem("EZ_Volume",audioVolume);
        set_volume();
        sounds[AUDIO_MOVE].feed.play();
        voice("Volume... " + audioVolume + " percent");
      } else {
        document.getElementById(ezSelectorId).className = 'pulse';
        setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
        voice("Maximum volume");
      }
    }
  } else if(e.keyCode == EZ_KEY_SKIPBACKWARD) {
    if(selectElements[currIndex].type == 'range') {
      selectElements[currIndex].value = parseFloat(selectElements[currIndex].value) - parseFloat(selectElements[currIndex].step);
      sounds[AUDIO_MOVE].feed.play();
      voice(selectElements[currIndex].value);
    } else if(selectElements[currIndex].tagName == 'SELECT') {
      if(selectElements[currIndex].selectedIndex > 0) {
        selectElements[currIndex].selectedIndex--;
        sounds[AUDIO_MOVE].feed.play();
        voice(selectElements[currIndex].value + '... option ' + (selectElements[currIndex].selectedIndex+1) + ' of ' + selectElements[currIndex].length);
      } else {
        document.getElementById(ezSelectorId).className = 'pulse';
        setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
      }
    } else {
      if(audioVolume >= 10) {
        sessionStorage.setItem("EZ_Volume",audioVolume);
        audioVolume -= 10;
        set_volume();
        sounds[AUDIO_MOVE].feed.play();
        voice("Volume... " + audioVolume + " percent");
      } else {
        document.getElementById(ezSelectorId).className = 'pulse';
        setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
        voice("Minimum volume");
      }
    }
  } else if(selectElements[currIndex].type == 'textarea' || selectElements[currIndex].type == 'text') {
    var key = String.fromCharCode(e.keyCode);
    if(!key.match(/[^A-Za-z0-9\-_]/)) voice(key);
  }
  return true;
}


// RESIZER SCRIPT
//http://blogs.korzh.com/progtips/2008/05/28/absolute-coordinates-of-dom-element-within-document.html

function __getIEVersion() {  
    var rv = -1; // Return value assumes failure.  
    if (navigator.appName == 'Microsoft Internet Explorer') {  
        var ua = navigator.userAgent;  
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");  
        if (re.exec(ua) != null)  
            rv = parseFloat(RegExp.$1);  
    }  
    return rv;  
}  
  
function __getOperaVersion() {  
    var rv = 0; // Default value  
    if (window.opera) {  
        var sver = window.opera.version();  
        rv = parseFloat(sver);  
    }  
    return rv;  
}  
  
var __userAgent = navigator.userAgent;  
var __isIE =  navigator.appVersion.match(/MSIE/) != null;  
var __IEVersion = __getIEVersion();  
var __isIENew = __isIE && __IEVersion >= 8;  
var __isIEOld = __isIE && !__isIENew;  
  
var __isFireFox = __userAgent.match(/firefox/i) != null;  
var __isFireFoxOld = __isFireFox && ((__userAgent.match(/firefox\/2./i) != null) || (__userAgent.match(/firefox\/1./i) != null));  
var __isFireFoxNew = __isFireFox && !__isFireFoxOld;  
  
var __isWebKit =  navigator.appVersion.match(/WebKit/) != null;  
var __isChrome =  navigator.appVersion.match(/Chrome/) != null;  
var __isOpera =  window.opera != null;  
var __operaVersion = __getOperaVersion();  
var __isOperaOld = __isOpera && (__operaVersion < 10);  
  
function __parseBorderWidth(width) {  
    var res = 0;  
    if (typeof(width) == "string" && width != null && width != "" ) {  
        var p = width.indexOf("px");  
        if (p >= 0) {  
            res = parseInt(width.substring(0, p));  
        }  
        else {  
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
    res.left = 0; res.top = 0; res.right = 0; res.bottom = 0;  
    if (window.getComputedStyle) {  
        //for Firefox  
        var elStyle = window.getComputedStyle(element, null);  
        res.left = parseInt(elStyle.borderLeftWidth.slice(0, -2));    
        res.top = parseInt(elStyle.borderTopWidth.slice(0, -2));    
        res.right = parseInt(elStyle.borderRightWidth.slice(0, -2));    
        res.bottom = parseInt(elStyle.borderBottomWidth.slice(0, -2));    
    }  
    else {  
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
    if (typeof(elemID) == "string") {  
        element = document.getElementById(elemID);  
    }  
    else {  
        element = elemID;  
    }  
  
    var res = new Object();  
    res.x = 0; res.y = 0;  
    if (element !== null) {  
        res.x = element.offsetLeft;  
  
        var offsetParent = element.offsetParent;  
        var offsetParentTagName = offsetParent != null ? offsetParent.tagName.toLowerCase() : "";  
  
        if (__isIENew  && offsetParentTagName == 'td') {  
            res.y = element.scrollTop;  
        }  
        else {  
            res.y = element.offsetTop;  
        }  
          
        var parentNode = element.parentNode;  
        var borderWidth = null;  
  
        while (offsetParent != null) {  
            res.x += offsetParent.offsetLeft;  
            res.y += offsetParent.offsetTop;  
              
            var parentTagName = offsetParent.tagName.toLowerCase();   
  
            if ((__isIEOld && parentTagName != "table") || (__isFireFoxNew && parentTagName == "td")  || __isChrome) {            
                borderWidth = __getBorderWidth(offsetParent);  
                res.x += borderWidth.left;  
                res.y += borderWidth.top;  
            }  
              
            if (offsetParent != document.body && offsetParent != document.documentElement) {  
                res.x -= offsetParent.scrollLeft;  
                res.y -= offsetParent.scrollTop;  
            }  
  
  
            //next lines are necessary to fix the problem with offsetParent  
            if (!__isIE && !__isOperaOld || __isIENew) {  
                while (offsetParent != parentNode && parentNode !== null) {  
                    res.x -= parentNode.scrollLeft;  
                    res.y -= parentNode.scrollTop;  
                    if (__isFireFoxOld || __isWebKit) {  
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