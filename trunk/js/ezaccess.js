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
const KB_TAB = 9;
const KB_SHIFT = 16;
const KB_ENTER = 13;

//EZ-Access keycode declarations
const EZ_KEY_SKIPFORWARD = 135; // is >>
const EZ_KEY_SKIPBACKWARD = 134; // is <<
const EZ_KEY_HELP = 128; // is ?
const EZ_KEY_BACK = 132; // is BACK
const EZ_KEY_NEXT = 133; // is NEXT
const EZ_KEY_UP = 129; // is up arrow key
const EZ_KEY_DOWN = 130; // is down arrow key
const EZ_KEY_ENTER = 131; // is green circle enter key

/* //EZ-Access KEYBOARD keycode declarations
const EZ_KB_KEY_HELP = 191; // is ?
const EZ_KB_KEY_BACK = 37; // is BACK
const EZ_KB_KEY_NEXT = 39; // is NEXT
const EZ_KB_KEY_UP = 38; // is up arrow key
const EZ_KB_KEY_DOWN = 40; // is down arrow key
const EZ_KB_KEY_ENTER = 13; // is green circle enter key */

/* //NORMAL KEYBOARD keycode declarations
const KB_KEY_HELP = 191; // is ?
const KB_KEY_BACK = 37; // is BACK
const KB_KEY_NEXT = 39; // is NEXT
const KB_KEY_UP = 38; // is up arrow key
const KB_KEY_DOWN = 40; // is down arrow key
const KB_KEY_ENTER = 13; // is green circle enter key */

// Tags that are candidates for highlight
const COMPATIBLE_TAGS = 'p,img,span,a,div,h1,h2,h3,h4,h5,ul,ol,li,input,button,textarea';

// Array of tags generated on pageload initialized globally
var selectElements;

// Current index (of selectElements array) for navigation purposes
var currIndex = 0;

// Whether EZ navigation mode is activated or not
var ez_navigateToggle = false;

// Wrap elements on the screen
var screenWrap = false;

// Keep track if the TINY modal is open or not.
var tinyOpen = false;

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
    if(source == 'nav' && obj.getAttribute('data-ez-sayalt-nav') !== null) {
      data = obj.getAttribute('data-ez-sayalt-nav');
    }
    else if(source == 'point' && obj.getAttribute('data-ez-sayalt-point') !== null) {
      data = obj.getAttribute('data-ez-sayalt-point');
    }
    else if(obj.getAttribute('data-ez-sayalt') !== null) {
      data = obj.getAttribute('data-ez-sayalt');
    }
    else if(obj.tagName == 'INPUT' && (obj.type == 'radio' || obj.type == 'checkbox') && getlabelforinput(obj.id) !== null) {
      data = getlabelforinput(obj.id);
    }
    else if(obj.tagName == 'TEXTAREA') {
      if(obj.value == '') { data = 'nothing'; }
      else { data = obj.value; }
    }
    else if(obj.tagName != "IMG") {
      data = obj.textContent;
    } else {
      data = obj.alt;
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
      data = "link... " + data;
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
    } else if(obj.tagName == 'INPUT' && obj.type == 'text') {
      data += ' text field';
    } else if(obj.tagName == 'INPUT' && obj.type == 'password') {
      data += ' password input field';
    }
    if(obj.tagName == 'TEXTAREA') {
      data = 'text area contains... ' + data;
    }
  }
  if(repeat == true) {
    data = "Repeating... " + data;
  }
  if(data.length > 300) { speak.play("One moment."); } // If speech generation will take a while
  speak.play(data);
}

function ez_help() {
  var helptext = "You have activated the ez help dialogue."; // Temporarily static for development
  voice(helptext);
  TINY.box.show("<span style='font-size:250%'>" + helptext + "</span>",0,0,0,1)
}

function find_audio(audio_name) {
  for(var i = 0; i < sounds.length; i++) {
    if(sounds[i].name == audio_name) {
      return i;
    }
  }
  return -1;
}

function load_audio() {
  for(var i = 0; i < sounds.length; i++) {
    sounds[i].feed = new Audio(sounds[i].src);
  }
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
  var pos = getElementAbsolutePos(obj);
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
    drawSelected(selectElements[currIndex]);
    voice(selectElements[currIndex],'nav');
  }
}

function ez_navigate(move) {
  sounds[find_audio("move")].feed.play();
  if(move == 'down') {
    if(currIndex < selectElements.length-1) {
      selectElements[currIndex].blur(); // Add blur to old element
      repeatAlert = 0;
      currIndex++;
      selectElements[currIndex].focus(); // Add focus to new element
      drawSelected(selectElements[currIndex]);
      voice(selectElements[currIndex],'nav');
    } else { // Basically, keep looping through 'warnings' until user stops or if there are no more speech elements, and wrap is true, jump to bottom of screen.
      if(repeatAlert < alerts.bottom.length-1) {
        repeatAlert++;
        drawSelected(selectElements[currIndex]);
        voice(alerts.bottom[repeatAlert].value);
      } else {
        if(screenWrap) {
          currIndex = 0;
          repeatAlert = 0;
          drawSelected(selectElements[currIndex]);
          voice(selectElements[currIndex],'nav');
        } else {
          drawSelected(selectElements[currIndex]);
          voice(alerts.bottom[repeatAlert].value);
        }
      }
    }
  }
  else if(move == 'up') {
    if (currIndex > 0) {
      selectElements[currIndex].blur(); // Add blur to old element
      repeatAlert = 0;
      currIndex--;
      selectElements[currIndex].focus(); // Add focus to new element
      drawSelected(selectElements[currIndex]);
      voice(selectElements[currIndex],'nav');
    } else {
      if(repeatAlert < alerts.top.length-1) {
        repeatAlert++;
        drawSelected(selectElements[currIndex]);
        voice(alerts.top[repeatAlert].value);
      } else {
        if(screenWrap) {
          currIndex = selectElements.length-1;
          repeatAlert = 0;
          drawSelected(selectElements[currIndex]);
          voice(selectElements[currIndex],'nav');
        } else {
          drawSelected(selectElements[currIndex]);
          voice(alerts.bottom[repeatAlert].value);
        }
      }
    }
  }
}

function ez_enter() {
  var obj = selectElements[currIndex];
  if(obj.href != undefined || obj.onclick != undefined) {
    obj.click();
  }
  else if(obj.tagName == 'INPUT' && (obj.type == 'radio' || obj.type == 'checkbox') ) {
    obj.click();
    if(obj.checked) {
      sounds[find_audio("select")].feed.play();
    } else {
      sounds[find_audio("deselect")].feed.play();
    }
    voice(obj);
  }
  else if(obj.tagName == 'INPUT' && (obj.type == 'submit' || obj.type == 'image') ) {
    obj.click();
  }
  else {
    sounds[find_audio("noaction")].feed.play();
    voice(obj,0,true);
  }
}

//Index elements on the page.
function indexElements() {
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
  selectElements = getElementsByTagNames(COMPATIBLE_TAGS);
  
  // Check if ez-focusable to remove (+ CHILDREN)
  for(var i = 0; i < selectElements.length;) {
    if(selectElements[i].getAttribute('data-ez-focusable') == 'false') {
      selectElements.splice(i,getElementsByTagNames(COMPATIBLE_TAGS,selectElements[i]).length+1); // Remove entry + CHILDREN
    }
    else { i++; }
  }
  
  // Check if ez-chunking == group; if so, group 'em
  for(var i = 0; i < selectElements.length;) {
    if(selectElements[i].getAttribute('data-ez-chunking') == 'group') {
      var removeAmount = getElementsByTagNames(COMPATIBLE_TAGS,selectElements[i]).length;
      selectElements.splice(i+1,removeAmount);
      i += removeAmount+1;
    }
    else { i++; }
  }
  
  // Check and remove elements with children (excluding grouped stuff). MUST BE LAST THING DONE
  for(var i = 0; i < selectElements.length;) {
    if(getElementsByTagNames(COMPATIBLE_TAGS,selectElements[i]).length > 0 && selectElements[i].getAttribute('data-ez-chunking') != 'group' && selectElements[i].getAttribute('data-ez-chunking') != 'block') {
      selectElements.splice(i,1); // Remove entry
    }
    else { i++; }
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
window.onload=function() {
  document.onkeydown = key_event;
  //document.onkeypress = key_event;
  
  indexElements();
  
  load_audio();
  
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
}

function stopEZ() {
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
      selectElements[currIndex].blur(); // Add blur to old element
      currIndex = i;
      selectElements[currIndex].focus(); // Add focus to new element
      found = true;
    }
  }
  if( (newElement && found) || !ez_navigateToggle) { //Override if ez is not enabled
    sessionStorage.setItem("EZ_Toggle", "1");
    ez_navigateToggle = true;
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
  
  if(e.keyCode == EZ_KEY_HELP) {
    if(tinyOpen) {
      tinyOpen = false;
      TINY.box.hide();
    } else {
      tinyOpen = true;
      ez_help();
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
    if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
    else {
      if(ez_navigateToggle) {
      } else {
        ez_navigate_start();
      }
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
    return res;  
}