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

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
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

function find_parent_attr(obj,attr) {
	if(obj == null) { return undefined; }
	while(obj.nodeType !== 9) {
		if(obj.hasAttribute(attr)) {
			return obj.getAttribute(attr);
		}
		obj = obj.parentNode;
	}
	return undefined;
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
		if(parentLabel.tagName === "LABEL") {
			return parentLabel;
		}
		parentLabel = parentLabel.parentNode;
	}
	return null;
}

function isChildOfElType(obj, type) {
	if(obj.tagName == undefined) return false;
	if(obj.tagName.toLowerCase() == type.toLowerCase()) return true;
	return isChildOfElType(obj.parentNode, type);
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