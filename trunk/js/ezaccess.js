/*
    Author: Alexander Harding
            Trace Center
            University of Wisconsin, Madison
            (c) 2012 All Rights Reserved
            Licensing Strategy TBD
            
    Desc:   Designed to parse any webpage (when the JS is included)
              for accessibility -- utilizes custom HTML attributes
              (see the EZ-Access HTML plug-in manual)
              
    Roadmap:| VERSION | MM/DD/YY | DESCRIPTION
            +---------+----------+-----------------------------------
            | X         10/02/12   Basic maneuvering HTML DOM w/ EZ-KB, & Drag-into-element. Drawing engine around element complete
            
*/


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
const COMPATIBLE_TAGS = 'p,img,span,a,div,button,h1,h2,h3,h4,h5,ul,ol,li';

// Array of tags generated on pageload initialized globally
var selectElements;

// Whether EZ navigation mode is activated or not
var ez_navigateToggle = false;

// Alert of how many times user has pressed up
var repeatAlert = 0;

// Current index (of selectElements array) for navigation purposes
var currIndex = 0;

// Mouse button press state
var mouseDown = 0;

// Provide easy place to change method of speech synthesis
function voice(obj,repeat) {
  var data;
  if(typeof(obj)=='string') {
    data = obj;
  }
  else if(obj.tagName != "IMG") {
    if(obj.textContent.length > 300) { speak.play("One moment."); } // If speech generation will take a while
    data = obj.textContent;
  } else {
    if(obj.alt.length > 300) { speak.play("One moment."); } // If speech generation will take a while
    data = obj.alt;
  }
  
  if(repeat == true) {
    data = "Repeating... " + data;
  }
  speak.play(data);
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
  drawSelected(selectElements[currIndex]);
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
  old.style.left = pos.x-10+'px';
  old.style.top = pos.y-10+'px';
  old.style.width = obj.offsetWidth+10+'px';
  old.style.height = obj.offsetHeight+10+'px';
}

function ez_navigate_start() {
  ez_navigateToggle = true;
  if(document.body.getAttribute('data-ez-startat') !== null) {
    var startid = document.body.getAttribute('data-ez-startat').split(" ")[0].slice(1);
    for(var i = 0; i < selectElements.length;i++) {
      if(selectElements[i].id !== null && selectElements[i].id == startid) {
        currIndex = i;
        break;
      }
    }
    drawSelected(selectElements[currIndex]);
  }
}

function ez_navigate(move) {
  if(move == 'down') {
    if(currIndex < selectElements.length-1) {
      repeatAlert = 0;
      currIndex++;
      drawSelected(selectElements[currIndex]);
      voice(selectElements[currIndex]);
    } else {
      if(repeatAlert < alerts.bottom.length-1) { repeatAlert++; }
      voice(alerts.bottom[repeatAlert].value);
    }
  }
  else if(move == 'up') {
    if (currIndex > 0) {
    repeatAlert = 0;
    currIndex--;
    drawSelected(selectElements[currIndex]);
    voice(selectElements[currIndex]);
    } else {
      if(repeatAlert < alerts.top.length-1) { repeatAlert++; }
      voice(alerts.top[repeatAlert].value);
    }
  }
}

function ez_enter() {
  if(selectElements[currIndex].href != undefined || selectElements[currIndex].onclick != undefined) {
    selectElements[currIndex].click();
  } else {
    voice(selectElements[currIndex],true);
  }
}

// On page load, load key_event() listener
window.onload=function() {
  document.onkeydown = key_event;
  document.onkeypress = key_event;
  
  // INITIAL INDEXING OF PAGE ELEMENTS
  selectElements = getElementsByTagNames(COMPATIBLE_TAGS);
  for(var i = 0; i < selectElements.length;) {
    if(selectElements[i].getAttribute('data-ez-focusable') == 'false') {
      selectElements.splice(i,getElementsByTagNames(COMPATIBLE_TAGS,selectElements[i]).length+1); // Remove entry + CHILDREN
    }
    else { i++; }
  }
  for(var i = 0; i < selectElements.length;) {
    if(selectElements[i].getAttribute('data-ez-chunking') == 'group') {
      var removeAmount = getElementsByTagNames(COMPATIBLE_TAGS,selectElements[i]).length;
      selectElements.splice(i+1,removeAmount);
      i += removeAmount+1;
    }
    else { i++; }
  }
  for(var i = 0; i < selectElements.length;) {
    if(getElementsByTagNames(COMPATIBLE_TAGS,selectElements[i]).length > 0 && selectElements[i].getAttribute('data-ez-chunking') != 'group' && selectElements[i].getAttribute('data-ez-chunking') != 'block') {
      selectElements.splice(i,1); // Remove entry
    }
    else { i++; }
  }
  
  // ADDING SOUND DIV -- ONLY NEEDED FOR speak.js
  var div = document.createElement('div');
  div.id = 'audio';
  div.setAttribute('data-ez-focusable','false');
  if (document.body.firstChild) {
    document.body.insertBefore(div, document.body.firstChild);
  } else {
    document.body.appendChild(div);
  }
  
  // INITIAL ONMOUSEOVER LISTENER SETUPS
  for(var i = 0; i < selectElements.length;i++) {
    selectElements[i].onmouseover = new Function("mouseOver("+i+");");
  }
  
  // Load listener for button presses
  document.body.onmousedown = function() { 
    ++mouseDown;
  }
  document.body.onmouseup = function() {
    --mouseDown;
  }
}

// Launched when element is mouseover'd
// Each element calls this when mouseover'd
function mouseOver(e) {
  if(mouseDown){
    currIndex = e;
    ez_navigateToggle = true;
    drawSelected(selectElements[currIndex]);
    voice(selectElements[currIndex]);
  }
}

/* Referred to by window.onload anonymous function.
   http://www.dreamincode.net/code/snippet1246.htm */
function key_event(e) {
  // 'if' keycode statements
  
  if(e.keyCode == EZ_KEY_HELP) {
    if(ez_navigateToggle) {
    } else {
      ez_navigate_start();
    }
  }
  else if(e.keyCode == EZ_KEY_UP) {
    if(ez_navigateToggle) {
      window.scroll(0,findPos(selectElements[currIndex]));
      ez_navigate('up');
    } else {
      ez_navigate_start();
    }
  }
  else if(e.keyCode == EZ_KEY_DOWN) {
    if(ez_navigateToggle) {
      window.scroll(0,findPos(selectElements[currIndex]));
      ez_navigate('down');
    } else {
      ez_navigate_start();
    }
  }
  else if(e.keyCode == EZ_KEY_BACK) {
    if(ez_navigateToggle) {
    } else {
      ez_navigate_start();
    }
  }
  else if(e.keyCode == EZ_KEY_ENTER) {
    if(ez_navigateToggle) {
      ez_enter();
    } else {
      ez_navigate_start();
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