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
                  2. speak.js  - Provides speech generation
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
    if(selectElements[currIndex].href != undefined || selectElements[currIndex].onclick != undefined || selectElements[currIndex].tagName == 'INPUT') {
      return AUDIO_BUTTON;
    }
    if(selectElements[currIndex].tagName == tmp[i].toUpperCase()) {
      return AUDIO_MOVE;
    }
  }
  console.log('No specific sound for "' + selectElements[currIndex].tagName + '" HTML tag.');
  return AUDIO_MOVE;
}

// Tags that are candidates for highlight
var COMPATIBLE_TAGS = 'p,img,span,a,div,h1,h2,h3,h4,h5,figure,figcaption,ul,ol,li,input,button,textarea,select,article,aside,hgroup';

// Array of tags generated on pageload initialized globally
var selectElements;

// Current index (of selectElements array) for navigation purposes
var currIndex = 0;

// Whether EZ navigation mode is activated or not
var ez_navigateToggle = false;

// Wrap elements on the screen
var screenWrap = false;

// Keep track if the TINY modal is open or not
var tinyOpen = false;

// Global idle loop timer if no user action is taken
var idleLoop;

// Volume of the audio elements (0-100)
if(sessionStorage.getItem("EZ_Volume") !== null) {
  var audioVolume = sessionStorage.getItem("EZ_Volume");
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
  var data;
  if(typeof(obj)=='string') {
    data = obj;
  }
  else {
    if(obj.tagName == 'INPUT' && getlabelforinput(obj.id) !== null) {
      data = getlabelforinput(obj.id);
    }
    else if(obj.type == 'textarea' || obj.type == 'text') {
      if(obj.value == '') { data = 'nothing'; }
      else { data = obj.value; }
    } else if(obj.getAttribute('aria-labelledby') !== null) {
      data = document.getElementById(obj.getAttribute('aria-labelledby').split(" ")[0]).textContent;
    } else if(obj.tagName == 'SELECT') {
      data = 'Dropdown with ' + obj.length + ' options, selected is ' + obj.value + '... option ' + (obj.selectedIndex+1);
    }
    else if(obj.tagName != "IMG") {
      data = obj.textContent;
    } else {
      data = obj.alt;
    }
    if(source == 'nav' && obj.getAttribute('data-ez-sayalt-nav') !== null) {
      data = obj.getAttribute('data-ez-sayalt-nav');
    }
    else if(source == 'point' && obj.getAttribute('data-ez-sayalt-point') !== null) {
      data = obj.getAttribute('data-ez-sayalt-point');
    }
    else if(obj.getAttribute('data-ez-sayalt') !== null) {
      data = obj.getAttribute('data-ez-sayalt');
    }
    if(source == 'nav' && obj.getAttribute('data-ez-saybefore-nav') !== null) {
      data = obj.getAttribute('data-ez-saybefore-nav') + ' ' + data;
    }
    else if(source == 'point' && obj.getAttribute('data-ez-saybefore-point') !== null) {
      data = obj.getAttribute('data-ez-saybefore-point') + ' ' + data;
    }
    else if(obj.getAttribute('data-ez-saybefore') !== null) {
      data = obj.getAttribute('data-ez-saybefore') + ' ' + data;
    }
    if(source == 'nav' && obj.getAttribute('data-ez-sayafter-nav') !== null) {
      data += ' ' + obj.getAttribute('data-ez-sayafter-nav');
    }
    else if(source == 'point' && obj.getAttribute('data-ez-sayafter-point') !== null) {
      data += ' ' + obj.getAttribute('data-ez-sayafter-point');
    }
    else if(obj.getAttribute('data-ez-sayafter') !== null) {
      data += ' ' + obj.getAttribute('data-ez-sayafter-nav');
    }
    if(obj.tagName == 'A') {
      data += " link";
    }
    if(obj.tagName == 'BUTTON' || (obj.tagName == 'INPUT' && obj.type == 'button') ) {
      data += ' button';
    } else if(obj.tagName == 'INPUT' && obj.type == 'submit' || obj.type == 'image') { // Image acts like submit btn
      data += ' submit button';
    } else if(obj.tagName == 'INPUT' && obj.type == 'reset') {
      data += ' reset button';
    } else if(obj.tagName == 'INPUT' && obj.type == 'checkbox') {
      data += ' check box button... ';
      data += obj.checked ? 'checked' : 'unchecked';
    } else if(obj.tagName == 'INPUT' && obj.type == 'radio') {
      data += ' radio button... ';
      data += obj.checked ? 'checked' : 'unchecked';
    } else if(obj.tagName == 'INPUT' && obj.type == 'password') {
      data += ' password input field';
    } else if(obj.tagName == 'INPUT' && obj.type == 'range') {
      data += ' slider at ' + obj.value + ' with range from '+obj.min+' to ' + obj.max;
    }
    if(obj.type == 'textarea') {
      data = 'text area contains... ' + data;
    } else if(obj.type == 'text') {
      data = 'text field contains... ' + data;
    }
  }
  if(repeat == true) {
    data = "Repeating... " + data;
  }
  if(globalSayBefore != "") {
    data = globalSayBefore + data;
    globalSayBefore = "";
  }
  if(data.length > 300) { voice("One moment"); } // If speech generation will take a while
  //chrome.tts.speak(data, {'volume': (audioVolume/100)});
  //chrome.tts.speak('Hello, world!');
  var req = {"text": data};
  chrome.extension.sendRequest(req);
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
	var testNode = resultArray[0];
	if (!testNode) return [];
	if (testNode.sourceIndex) {
		resultArray.sort(function (a,b) {
				return a.sourceIndex - b.sourceIndex;
		});
	}
	else if (testNode.compareDocumentPosition) { // Older brower compat.
		resultArray.sort(function (a,b) {
				return 3 - (a.compareDocumentPosition(b) & 6);
		});
	}
	return resultArray;
}

// Event listener if window is resized the selected box will be redrawn
window.onresize = function() {
  if(ez_navigateToggle) { drawSelected(selectElements[currIndex]); }
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
  var old = document.getElementById('selected');
  if(old === null) {
    var div = document.createElement('div');
    div.id = 'selected';
    if (document.body.firstChild) {
      document.body.insertBefore(div, document.body.firstChild);
    } else {
      document.body.appendChild(div);
    }
    old = document.getElementById('selected'); // Redefine the new selected div
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
  }
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
      document.getElementById('selected').className = 'pulse';
      setTimeout(function(){document.getElementById('selected').className = '';},300);
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
    idleLoop = self.setInterval(function(){idle_loop(true)},alerts.idle.wait);
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
function ez_navigate(move) {
  if(move == 'down') {
    if(currIndex < selectElements.length-1) {
      selectElements[currIndex].blur(); // Add blur to old element
      repeatAlert = 0;
      if(selectElements[currIndex].getAttribute('aria-flowto') !== null) {
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
      sounds[getElementAudio()].feed.play();
      selectElements[currIndex].focus(); // Add focus to new element
      voice(selectElements[currIndex],'nav',globalSayBefore);
    } else { // Basically, keep looping through 'warnings' until user stops or if there are no more speech elements, and wrap is true, jump to bottom of screen.
      if(repeatAlert < alerts.bottom.length-1) {
        repeatAlert++;
        document.getElementById('selected').className = 'pulse';
        setTimeout(function(){document.getElementById('selected').className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
        voice(alerts.bottom[repeatAlert].value);
      } else {
        if(screenWrap) {
          currIndex = 0;
          repeatAlert = 0;
          if(!drawSelected(selectElements[currIndex])) { ez_navigate('down'); return; }
          sounds[getElementAudio()].feed.play();
          voice(selectElements[currIndex],'nav');
        } else {
          document.getElementById('selected').className = 'pulse';
          setTimeout(function(){document.getElementById('selected').className = '';},300);
          sounds[AUDIO_NOACTION].feed.play();
          voice(alerts.bottom[repeatAlert].value);
        }
      }
    }
  }
  else if(move == 'up') {
    if(currIndex > 0) {
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
      sounds[getElementAudio()].feed.play();
      selectElements[currIndex].focus(); // Add focus to new element
      voice(selectElements[currIndex],'nav');
    } else {
      if(repeatAlert < alerts.top.length-1) {
        repeatAlert++;
        document.getElementById('selected').className = 'pulse';
        setTimeout(function(){document.getElementById('selected').className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
        voice(alerts.top[repeatAlert].value);
      } else {
        if(screenWrap) {
          currIndex = selectElements.length-1;
          repeatAlert = 0;
          if(!drawSelected(selectElements[currIndex])) { ez_navigate('up'); return; }
          sounds[getElementAudio()].feed.play();
          voice(selectElements[currIndex],'nav');
        } else {
          document.getElementById('selected').className = 'pulse';
          setTimeout(function(){document.getElementById('selected').className = '';},300);
          sounds[AUDIO_NOACTION].feed.play();
          voice(alerts.bottom[repeatAlert].value);
        }
      }
    }
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

function ez_enter() {
  var obj = selectElements[currIndex];
  if(obj.href != undefined || obj.onclick != undefined) {
    obj.click();
  }
  else if(obj.tagName == 'INPUT' && (obj.type == 'radio' || obj.type == 'checkbox') ) {
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
    document.getElementById('selected').className = 'pulse';
    setTimeout(function(){document.getElementById('selected').className = '';},300);
    sounds[AUDIO_NOACTION].feed.play();
    document.getElementById('selected').className = 'pulse';
    setTimeout(function(){document.getElementById('selected').className = '';},300);
    voice(obj,0,true);
  }
}

//Index elements on the page.
function indexElements(world) {
  // "Universal" body tag stuff
  if(document.body.getAttribute('data-ez-screenwrap') !== null) {
    screenWrap = true;
  }
  
  // Isn't implemented yet
  if(document.body.getAttribute('data-ez-allowreorder') !== null) {
    allowReorder = true;
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
    ez_navigate_start();
  } else if(document.body.getAttribute('data-ez-startingmode') == 'off') {
    // EZ Turned off on page load no matter yet (but ATM don't have that feature)
  }
  
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
  
  // Check and remove elements with children (excluding grouped stuff). MUST BE LAST THING DONE
  for(var i = 0; i < selectElementsTemp.length;) {
    if(getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]).length > 0 && selectElementsTemp[i].getAttribute('data-ez-chunking') != 'group' && selectElementsTemp[i].getAttribute('data-ez-chunking') != 'block' && !(selectElementsTemp[i].getAttribute('data-ez-focusable') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-point') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-nav') == 'true')) {
      selectElementsTemp.splice(i,1); // Remove entry
    }
    else { i++; }
  }
  return selectElementsTemp;
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

// For getting 'for' contents of a form button (we have to iterate and look for it)
function getlabelforinput(inputname) {
    var labelElements = document.getElementsByTagName("label");
    for (var i = 0; i < labelElements.length; i++) {
      if (labelElements[i].getAttribute("for") == inputname) {
        return labelElements[i].textContent;
      }
    }
    return null;
}

// On page load, load key_event() listener
function load_ez() {
  document.onkeydown = key_event;
  //document.onkeypress = key_event;
  
  selectElements = indexElements(document);
  
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
  
  load_jumppoints();
  
  load_flowfrom();
  
  load_audio();
  
  //idle_loop(); // TODO/TEMP
  
  // ADDING SOUND DIV -- ONLY NEEDED FOR speak.js
  var div = document.createElement('div');
  div.id = 'audio';
  div.setAttribute('data-ez-focusable','false');
  if (document.body.firstChild) {
    document.body.insertBefore(div, document.body.firstChild);
  } else {
    document.body.appendChild(div);
  }
  
  // Multitouch gesture dragging
  if(slideToRead) { // If not allowed, to not initialize
    var hammer = new Hammer(document.body);
    hammer.ondrag = function(ev) {
      mouseOver(document.elementFromPoint(parseFloat(ev.position.x)-parseFloat(window.scrollX), parseFloat(ev.position.y)-parseFloat(window.scrollY)));
    };
    hammer.ontap = function(ev) {
      stopEZ();
    };
    if (parseInt(sessionStorage.getItem("EZ_Toggle") ) == true) {
      ez_navigate_start(true);
    }
  }
  
  set_volume(); // If exists from previous page
  
}

function load_flowfrom() {
  for(var i = 0; i < selectElements.length; i++) {
    if(selectElements[i].getAttribute('aria-flowto') !== null) {
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
  var old = document.getElementById("selected");
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

map={} // Have to do this weird thing in order to detect two keys at same time (e.g., shift+tab)
onkeydown=onkeyup=function(e){
    e=e||event//to deal with IE
    map[e.keyCode]=e.type=='keydown'?true:false
    if (map[KB_TAB] && map[KB_SHIFT] && tabNav != 'none'){ //SHIFT+TAB
      if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
      if(ez_navigateToggle) {
        window.scroll(0,findPos(selectElements[currIndex]));
        ez_navigate('up');
      } else {
        ez_navigate_start();
      }
      return false; // Overwrite default browser functionality
    } else if(map[KB_TAB] && tabNav != 'none'){//TAB
      if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
      if(ez_navigateToggle) {
        window.scroll(0,findPos(selectElements[currIndex]));
        ez_navigate('down');
      } else {
        ez_navigate_start();
      }
      return false;
    }
}

/* Referred to by window.onload anonymous function.
   http://www.dreamincode.net/code/snippet1246.htm */
function key_event(e) {
  // 'if' keycode statements
  if(selectElements[currIndex].type == 'textarea' || selectElements[currIndex].type == 'text') {
    voice(String.fromCharCode(e.keyCode));
  }
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
  else if(e.keyCode == EZ_KEY_BACK) {
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
        document.getElementById('selected').className = 'pulse';
        setTimeout(function(){document.getElementById('selected').className = '';},300);
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
        document.getElementById('selected').className = 'pulse';
        setTimeout(function(){document.getElementById('selected').className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
        voice("Maximum volume");
      }
    }
  } else if(e.keyCode == EZ_KEY_SKIPBACKWARD) {
	console.log(currIndex);
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
        document.getElementById('selected').className = 'pulse';
        setTimeout(function(){document.getElementById('selected').className = '';},300);
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
        document.getElementById('selected').className = 'pulse';
        setTimeout(function(){document.getElementById('selected').className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
        voice("Minimum volume");
      }
    }
  }
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