// Selector ID to use on the page
var ezSelectorId = 'ezselected';

// Tags that are candidates for highlight
var COMPATIBLE_TAGS = 'p,img,a,div,h1,h2,h3,h4,h5,figure,figcaption,ul,ol,li,input,button,textarea,select,article,aside,hgroup,legend,dt,dd,label';

// Array of tags generated on pageload initialized globally
var selectElements;

// Current index (of selectElements array) for navigation purposes
var currIndex = 0;

// Whether EZ navigation mode is activated or not
var ez_navigateToggle = false;

// Wrap elements on the screen
var screenWrap = false;

// Whether to allow reordering elements manually from DOM standard.
var allowReorder = false;


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
	
	// We must remove leaves before ANY parsing.
  resultArray = setLeaves(resultArray);
  
  // Remove labels with references
  resultArray = removeNonOrphanedLabels(resultArray);
  
	return resultArray;
}

function removeNonOrphanedLabels(elements) {
	for(var i = 0; i < elements.length; ) {
		if(elements[i].tagName === 'LABEL' && !orphanedLabel(elements[i])) {
			elements.splice(i, 1);
		} else {
			i++;
		}
	}
	return elements;
}

function orphanedLabel(element) {
	if(element.htmlFor == '') {
		return true;
	}
	if(getElementsByTagNames(COMPATIBLE_TAGS,element).length > 0) {
		return true;
	}
	return false;
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
			else if(selectElements[i].hasAttribute('tabindex')) {
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

//Index elements on the page.
function indexElements(world) {  
  // INITIAL INDEXING OF PAGE ELEMENTS
  selectElementsTemp = getElementsByTagNames(COMPATIBLE_TAGS,world);
  
  // Check if ez-focusable to remove (+ CHILDREN)
  for(var i = 0; i < selectElementsTemp.length;i++) {
    if(selectElementsTemp[i].getAttribute('data-ez-focusable') == 'false') {
      var children = getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]);
      for(var j = 0; j < children.length+1; j++) {
        if(!selectElementsTemp[i+j].hasAttribute('data-ez-focusable') || selectElementsTemp[i+j].getAttribute('data-ez-focusable') === 'inherit') {
          selectElementsTemp[i+j].setAttribute('data-ez-focusable','false');
        }
      }
    }
    if(selectElementsTemp[i].getAttribute('data-ez-focusable-nav') == 'false') { // Like above code for *-nav
      var children = getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]);
      for(var j = 0; j < children.length+1; j++) {
        if(!selectElementsTemp[i+j].hasAttribute('data-ez-focusable-nav') || selectElementsTemp[i+j].getAttribute('data-ez-focusable-nav') === 'inherit') {
          selectElementsTemp[i+j].setAttribute('data-ez-focusable-nav','false');
        }
      }
    }
    if(selectElementsTemp[i].getAttribute('data-ez-focusable-point') == 'false') { // Like above code for *-point
      var children = getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]);
      for(var j = 0; j < children.length+1; j++) {
        if(!selectElementsTemp[i+j].hasAttribute('data-ez-focusable-point') || selectElementsTemp[i+j].getAttribute('data-ez-focusable-point') === 'inherit') {
          selectElementsTemp[i+j].setAttribute('data-ez-focusable-point','false');
        }
      }
    }
  }
  
  // Check if ez-chunking == group; if so, group 'em
  for(var i = 0; i < selectElementsTemp.length;) {
    if(selectElementsTemp[i].getAttribute('data-ez-chunking') == 'group' && !selectElementsTemp[i].hasAttribute('data-ez-subnavtype')) {
      var removeAmount = getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]).length;
      selectElementsTemp.splice(i+1,removeAmount);
      i += removeAmount+1;
    }
    else { i++; }
  }
  
  // Check and remove elements with children if tabindex (excluding grouped stuff).
  if(allowReorder) {
		for(var i = 0; i < selectElementsTemp.length;) {
			if(selectElementsTemp[i].hasAttribute('tabindex') && getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]).length > 0 && !(selectElementsTemp[i].getAttribute('data-ez-focusable') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-point') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-nav') == 'true')) {
				var removeAmount = getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]).length;
				selectElementsTemp.splice(i+1,removeAmount);
				i += removeAmount+1;
			}
			else { i++; }
		}
  }
  
  // Check and remove elements with children (excluding grouped stuff). MUST BE LAST THING DONE
  for(var i = 0; i < selectElementsTemp.length;) {
    if((!allowReorder || !selectElementsTemp[i].hasAttribute('tabindex')) && getElementsByTagNames(COMPATIBLE_TAGS,selectElementsTemp[i]).length > 0 && selectElementsTemp[i].getAttribute('data-ez-chunking') != 'group' && selectElementsTemp[i].getAttribute('data-ez-chunking') != 'block' && !(selectElementsTemp[i].getAttribute('data-ez-focusable') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-point') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-nav') == 'true')) {
      selectElementsTemp.splice(i,1); // Remove entry
    }
    else { i++; }
  }
  return selectElementsTemp;
}

function ez_navigate_start(propagated) {
  ez_navigateToggle = true;
  sessionStorage.setItem("EZ_Toggle", "1");
  if(document.body.hasAttribute('data-ez-startat')) {
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

// On page load, load key_event() listener
function load_ez() {
	  if(document.body.hasAttribute('data-ez-allowreorder')) {
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
  if(document.body.hasAttribute('data-ez-screenwrap')) {
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
  
  // Load any potential dictionary
  if(document.body.hasAttribute('data-ez-pronounce')) {
		Lib.ajax.getJSON({
				url: document.body.getAttribute('data-ez-pronounce'),
				type: 'json'
		}, function(dictionary) {
				this.dictionary = JSON.parse(dictionary);
		});
	}
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

// Event listener if window is resized the selected box will be redrawn
// TODO: Make not overwrite anything else
window.onresize = function() {
  if(ez_navigateToggle) { drawSelected(selectElements[currIndex]); }
}

function groupSkip(move) {
  if(selectElements[currIndex].getAttribute('data-ez-chunking') == 'group' && selectElements[currIndex].getAttribute('data-ez-subnavtype') == 'nested' || selectElements[currIndex].getAttribute('data-ez-subnavtype') == 'hierarchical') {
    if(move == 'down') {
      return currIndex + indexElements(selectElements[currIndex]).length;
    }
  }
  else if(move == 'up') {
    if(selectElements[currIndex].hasAttribute("data-tmp-jump")) {
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

// Like ez_navigate("down"), but for when navigating to first element inside a group
function ez_navigate_in_group() {
  if(selectElements[currIndex].hasAttribute('data-ez-groupdefault')) {
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

function clear_jumppoints() {
	for(var i = 0; i < selectElements.length; i++) {
		selectElements[i].removeAttribute("data-tmp-level");
		selectElements[i].removeAttribute("data-tmp-jump");
	}
}

function load_jumppoints() {
  for(var i = 0; i < selectElements.length; i++) {
    if(selectElements[i].getAttribute('data-ez-chunking') == 'group' && selectElements[i].getAttribute('data-ez-subnavtype') == 'nested' || selectElements[i].getAttribute('data-ez-subnavtype') == 'hierarchical') {
      if(!selectElements[i].hasAttribute('data-ez-focusable-point')) {
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
      if(!selectElements[endElement].hasAttribute('data-tmp-jump')) {
        selectElements[endElement].setAttribute('data-tmp-jump',i);
      }
    }
  }
}

function setLeaves(elements) {
	for(var i = 0; i < elements.length; ) {
		if(isChildOfElType(elements[i].parentNode, 'INPUT') || isChildOfElType(elements[i].parentNode, 'BUTTON')) {
			elements.splice(i, 1);
		} else {
			i++;
		}
	}
	return elements;
}

function load_flowfrom() {
  for(var i = 0; i < selectElements.length; i++) {
    if(allowReorder && selectElements[i].hasAttribute('aria-flowto')) {
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