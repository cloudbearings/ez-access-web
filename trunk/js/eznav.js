/**
 * Tab keycodes
 */
var KB_TAB = 9;
var KB_SHIFT = 16;
var KB_ENTER = 13;

/**
 * EZ-Access keycode declarations
 */
var EZ_KEY_SKIPFORWARD = 135; // is >>
var EZ_KEY_SKIPBACKWARD = 134; // is <<
var EZ_KEY_HELP = 128; // is ?
var EZ_KEY_BACK = 132; // is BACK
var EZ_KEY_NEXT = 133; // is NEXT
var EZ_KEY_UP = 129; // is up arrow key
var EZ_KEY_DOWN = 130; // is down arrow key
var EZ_KEY_ENTER = 131; // is green circle enter key

/**
 * Whether slide to read is enabled universally
 * @type {boolean}
 */
var slideToRead = true;

/**
 * How many times the user tried to navigate up or down
 * @type {number}
 */
var edgeNavAttempt = 0;

/**
 * Determines key autorepeat preperty or not
 * @type {string}
 */
var autoRepeat = 'off';

/**
 * Tabular navigation behavior (& cooperation w/ browser)
 * @type {string}
 */
var tabNav = 'ezaccess';

/**
 * Global idle loop timer if no user action is taken
 */
var idleLoop;

// If autoadvance is enabled or not
// Also autoadvance timer is global to disable from other functions
var autoAdvance = 0;
var autoAdvTimer;


/* Referred to by window.onload anonymous function.
   http://www.dreamincode.net/code/snippet1246.htm */

/**
 * Handles key events for EZ Access (except for multi-key pressed, like tab+shift handled by multikey_event)
 * @param {event} e Event object passed from set up on EZ Access startup.
 * @returns {boolean} If false, disables default key action.
 */
function key_event(e) {
	// 'if' keycode statements
	if(e.keyCode == EZ_KEY_HELP || e.keyCode == 72) { // 72 == 'h'
        sounds[AUDIO_MOVE].feed.play();

		if(tinyOpen) {
			closeTiny(true);
		} else {
			ez_help(getActionableElement(selectedEls, 'nav'));
		}

        // Set when closing the lightbox
        document.getElementById('tinymask').addEventListener('click', function() {
            closeTiny(false);
        });

	} else if(e.keyCode == EZ_KEY_UP) {
		if(tinyOpen) {
            if(tinyOpen && helpObj !== null) {
                ez_help_goto_section(-1);
            } else {
                closeTiny(true);
            }
		} else {
			if(ez_navigateToggle) {
				ez_navigate('up');
			} else {
				ez_navigate_start(false, 'nav');
			}
		}
	} else if(e.keyCode == EZ_KEY_DOWN) {
		if(tinyOpen) {
            if(tinyOpen && helpObj !== null) {
                ez_help_goto_section(1);
            } else {
                closeTiny(true);
            }
		} else {
			if(ez_navigateToggle) {
				ez_navigate('down');
			} else {
				ez_navigate_start(false, 'nav');
			}
		}
	} else if(e.keyCode == EZ_KEY_BACK || e.keyCode == 66) { // 'b' == 66
		// TODO
		if(tinyOpen) {
            closeTiny(true);
		} else {
			var el = getKeyBinding('back');
			if (el === null) {
				window.history.back();
			} else {
				el.click();
			}
		}
	} else if (e.keyCode === EZ_KEY_NEXT) {
		if(tinyOpen) {
            closeTiny(true);
		} else {
			var el = getKeyBinding('next');
			if (el !== null) {
				el.click();
			}
		}
	} else if(e.keyCode == EZ_KEY_ENTER || e.keyCode == KB_ENTER) {
		if(tinyOpen) {
            closeTiny(true);
		} else {
			if(ez_navigateToggle) {
				ez_enter(selectedEls, 'nav');
			}
			return false; // Disable any browser actions
		}
	} else if(e.keyCode == EZ_KEY_SKIPFORWARD) {
		if(selectedEls.type == 'range') {
			selectedEls.value = parseFloat(selectedEls.value) + parseFloat(selectedEls.step);
			sounds[AUDIO_MOVE].feed.play();
			voice(selectedEls.value);
		} else if(selectedEls.tagName == 'SELECT') {
			if(selectedEls.selectedIndex < selectedEls.length - 1) {
				selectedEls.selectedIndex++;
				sounds[AUDIO_MOVE].feed.play();
				voice(selectedEls.value + '... option ' + (selectedEls.selectedIndex + 1) + ' of ' + selectedEls.length);
			} else {
				document.getElementById(ezSelectorId).className = 'pulse';
				setTimeout(function () {
					document.getElementById(ezSelectorId).className = '';
				}, 300);
				sounds[AUDIO_NOACTION].feed.play();
			}
		} else {
            if(audioVolume <= 90) {
                audioVolume += 10;
                sessionStorage.setItem("EZ_Volume", audioVolume);
                set_volume();
                sounds[AUDIO_MOVE].feed.play();
                voice("Volume... " + audioVolume + " percent");
            } else {
                document.getElementById(ezSelectorId).className = 'pulse';
                setTimeout(function () {
                    document.getElementById(ezSelectorId).className = '';
                }, 300);
                sounds[AUDIO_NOACTION].feed.play();
                voice("Maximum volume");
            }
		}
	} else if(e.keyCode == EZ_KEY_SKIPBACKWARD) {
		if(selectedEls.type == 'range') {
			selectedEls.value = parseFloat(selectedEls.value) - parseFloat(selectedEls.step);
			sounds[AUDIO_MOVE].feed.play();
			voice(selectedEls.value);
		} else if(selectedEls.tagName == 'SELECT') {
			if(selectedEls.selectedIndex > 0) {
				selectedEls.selectedIndex--;
				sounds[AUDIO_MOVE].feed.play();
				voice(selectedEls.value + '... option ' + (selectedEls.selectedIndex + 1) + ' of ' + selectedEls.length);
			} else {
				document.getElementById(ezSelectorId).className = 'pulse';
				setTimeout(function () {
					document.getElementById(ezSelectorId).className = '';
				}, 300);
				sounds[AUDIO_NOACTION].feed.play();
			}
		} else {
            if(audioVolume >= 10) {
                sessionStorage.setItem("EZ_Volume", audioVolume);
                audioVolume -= 10;
                set_volume();
                sounds[AUDIO_MOVE].feed.play();
                voice("Volume... " + audioVolume + " percent");
            } else {
                document.getElementById(ezSelectorId).className = 'pulse';
                setTimeout(function () {
                    document.getElementById(ezSelectorId).className = '';
                }, 300);
                sounds[AUDIO_NOACTION].feed.play();
                voice("Minimum volume");
            }
		}
	} else if(selectedEls.type == 'textarea' || selectedEls.type == 'text') {
		var key = String.fromCharCode(e.keyCode);
		if(!key.match(/[^A-Za-z0-9\-_]/)) voice(key);
	}
	return true;
}


/**
 * Finds the DOM element where key matches the data-ez-keybinding attribute.
 * @author J. Bern Jordan
 * @param {string} key A key name. Supported key names are in the constant 
 * array SUPPORTED_KEY_NAMES.
 * @return {Element|null} Returns the first DOM element with the keybinding
 * or null otherwise.
 */
function getKeyBinding(key) {
	'use strict'

    // Allow any case (consistent w/ HTML)
    key = key.toLowerCase();

	var SUPPORTED_KEY_NAMES = ['back','next'];

	if (SUPPORTED_KEY_NAMES.indexOf(key.toString()) < 0) {
        _debug('getKeyBinding(): key=' + key + ' is not supported.');
		return null;
	}

	return document.querySelector("[data-ez-keybinding~='" + key + "']");
}

/**
 * If there are multiple elements selected, this function does its best to detemine which one is the actionable one
 * (if any). The should never really be more than one actionable element, as per EZ Access design.
 * @param nods Nodes in a list to check out.
 * @param source {'nav'|'point'} Navigation method.
 * @returns {Element|null} The element that is believed to be actionable, if any
 */
function getActionableElement(nods, source) {

    if(nods.length === 0) return null;

    // Nv'd inside an element's text
    if(nods.length === 1 && nods[0].nodeType === 3) {
        return nods[0].parentElement;
    }

    // Get the element if multiple nodes and one element are navagable.
    var els = 0;
    var lastEl;
    for(i = 0; i < nods.length; i++) {
        if(isElement(nods[i])) {
            els++;
            lastEl = nods[i];
        }
    }
    if(els === 1) {
        return lastEl;
    }
    if(isElement(nods[0])) return nods[0];
    else return nods[0].parentElement;
}

/**
 * Blurs the previous actionable element, if one exists
 */
function blurPrev() {
    // Blur previously selected element
    var prevFocused = getActionableElement(selectedEls, 'nav');
    if(prevFocused !== null) prevFocused.blur();
}

/**
 * Main EZ Navigation function: Moves selector up or down selectedElsements, and calls all relevant functions (speech,
 * tooltips etc.)
 * @param move {'up'|'down'|'top'|'bottom'} Direction/position of navigation.
 * @param [options] {Object} An object that has the following entries:
 *      voice {Boolean} Whether or not to voice the speech
 *      alert {Boolean} Whether or not to play alert sound
 * skipping hidden elements, this should be disabled because it takes too much time.
 */
function ez_navigate(move, options) {

    // Save original move intention for later
    var argMove = move;

    // set up default options
    var defaults = {
        voice:      true,
        alert:      true
    };
    options = merge_options(defaults, options);


    blurPrev();

    if(move === 'down') {
        selectedEls = getNextSelection('nav');
    } else if(move === 'up') {
        selectedEls = getPrevSelection('nav');
    } else if(move === 'top') {
        selectedEls = getFirstSelection('nav');
        move = 'down';
    } else if(move === 'bottom') {
        selectedEls = getLastSelection('nav');
        move = 'up';
    } else {
        throw new Error("Parameter *move* must be 'up'|'down'|'top'|'bottom'.")
    }

    if(selectedEls.length === 0) {
        var quiet = {voice: false, alert: false};

        if(move === 'down') {
            ez_navigate('bottom', quiet);
            alertEdgeNav('bottom');
        }
        else if(move === 'up'){
            ez_navigate('top', quiet);
            alertEdgeNav('top');
        }

        pulseSelector();
        if(options.alert) sounds[AUDIO_NOACTION].feed.play();

        return;
    } else if(argMove !== 'top' && argMove !== 'bottom') {
        // Valid selection, so reset edge nav attempts
        edgeNavAttempt = 0;
    }

    // Check to make sure it's not a short, weird selection
    var allInline = true;
    for(i = 0; i < selectedEls.length; i++) {
        if(!isInlineElement(selectedEls[i], 'nav')) {
            allInline = false;
            break;
        }

    }

    if(allInline
        && selectedEls.length === 1
        && is_all_punct(selectedEls[0])) {
        ez_navigate(move);
        return;
    }

    var actionable = getActionableElement(selectedEls, 'nav');

    // Check to make sure not label
    if(actionable.tagName === 'LABEL' && orphanedLabel(actionable)) {
        ez_navigate(move);
        return;
    }

    var label = get_label(actionable);
    if(label !== null) drawSelected(selectedEls.concat([label]));
    else drawSelected(selectedEls);

    if(options.alert) sounds[getElementAudio(actionable)].feed.play();

    if(actionable !== null) actionable.focus();

    if(options.voice) voice(selectedEls, 'nav');

    _debug(selectedEls);
}

/**
 * Jump to a specific element(s)
 * @param nodArr List of nodes to select. Must be in order, adjacent + siblings
 */
function ez_jump(nodArr, source) {

    blurPrev();

	selectedEls = nodArr;

    drawSelected(selectedEls);

    var actionable = getActionableElement(selectedEls, source);

    sounds[getElementAudio(actionable)].feed.play();

    if(actionable !== null) actionable.focus();

    voice(selectedEls, 'nav');

    _debug(selectedEls);
}

/**
 * Checks if a traditional <a href="#id"> element exists to 'jump' to.
 *
 * @param obj Object to check if jump-eable from
 * @return {Element|null} Returns element to jump to, if one exists.
 */
function hrefJump(obj) {
    if(obj.tagName === "A") {
        if(obj.href.indexOf("#") !== -1) {
            var hrefBase = obj.href.substring(0, obj.href.indexOf("#"));
            if(window.location.href.indexOf("#") != -1) {
                pageBase = window.location.href.substring(0, window.location.href.indexOf("#"));
            } else {
                pageBase = window.location.href;
            }
            if(hrefBase == "" || hrefBase == pageBase) { // If from same URL base
                var jumpTo = obj.href.substring(obj.href.indexOf("#") + 1);
                var idLocation = document.getElementById(jumpTo);
                var nameLocation = document.getElementsByName(jumpTo)[0];
                if(idLocation !== null) {
                    return idLocation;
                } else if(nameLocation !== undefined) {
                    return nameLocation;
                }
            }
        }
    }
    return null;
}

/**
 * Decides what to do, if anything, when EZ Action is pressed.
 * @param nodArr Node array to 'enter' on
 * @param source {'point'|'nav'} The navigation method
 * @param userDid {'selectControl'|'changeValue'} What
 */
function ez_enter(nodArr, source, userDid) {

	var obj = getActionableElement(nodArr, source);

    var sound = AUDIO_NOACTION;
    var spoken = "";
    var clicked = true;
    var repeat = false;

    /*
     * ACTION
     */

    // Check for possible jump
    var jumpTo = hrefJump(obj);


    if(jumpTo !== null) {
        ez_jump([jumpTo], source);
        clicked = false;
        nodArr = [jumpTo];
        sound = AUDIO_SELECT;
    } else if(getClick(obj) !== null) {
		obj.click();
        sound = AUDIO_SELECT;
	} else if(isInteractive(obj)) {
        // TODO: Basis for clicking interactive elements prompts
		obj.click();
		if(obj.checked) {
			sounds[AUDIO_SELECT].feed.play();
		} else {
			sounds[AUDIO_DESELECT].feed.play();
		}
		voice(obj);
	} else if(obj.tagName == 'INPUT' && (obj.type == 'submit' || obj.type == 'image')) {
		obj.click();
	} else {
        pulseSelector();
        clicked = false;
        repeat = true;
	}

    /*
     * AUDIO ICON
     */
    sounds[sound].feed.play();

    /*
     * VOICE
     */
    if(clicked) {
        spoken = getValueSubstring(obj, "action");
        voice(spoken, {source: source});
    } else {
        voice(nodArr, {source: source, repeat: repeat});
    }
}

/**
 * Uses CSS3 effects to 'pulse' thhe ezSelectorId element.
 */
function pulseSelector() {
    document.getElementById(ezSelectorId).className = 'pulse';
    setTimeout(function () {
        document.getElementById(ezSelectorId).className = '';
    }, 300);
}

/**
 * Handles multi-key events, such as shift+tab
 * @param {event} e Key event passed to be evaluated.
 * @returns {boolean} If false, overrides default action.
 */
function multikey_event(e) {
	e = e || event; //to deal with IE
	map[e.keyCode] = !!(e.type == 'keydown');
	if(map[KB_TAB] && map[KB_SHIFT] && tabNav != 'none') { //SHIFT+TAB
		if(tinyOpen) {
            if(tinyOpen && helpObj !== null) {
                ez_help_goto_section(-1);
            } else {
                closeTiny(true);
            }
		} else if(ez_navigateToggle) {
			ez_navigate('up');
			//window.scroll(0,findPos(selectedEls));
		} else {
			ez_navigate_start(false, 'nav');
		}
		return false; // Overwrite default browser functionality
	} else if(map[KB_TAB] && tabNav != 'none') { //TAB
		if(tinyOpen) {
            if(tinyOpen && helpObj !== null) {
                ez_help_goto_section(1);
            } else {
                closeTiny(true);
            }
		}else if(ez_navigateToggle) {
			ez_navigate('down');
			//window.scroll(0,findPos(selectedEls));
		} else {
			ez_navigate_start(false, 'nav');
		}
		return false;
	}
	return true;
}

/**
 * Sets autoadvancing timer.
 */
function auto_advance_set() {
	// If this is a new element to start autoadvancing, set the timer
	if(find_parent_attr(selectedEls, 'data-ez-autoadvance') !== undefined) {
		if(find_parent_attr(selectedElsements[currIndex - 1], 'data-ez-autoadvance') === undefined) {
			autoAdvance = find_parent_attr(selectedEls, 'data-ez-autoadvance');
			autoAdvance = parseInt(autoAdvance);
			if(autoAdvance < 100) {
				console.log("Please choose a autoadvance pause of 100 ms or greater.");
				autoAdvance = 100;
			}
			auto_advance_decide();
		}
	}
}

/**
 * Handles autoadvancing, and stopping autoadvancing if runs into end.
 */
function auto_advance_decide() {
	window.clearInterval(autoAdvTimer);
	if(autoAdvance !== 0) {
		autoAdvTimer = setInterval(function () {
			ez_navigate('down');
			if(currIndex >= findFocusable('last')) {
				autoAdvance = 0;
				window.clearInterval(autoAdvTimer);
			}
			if(find_parent_attr(selectedEls, 'data-ez-autoadvance') === undefined) {
				autoAdvance = 0;
				window.clearInterval(autoAdvTimer);
			}
		}, autoAdvance);
	}
}

/**
 * Smooth Scrolling
 * http://www.itnewb.com/tutorial/Creating-the-Smooth-Scroll-Effect-with-JavaScript
 * @returns {number} Where to scroll to
 */
function currentYPosition() {
	// Firefox, Chrome, Opera, Safari
	if(self.pageYOffset) return self.pageYOffset;
	// Internet Explorer 6 - standards mode
	if(document.documentElement && document.documentElement.scrollTop)
		return document.documentElement.scrollTop;
	// Internet Explorer 6, 7 and 8
	if(document.body.scrollTop) return document.body.scrollTop;
	return 0;
}

/**
 * Does the smooth scrolling + slow advancing
 * @param stopY Where to stop the incremental scrolling
 */
function smoothScroll(stopY) {
	var startY = currentYPosition();
	var distance = stopY > startY ? stopY - startY : startY - stopY;
	if(distance < 100) {
		scrollTo(0, stopY);
		return;
	}
	var speed = Math.round(distance / 100);
	if(speed >= 20) speed = 20;
	var step = Math.round(distance / 200);
	var leapY = stopY > startY ? startY + step : startY - step;
	var timer = 0;
	if(stopY > startY) {
		for(i = startY; i < stopY; i += step) {
			setTimeout("window.scrollTo(0, " + leapY + ")", timer * speed);
			leapY += step;
			if(leapY > stopY) leapY = stopY;
			timer++;
		}
		return;
	}
	for(i = startY; i > stopY; i -= step) {
		setTimeout("window.scrollTo(0, " + leapY + ")", timer * speed);
		leapY -= step;
		if(leapY < stopY) leapY = stopY;
		timer++;
	}
}