/**
 * Selector ID to use on the page
 * @type {string}
  */
var ezSelectorId = 'ezselected';

/**
 * Tags that are candidates for highlight
 * @type {string}
 * @const
 */
var COMPATIBLE_TAGS = 'p,img,a,div,h1,h2,h3,h4,h5,figure,figcaption,ul,ol,li,input,button,textarea,select,article,aside,hgroup,legend,dt,dd,label';

/**
 * Array of tags generated on pageload initialized globally
 * @type {object[]}
 */
var selectElements;

/**
 * Current index (of selectElements array) for navigation purposes
 * @type {number}
 */
var currIndex = 0;

/**
 * Whether EZ navigation mode is activated or not
 * @type {boolean}
 */
var ez_navigateToggle = false;

/**
 * Wrap elements on the screen
 * @type {boolean}
 */
var screenWrap = false;

/**
 * Whether to allow reordering elements manually from DOM standard.
 * @type {boolean}
 */
var allowReorder = false;


/**
 * Gets all elements, IN ORDER _AND_ by element name.
 * http://www.quirksmode.org/dom/getElementsByTagNames.html
 * @param {string} list A string with a comma-separated list of tag names.
 * @param {object} obj An optional start element. If it's present the script searches only for tags that
 * are descendants of this element, if it's absent the script searches the entire document.
 * @returns {Array} References to object as an array that are requested.
 */
function getElementsByTagNames(list, obj) {
	if(!obj) obj = document;
	var tagNames = list.split(',');
	var resultArray = [];
	for(i = 0; i < tagNames.length; i++) {
		var tags = obj.getElementsByTagName(tagNames[i]);
		for(var j = 0; j < tags.length; j++) {
			resultArray.push(tags[j]);
		}
	}
	var nodeList_parsed = document.querySelectorAll("[data-ez-parse]");

	var force_parsed = [],
		l = nodeList_parsed.length >>> 0; // Convert to array
	for( ; l--; force_parsed[l] = nodeList_parsed[l]);

	for(var i = 0; i < force_parsed.length;) {
		if(!isDescendant(obj, force_parsed[i])) {
			force_parsed.splice(i, 1);
		} else {
			i++;
		}
	}

	resultArray = resultArray.concat(force_parsed);

	var testNode = resultArray[0];
	if(!testNode) return [];
	if(testNode.sourceIndex) {
		resultArray.sort(function (a, b) {
			return a.sourceIndex - b.sourceIndex;
		});
	} else if(testNode.compareDocumentPosition) {
		resultArray.sort(function (a, b) {
			return 3 - (a.compareDocumentPosition(b) & 6);
		});
	}

	// We must remove leaves before ANY parsing.
	resultArray = setLeaves(resultArray);

	// Remove labels with references
	resultArray = removeNonOrphanedLabels(resultArray);

	return resultArray;
}

/**
 * Removes labels that do not reference anything.
 * @param {object[]} elements Object array of elements
 * @returns {object[]} An array of a selection of labels via 'elements' that are not orphaned (reference something).
 */
function removeNonOrphanedLabels(elements) {
	for(var i = 0; i < elements.length;) {
		if(elements[i].tagName === 'LABEL' && !orphanedLabel(elements[i])) {
			elements.splice(i, 1);
		} else {
			i++;
		}
	}
	return elements;
}

/**
 * Used by fn removeNonOrphanedLabels. Finds if label is orphaned returns boolean on state. Assumes the 'for' attribute
 * references a valid element. Looks for implicit AND explicit referencing.
 * @param {object} element MUST be a label for function to operate properly.
 * @returns {boolean} True iff orphaned.
 */
function orphanedLabel(element) {
	if(element.htmlFor == '') {
		return true;
	}
    return getElementsByTagNames(COMPATIBLE_TAGS, element).length > 0;
}

/**
 * This function reparses and updates the selectElements element, as well as modifying some DOM element attributes for
 * EZ Access. However, a lot of the actual 'parsing' and manipulation of the retrieved potentially navigable elements
 * is done by the indexElements function.
 */
function index_ez() {
	parseOrphanedText(getElementsByTagNames('p'));

	selectElements = indexElements(document);

	if(allowReorder) {
		// Sorting by tabindex
		var tempselectElement = [];
		j = 0;
		for(var i = 0; i < selectElements.length;) {
			if(parseFloat(selectElements[i].getAttribute('tabindex')) < 0) {
				selectElements.splice(i, 1); // Skip if < 0
			} else if(selectElements[i].hasAttribute('tabindex')) {
				tempselectElement[j] = selectElements.splice(i, 1)[0];
				j++;
			} else {
				i++;
			}
		}
		tempselectElement.sort(function (a, b) {
			return a.getAttribute('tabindex') - b.getAttribute('tabindex');
		});
		selectElements = tempselectElement.concat(selectElements);
	}

	clear_jumppoints();
	load_jumppoints();

	if(allowReorder) {
		load_flowfrom();
	}
}

/**
 * Creates a selectElements candidate given a scope.
 * @param {object} world The scope to look at. If given element, only looks at children. If given 'document' ==> valid for whole
 * web page.
 * @returns {object[]} Returns a new selectElements potential variable.
 */
function indexElements(world) {
	// INITIAL INDEXING OF PAGE ELEMENTS
	var children;
    selectElementsTemp = getElementsByTagNames(COMPATIBLE_TAGS, world);

	// Check if ez-focusable to remove (+ CHILDREN)
	for(i = 0; i < selectElementsTemp.length; i++) {
		if(selectElementsTemp[i].getAttribute('data-ez-focusable') == 'false') {
            children = getElementsByTagNames(COMPATIBLE_TAGS, selectElementsTemp[i]);
			for(j = 0; j < children.length + 1; j++) {
				if(!selectElementsTemp[i + j].hasAttribute('data-ez-focusable') || selectElementsTemp[i + j].getAttribute('data-ez-focusable') === 'inherit') {
					selectElementsTemp[i + j].setAttribute('data-ez-focusable', 'false');
				}
			}
		}
		if(selectElementsTemp[i].getAttribute('data-ez-focusable-nav') == 'false') { // Like above code for *-nav
			children = getElementsByTagNames(COMPATIBLE_TAGS, selectElementsTemp[i]);
			for(j = 0; j < children.length + 1; j++) {
				if(!selectElementsTemp[i + j].hasAttribute('data-ez-focusable-nav') || selectElementsTemp[i + j].getAttribute('data-ez-focusable-nav') === 'inherit') {
					selectElementsTemp[i + j].setAttribute('data-ez-focusable-nav', 'false');
				}
			}
		}
		if(selectElementsTemp[i].getAttribute('data-ez-focusable-point') == 'false') { // Like above code for *-point
			children = getElementsByTagNames(COMPATIBLE_TAGS, selectElementsTemp[i]);
			for(var j = 0; j < children.length + 1; j++) {
				if(!selectElementsTemp[i + j].hasAttribute('data-ez-focusable-point') || selectElementsTemp[i + j].getAttribute('data-ez-focusable-point') === 'inherit') {
					selectElementsTemp[i + j].setAttribute('data-ez-focusable-point', 'false');
				}
			}
		}
	}

	// Check if ez-chunking == group; if so, group 'em
	for(i = 0; i < selectElementsTemp.length;) {
		if(selectElementsTemp[i].getAttribute('data-ez-chunking') == 'group' && !selectElementsTemp[i].hasAttribute('data-ez-subnavtype')) {
            removeAmount = getElementsByTagNames(COMPATIBLE_TAGS, selectElementsTemp[i]).length;
			selectElementsTemp.splice(i + 1, removeAmount);
			i += removeAmount + 1;
		} else {
			i++;
		}
	}

	// Check and remove elements with children if tabindex (excluding grouped stuff).
	if(allowReorder) {
		for(i = 0; i < selectElementsTemp.length;) {
			if(selectElementsTemp[i].hasAttribute('tabindex') && getElementsByTagNames(COMPATIBLE_TAGS, selectElementsTemp[i]).length > 0 && !(selectElementsTemp[i].getAttribute('data-ez-focusable') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-point') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-nav') == 'true')) {
				var removeAmount = getElementsByTagNames(COMPATIBLE_TAGS, selectElementsTemp[i]).length;
				selectElementsTemp.splice(i + 1, removeAmount);
				i += removeAmount + 1;
			} else {
				i++;
			}
		}
	}

	// Check and remove elements with children (excluding grouped stuff). MUST BE LAST THING DONE
	for(var i = 0; i < selectElementsTemp.length;) {
		if((!allowReorder || !selectElementsTemp[i].hasAttribute('tabindex')) && getElementsByTagNames(COMPATIBLE_TAGS, selectElementsTemp[i]).length > 0 && selectElementsTemp[i].getAttribute('data-ez-chunking') != 'group' && selectElementsTemp[i].getAttribute('data-ez-chunking') != 'block' && !(selectElementsTemp[i].getAttribute('data-ez-focusable') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-point') == 'true' || selectElementsTemp[i].getAttribute('data-ez-focusable-nav') == 'true')) {
			selectElementsTemp.splice(i, 1); // Remove entry
		} else {
			i++;
		}
	}
	return selectElementsTemp;
}

/**
 * Starts EZ Access navigation on the current page, whether automatically or from an EZ Access keypress.
 * @param {boolean} propagated Whether or not the EZ Access was enabled previously (startid depends on this, and some other
 * things like a url with a #element reference do as well.
 */
function ez_navigate_start(propagated) {
	ez_navigateToggle = true;
	sessionStorage.setItem("EZ_Toggle", "1");
	if(document.body.hasAttribute('data-ez-startat')) {
        var startid;
		if(propagated) {
			// Of "#<id> #<id>" of second element
			startid = document.body.getAttribute('data-ez-startat').split(" ")[1].slice(1);
		} else {
			// Of "#<id> #<id>" of first element
            startid = document.body.getAttribute('data-ez-startat').split(" ")[0].slice(1);
		}
		for(var i = 0; i < selectElements.length; i++) {
			if(selectElements[i].id !== null && selectElements[i].id == startid) {
				currIndex = i;
				break;
			} // Else, default initial currIndex = 0 (from beginning)
		}
	} else {
		if(propagated) {
			if(document.URL.indexOf("#") != -1) {
				var jumpTo = document.URL.substring(document.URL.indexOf("#") + 1);
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
	voice(selectElements[currIndex], 'nav');
}

/**
 * Loads one-time stuff to start EZ Access (such as audio, multitouch library & external JSON data).
 * Determines if EZ Access should be started by default (or just loaded).
 */
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
	map = {}; // Have to do this weird thing in order to detect two keys at same time (e.g., shift+tab)
	onkeydown = function (event) {
        autoAdvance = 0; // Stop any autoadvancing timers
		window.clearInterval(autoAdvTimer);
		if(autoRepeat == 'keyboard') {
            return1 = multikey_event(event);
		} else if(autoRepeat == 'on') {
			return1 = multikey_event(event);
            return2 = key_event(event);
		}
		if(lastEvent && lastEvent.keyCode == event.keyCode) {
			return false;
		}
		lastEvent = event;
		heldKeys[event.keyCode] = true;
		if(autoRepeat == 'off') {
			return1 = multikey_event(event);
			return2 = key_event(event);
		} else if(autoRepeat == 'keyboard') {
			return2 = key_event(event);
		}
        if (!(return1 && return2)) {
            return false;
        }
	};
	onkeyup = function (event) {
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
	} else if(document.body.getAttribute('data-ez-tabnav') == 'hybrid') {
		tabNav = 'hybrid';
	} else if(document.body.getAttribute('data-ez-tabnav') == 'none') {
		tabNav = 'none';
	}

	if(document.body.getAttribute('data-ez-slidetoread') == 'off') {
		slideToRead = false;
	}
	if(document.body.getAttribute('data-ez-startingmode') == 'ezon') {
		// On chrome, will not draw until a small amount of time passes for some reason
		setTimeout(function () {
			ez_navigate_start();
			drawSelected(selectElements[currIndex]);
		}, 10);
	} else if(parseInt(sessionStorage.getItem("EZ_Toggle")) == true && document.body.getAttribute('data-ez-startingmode') != 'ezoff') {
		setTimeout(function () {
			ez_navigate_start(true);
			drawSelected(selectElements[currIndex]);
		}, 10);
	}

	//idle_loop(); // TODO/TEMP

	// Multitouch gesture dragging
	if(slideToRead) { // If not allowed, do not initialize
		var hammer = new Hammer(document.body);
		hammer.ondrag = function (ev) {
			var currElement = selectElements[currIndex];
			index_ez();
			currIndex = 0;
			for(var i = 0; i < selectElements.length; i++) {
				if(selectElements[i] == currElement) {
					currIndex = i;
				}
			}
			mouseOver(document.elementFromPoint(parseFloat(ev.position.x) - parseFloat(window.scrollX), parseFloat(ev.position.y) - parseFloat(window.scrollY)));
		};
		hammer.ontap = function () {
			stopEZ();
		};
	}

	// Load any potential dictionary
	if(document.body.hasAttribute('data-ez-pronounce')) {
		Lib.ajax.getJSON({
			url: document.body.getAttribute('data-ez-pronounce'),
			type: 'json'
		}, function (getDictionary) {
			dictionary = JSON.parse(getDictionary);
		});
	}
}

/**
 * Draws selected box around DOM object referenced to. Creates selected box if & inserts into DOM if it doesn't
 * previously exist.
 * @param {object} obj DOM Object to draw box selected box around.
 * @returns {boolean} If finding dimensions of element failed (such as if hidden).
 */
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
		div.setAttribute("data-ez-focusable", "false");
		var rgb = "rgba(" + hexToRgb(EzCustomColor).r + "," + hexToRgb(EzCustomColor).g + "," + hexToRgb(EzCustomColor).b + ",";
		var rgbinverse = "rgba(" + (255 - hexToRgb(EzCustomColor).r) + "," + (255 - hexToRgb(EzCustomColor).g) + "," + (255 - hexToRgb(EzCustomColor).b) + ",";
		// Load the CSS pulsing Stuff
		var cssAnimation = document.createElement('style');
		cssAnimation.type = 'text/css';
		var rules = document.createTextNode('@-webkit-keyframes pulse {' +
			'from { border:5px solid ' + rgb + '1); }' +
			'50% { border:5px solid ' + rgbinverse + '0.5); }' +
			'to { border:5px solid ' + rgb + '0); }' +
			'}');
		cssAnimation.appendChild(rules);
		document.getElementsByTagName("head")[0].appendChild(cssAnimation);

		div.style.border = "5px solid " + rgb + "1)";
		div.style['boxShadow'] = "0px 0px 15px 5px " + rgb + ".80)";
		div.id = ezSelectorId;
		if(document.body.firstChild) {
			document.body.insertBefore(div, document.body.firstChild);
		} else {
			document.body.appendChild(div);
		}
		old = document.getElementById(ezSelectorId); // Redefine the new selected div
	}
	old.style.visibility = "visible";
	old.style.left = pos.x - 10 + 'px';
	old.style.top = pos.y - 10 + 'px';
	old.style.width = obj.offsetWidth + 10 + 'px';
	old.style.height = obj.offsetHeight + 10 + 'px';
	//obj.style.display = tmp; // INLINE BLOCK OUTLINE FIXER
	return true;
}

/**
 * Event listener if window is resized ==> The selected box will be redrawn.
 */
window.onresize = function () {
	if(ez_navigateToggle) {
		drawSelected(selectElements[currIndex]);
	}
};

/**
 * If on a group, will skip past it + nested elements in selectElements.
 * @param {string} move String 'up' || 'down' Depending on direction navigating.
 * @returns {number|boolean} New currIndex, or false no jump needed.
 */
function groupSkip(move) {
	if(selectElements[currIndex].getAttribute('data-ez-chunking') == 'group' && selectElements[currIndex].getAttribute('data-ez-subnavtype') == 'nested' || selectElements[currIndex].getAttribute('data-ez-subnavtype') == 'hierarchical') {
		if(move == 'down') {
			return currIndex + indexElements(selectElements[currIndex]).length;
		}
	} else if(move == 'up') {
		if(selectElements[currIndex].hasAttribute("data-tmp-jump")) {
			return parseFloat(selectElements[currIndex].getAttribute("data-tmp-jump"));
		}
	}
	return false;
}

/**
 * Controls if the navigation should be stopped due to a hierarchical group.
 * @param {string} move 'up' || 'down' depending on nav direction.
 * @returns {boolean} If stopped or not.
 */
function hierarchicalStopper(move) {
	var oldLevel = selectElements[currIndex].getAttribute('data-tmp-level');
	var newLevel;
	var skip;
	if(move == 'down') {
		skip = currIndex + indexElements(selectElements[currIndex]).length + 1;
		newLevel = selectElements[skip].getAttribute('data-tmp-level');
	} else if(move == 'up') {
		skip = selectElements[currIndex - 1].getAttribute("data-tmp-jump");
		if(skip === null) {
			skip = currIndex - 1;
		} else {
			skip = parseFloat(selectElements[currIndex - 1].getAttribute("data-tmp-jump"));
		}
		newLevel = selectElements[skip].getAttribute('data-tmp-level');
	}
	if(newLevel == 0 && oldLevel == 0) {
		return false;
	}
	if(newLevel != oldLevel) {
		if(selectElements[findGroupParent()].getAttribute("data-ez-chunking") == 'group' && selectElements[findGroupParent()].getAttribute("data-ez-subnavtype") == 'hierarchical') {
			document.getElementById(ezSelectorId).className = 'pulse';
			setTimeout(function () {
				document.getElementById(ezSelectorId).className = '';
			}, 300);
			sounds[AUDIO_NOACTION].feed.play();
			voice("Press back to leave the group");
			return true;
		} else if(selectElements[findGroupParent()].getAttribute("data-ez-chunking") == 'group' && selectElements[findGroupParent()].getAttribute("data-ez-subnavtype") == 'nested') {
			globalSayBefore = "Navigating out of group... ";
		}
	}
	return false;
}

/**
 * Looks for a data-tmp-level attribute parent.
 * @returns {number} Group element currIndex
 */
function findGroupParent() {
	var oldLevel = selectElements[currIndex].getAttribute('data-tmp-level');
	var i = currIndex;
	while(i > 0 && parseFloat(selectElements[i].getAttribute('data-tmp-level')) >= oldLevel) {
		i--;
	}
	if(i == currIndex) {
		return currIndex;
	} // No group (@ 0th level)
	return i; // Return group element currIndex #
}

/**
 * Like ez_navigate("down"), but for when navigating to first element inside a group
 * TODO Merge with other stuff! Outdated!
 */
function ez_navigate_in_group() {
	if(selectElements[currIndex].hasAttribute('data-ez-groupdefault')) {
		ez_jump(getCurrIndexById(selectElements[currIndex].getAttribute('data-ez-groupdefault').split(' ')[0]));
		return;
	}
	currIndex++;
	if(selectElements[currIndex].getAttribute('data-ez-focusable-nav') == 'false' || selectElements[currIndex].getAttribute('data-ez-focusable') == 'false') {
		ez_navigate_in_group();
		return;
	}
	if(!drawSelected(selectElements[currIndex])) {
		ez_navigate('down');
		return;
	}
	sounds[getElementAudio()].feed.play();
	selectElements[currIndex].focus(); // Add focus to new element
	voice(selectElements[currIndex], 'nav', globalSayBefore);
}

/**
 * Finds the first or last focusable element of selectElements
 * @param {number} location Whether looking for 'first || 'last' navigable element of selectElements.
 * @returns {number} New currIndex of next focusable element of selectElements in nav'ing direction.
 */
function findFocusable(location) {
	if(location == 'last') {
		for(i = selectElements.length - 1; i > 0;) {
			pos = getElementAbsolutePos(selectElements[i]);
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
		for(var i = 0; i < selectElements.length - 1;) {
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
		return selectElements.length - 1;
	}
	return null;
}

/**
 * Removes data-tmp-level && data-tmp-jump from selectElements.
 */
function clear_jumppoints() {
	for(var i = 0; i < selectElements.length; i++) {
		selectElements[i].removeAttribute("data-tmp-level");
		selectElements[i].removeAttribute("data-tmp-jump");
	}
}

/**
 * Creates data-tmp-level && data-tmp-jump for selectElements depending on if in a group or not.
 */
function load_jumppoints() {
	for(var i = 0; i < selectElements.length; i++) {
		if(selectElements[i].getAttribute('data-ez-chunking') == 'group' && selectElements[i].getAttribute('data-ez-subnavtype') == 'nested' || selectElements[i].getAttribute('data-ez-subnavtype') == 'hierarchical') {
			if(!selectElements[i].hasAttribute('data-ez-focusable-point')) {
				selectElements[i].setAttribute('data-ez-focusable-point', 'false'); // Default pointer navigates INSIDE the element (not on the wrapper)
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
				insideElements[j].setAttribute('data-tmp-level', level);
			}

			var endElement = insideElements.length + i;
			if(!selectElements[endElement].hasAttribute('data-tmp-jump')) {
				selectElements[endElement].setAttribute('data-tmp-jump', i);
			}
		}
	}
}

/**
 * Removes elements that are children of an 'input' or 'button' tag.
 * @param {object[]} elements Elements to potentially remove
 * @returns {object[]} Returns elements param with removed children of leaves.
 */
function setLeaves(elements) {
	for(var i = 0; i < elements.length;) {
		if(isChildOfElType(elements[i].parentNode, 'INPUT') || isChildOfElType(elements[i].parentNode, 'BUTTON')) {
			elements.splice(i, 1);
		} else {
			i++;
		}
	}
	return elements;
}

/**
 * Creates data-tmp-flowfrom tags to complement aria-flowto tags (so not looking each time + slowing down).
 * Basically caching.
 */
function load_flowfrom() {
	for(var i = 0; i < selectElements.length; i++) {
		if(allowReorder && selectElements[i].hasAttribute('aria-flowto')) {
			var flowId = selectElements[i].getAttribute('aria-flowto').split(' ')[0]; // In case multiple exist, grab first
			for(var j = 0; j < selectElements.length; j++) {
				if(selectElements[j].id == flowId) {
					selectElements[j].setAttribute('data-tmp-flowfrom', i);
					break;
				}
			}
		}
	}
}

/**
 * Stops EZ Access navigation, hides EZ Access selector and resets variables.
 */
function stopEZ() {
	ez_navigateToggle = false;
	idle_loop();
	currIndex = 0;
	voice("");
	sessionStorage.setItem("EZ_Toggle", "0");
	var old = document.getElementById(ezSelectorId);
	if(old !== null) {
		old.style.visibility = "hidden";
		old.style.left = 0 + "px";
		old.style.top = 0 + "px";
		old.style.width = 0 + "px";
		old.style.height = 0 + "px";
	}
}