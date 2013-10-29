/*----------------------------------------------------------------------------------------------------------------------
 |  COPYRIGHT       (c) 2012 - 2013 Trace Research and Development Center,
 |                  The Board of Regents of the University of Wisconsin System.
 |                  All rights reserved.
 |
 |  LICENSE         New BSD License
 |
 |  CODE            Alexander Harding and Bern Jordan
 |  SPECIFICATIONS  Bern Jordan
 |
 |  FILE            eznav.js
 |  DESCRIPTION     This file contains the EZ Navigation (not EZ point/slidetoread), which includes key listeners
 |                  and invoking "ezaccess.js" to find the next/previous element(s), among other things.
 *--------------------------------------------------------------------------------------------------------------------*/


/**
 * Tab keycodes
 */
var KB_TAB = 9;
var KB_SHIFT = 16;
var KB_ENTER = 13;
var KB_F2 = 113;
var KB_PGUP = 33; // page up
var KB_PGDOWN = 34; // page down

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
 * The user gets one free attempt (therefore -1) so they know that they reached the end.
 * @type {number}
 */
var edgeNavAttempt = -1;

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
 * Whether EZ back is enabled for changing to previous page
 * @type {boolean}
 */
var ezBackEnabled = false;

/**
 * Global idle loop timer if no user action is taken
 */
var idleLoop;

/**
 * On key up/down timer (to keep track of when to allow keypress)
 * @type {Number}
 */
var onKeyHelp;

/**
 * If the EZ Help button was just pressed
 * @type {boolean}
 */
var helpJustPressed = false;

// If autoadvance is enabled or not
// Also autoadvance timer is global to disable from other functions
var autoAdvance = 0;
var autoAdvTimer;

/**
 * Handles kev on *released* events for EZ Access (except for multi-key, like tab+shift handled by multikey_event)
 * @param {event} e Event object passed from set up on EZ Access startup.
 * @returns {boolean} If false, disables default key action.
 */
function key_up_event(e) {
    if (e.keyCode == EZ_KEY_HELP || e.keyCode == KB_F2) {

        if (!tinyHelpOpen && !helpJustPressed) {
            ez_help(getActionableElement(selectedEls, 'nav'));
            playSFX(AUDIO_NAV_MOVE, 'nav');
        }
        return false;
    }
    return true;
}

/**
 * If action is found on page, do this to prevent moving the user.
 */
function resetTimeouts() {
    idle_loop();
    idleVoiceLoop(false);
    noUserInteraction = false;
}

/**
 * Handles key on *pressed* events for EZ Access (except for multi-key, like tab+shift handled by multikey_event)
 * @param {event} e Event object passed from set up on EZ Access startup.
 * @returns {boolean} If false, disables default key action.
 */
function key_down_event(e) {
    resetTimeouts();

    // 'if' keycode statements
    if (e.keyCode == EZ_KEY_HELP || e.keyCode == KB_F2) {
        if (tinyHelpOpen) {
            closeTinyHelp('nav');
            helpJustPressed = true;
            onKeyHelp = setTimeout(function () {
                helpJustPressed = false
            }, 1000);
            playSFX(AUDIO_NAV_MOVE, 'nav');
        } else {
            window.clearTimeout(onKeyHelp);
            helpJustPressed = false;
        }
    } else if (e.keyCode == EZ_KEY_UP) {
        if (tinyHelpOpen) {
            if (tinyHelpOpen && helpObj !== null) {
                ez_help_goto_section(-1);
            } else {
                closeTinyHelp('nav');
            }
        } else {
            if (ez_navigateToggle) {
                ez_navigate('up');
            } else {
                ez_navigate_start(false, 'nav');
            }
        }
    } else if (e.keyCode == EZ_KEY_DOWN) {
        if (tinyHelpOpen) {
            if (tinyHelpOpen && helpObj !== null) {
                ez_help_goto_section(1);
            } else {
                closeTinyHelp('nav');
            }
        } else {
            if (ez_navigateToggle) {
                ez_navigate('down');
            } else {
                ez_navigate_start(false, 'nav');
            }
        }
    } else if (e.keyCode == EZ_KEY_BACK || e.keyCode == KB_PGUP) {
        // TODO
        if (tinyHelpOpen) {
            closeTinyHelp('nav');
        } else {
            var el = getKeyBinding('back');
            if (el === null) {
                if(ezBackEnabled) {
                    window.history.back();
                }
            } else {
                el.click();
            }
        }
    } else if (e.keyCode === EZ_KEY_NEXT || e.keyCode === KB_PGDOWN) {
        if (tinyHelpOpen) {
            closeTinyHelp('nav');
        } else {
            var el = getKeyBinding('next');
            if (el !== null) {
                el.click();
            }
        }
    } else if (e.keyCode == EZ_KEY_ENTER || e.keyCode == KB_ENTER) {
        if (tinyAlertOpen) closeAlert('nav');
        if (tinyHelpOpen) {
            playSFX(AUDIO_ACTION_NONE, 'nav');
            tinyContent = document.getElementById('tinycontent');
            voice([tinyContent], {repeat: true});
        } else {
            if (ez_navigateToggle) {
                ez_enter(selectedEls, 'nav');
            }
            return false; // Disable any browser actions
        }
    } else if (e.keyCode == EZ_KEY_SKIPFORWARD) {
        var el = getKeyBinding('skipforward');
        if (el !== null) {
            el.click();
        } else if (selectedEls.type == 'range') {
            selectedEls.value = parseFloat(selectedEls.value) + parseFloat(selectedEls.step);
            playSFX(AUDIO_NAV_MOVE, 'nav');
            voice(selectedEls.value);
        } else if (selectedEls.tagName == 'SELECT') {
            if (selectedEls.selectedIndex < selectedEls.length - 1) {
                selectedEls.selectedIndex++;
                playSFX(AUDIO_NAV_MOVE, 'nav');
                voice(selectedEls.value + '... option ' + (selectedEls.selectedIndex + 1) + ' of ' + selectedEls.length);
            } else {
                document.getElementById(ezSelectorId).className = 'pulse';
                setTimeout(function () {
                    document.getElementById(ezSelectorId).className = '';
                }, 300);
                playSFX(AUDIO_ACTION_NONE, 'nav');
            }
        } else {
            changeVolume('up');
        }
    } else if (e.keyCode == EZ_KEY_SKIPBACKWARD) {
        var el = getKeyBinding('skipbackward');
        if (el !== null) {
            el.click();
        } else if (selectedEls.type == 'range') {
            selectedEls.value = parseFloat(selectedEls.value) - parseFloat(selectedEls.step);
            playSFX(AUDIO_NAV_MOVE, 'nav');
            voice(selectedEls.value);
        } else if (selectedEls.tagName == 'SELECT') {
            if (selectedEls.selectedIndex > 0) {
                selectedEls.selectedIndex--;
                playSFX(AUDIO_NAV_MOVE, 'nav');
                voice(selectedEls.value + '... option ' + (selectedEls.selectedIndex + 1) + ' of ' + selectedEls.length);
            } else {
                document.getElementById(ezSelectorId).className = 'pulse';
                setTimeout(function () {
                    document.getElementById(ezSelectorId).className = '';
                }, 300);
                playSFX(AUDIO_ACTION_NONE, 'nav');
            }
        } else {
            changeVolume('down');
        }
    } else if (selectedEls.type == 'textarea' || selectedEls.type == 'text') {
        var key = String.fromCharCode(e.keyCode);
        if (!key.match(/[^A-Za-z0-9\-_]/)) voice(key);
    } else if(e.keyCode !== KB_SHIFT && e.keyCode !== KB_TAB) { // Not tab and/or shift (which navs as well)
        if(tinyHelpOpen) {
            closeTinyHelp('nav');
        }
    }
    return true;
}

/**
 * Changes the volume of the system one step and notifies the user in speech.
 * @param {'up'|'down'} direction The direction in which the volume is
 * supposed to be changed : 'up' increments/increases the volume,
 *                          'down' decrements/decreases the volume.
 * @throws {TypeError} If an invalid direction is passed.
 */
function changeVolume(direction) {
    'use strict';
    var VOL_STEP_SIZE = 10;
    var VOL_MAX = 100;
    var VOL_MIN = 10; //do not allow the volume to be completely turned off
    var message;

    if (direction === 'down') {
        if (audioVolume >= VOL_MIN + VOL_STEP_SIZE) {
            sessionStorage.setItem("EZ_Volume", audioVolume);
            audioVolume -= VOL_STEP_SIZE;
            set_volume();
            playSFX(AUDIO_NAV_MOVE, 'nav');
            message = 'Quieter';
        } else {
            document.getElementById(ezSelectorId).className = 'pulse';
            setTimeout(function () {
                document.getElementById(ezSelectorId).className = '';
            }, 300);
            playSFX(AUDIO_ACTION_NONE, 'nav');
            message = 'Quietest volume';
        }
        voice(message);
    } else if (direction === 'up') {
        if (audioVolume <= VOL_MAX - VOL_STEP_SIZE) {
            audioVolume += VOL_STEP_SIZE;
            sessionStorage.setItem("EZ_Volume", audioVolume);
            set_volume();
            playSFX(AUDIO_NAV_MOVE, 'nav');
            message = 'Louder';
        } else {
            document.getElementById(ezSelectorId).className = 'pulse';
            setTimeout(function () {
                document.getElementById(ezSelectorId).className = '';
            }, 300);
            playSFX(AUDIO_ACTION_NONE, 'nav');
            message = 'Loudest volume';
        }
        voice(message);
    } else {
        throw new TypeError('Illegal direction="' + direction +'" passed to changeVolume().');
    }
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

    var SUPPORTED_KEY_NAMES = ['back', 'next', 'skipforward', 'skipbackward'];

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

    if (nods.length === 0) return null;

    // Nv'd inside an element's text
    if (nods.length === 1 && nods[0].nodeType === 3) {
        return nods[0].parentElement;
    }

    // Get the element if multiple nodes and one element are navagable.
    var els = 0;
    var lastEl;
    for (i = 0; i < nods.length; i++) {
        if (isElement(nods[i])) {
            els++;
            lastEl = nods[i];
        }
    }
    if (els === 1) {
        return lastEl;
    }
    if (isElement(nods[0])) return nods[0];
    else return nods[0].parentElement;
}

/**
 * Blurs the previous actionable element, if one exists
 */
function blurPrev() {
    // Blur previously selected element
    var prevFocused = getActionableElement(selectedEls, 'nav');
    if (prevFocused !== null) prevFocused.blur();
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
        voice: true,
        alert: true
    };
    options = merge_options(defaults, options);


    blurPrev();

    if (move === 'down') {
        selectedEls = getNextSelection('nav');
    } else if (move === 'up') {
        selectedEls = getPrevSelection('nav');
    } else if (move === 'top') {
        selectedEls = getFirstSelection('nav');
        move = 'down';
    } else if (move === 'bottom') {
        selectedEls = getLastSelection('nav');
        move = 'up';
    } else {
        throw new Error("Parameter *move* must be 'up'|'down'|'top'|'bottom'.")
    }

    if (selectedEls.length === 0) {
        var quiet = {voice: false, alert: false};

        if (move === 'down') {
            ez_navigate('bottom', quiet);
            alertEdgeNav('bottom');
            if (edgeNavAttempt === 0) {
                ez_navigate('bottom');
            } else {
                ez_navigate('bottom', quiet);
            }
        }
        else if (move === 'up') {
            ez_navigate('top', quiet);
            alertEdgeNav('top');
            if (edgeNavAttempt === 0) {
                ez_navigate('top');
            } else {
                ez_navigate('top', quiet);
            }
        }

        pulseSelector();
        if (options.alert) playSFX(AUDIO_ACTION_NONE, 'nav');

        return;
    } else if (argMove !== 'top' && argMove !== 'bottom') {
        // Valid selection, so reset edge nav attempts
        edgeNavAttempt = -1;
        if (tinyAlertOpen) closeAlert('nav');
    }

    // Check to make sure it's not a short, weird selection
    var allInline = true;
    for (i = 0; i < selectedEls.length; i++) {
        if (!isInlineElement(selectedEls[i], 'nav')) {
            allInline = false;
            break;
        }

    }

    if (allInline
        && selectedEls.length === 1
        && is_all_punct(selectedEls[0])) {
        ez_navigate(move);
        return;
    }

    // If there is just text, and parent can group it (sole child)
    if(selectedEls.length === 1
        && selectedEls[0].nodeType === 3
        && selectedEls[0].parentElement.childNodes.length === 1) {
        selectedEls[0] = selectedEls[0].parentElement;
    }

    var actionable = getActionableElement(selectedEls, 'nav');

    // Check to make sure not label
    if (actionable.tagName === 'LABEL' && orphanedLabel(actionable)) {
        ez_navigate(move);
        return;
    }

    var label = get_label(actionable);
    if (label !== null) drawSelected(selectedEls.concat([label]));
    else drawSelected(selectedEls);

    if (options.alert) playSFX(actionable, 'nav');

    if (actionable !== null) actionable.focus();

    if (options.voice) voice(selectedEls, {source: 'nav'});

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

    playSFX(actionable, 'nav');

    if (actionable !== null) actionable.focus();

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
    if (obj.tagName === "A") {
        if (obj.href.indexOf("#") !== -1) {
            var hrefBase = obj.href.substring(0, obj.href.indexOf("#"));
            if (window.location.href.indexOf("#") != -1) {
                pageBase = window.location.href.substring(0, window.location.href.indexOf("#"));
            } else {
                pageBase = window.location.href;
            }
            if (hrefBase == "" || hrefBase == pageBase) { // If from same URL base
                var jumpTo = obj.href.substring(obj.href.indexOf("#") + 1);
                var idLocation = document.getElementById(jumpTo);
                var nameLocation = document.getElementsByName(jumpTo)[0];
                if (idLocation !== null) {
                    return idLocation;
                } else if (nameLocation !== undefined) {
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
 * @param [userDid] {'selectControl'|'changeValue'} What the user did. Not currently used (TODO)
 */
function ez_enter(nodArr, source, userDid) {

    var obj = getActionableElement(nodArr, source);

    var type = getType(obj);

    var sound = AUDIO_ACTION_NONE;

    var playVoice = true;

    var repeat = false;

    var name = '';
    var action = '';

    /*
     * ACTION
     */

    // Check for possible jump
    var jumpTo = hrefJump(obj);

    if (jumpTo !== null) {
        // Jump to element
        ez_jump([jumpTo], source);
        nodArr = [jumpTo];
        sound = AUDIO_ACTION;
        playVoice = false;

    } else if (silentClick(obj)) {
        // Is a button or href or onclick etc.
        obj.click();
        sound = AUDIO_ACTION;
        playVoice = false;

    } else if (type === 'radio' || type === 'checkbox') {
        // Radios and checkboxes are currently supported
        obj.click();
        var val = getValue(obj);
        if (val === true) {
            sound = AUDIO_ACTION_CHECK;
        } else if (val === false) {
            sound = AUDIO_ACTION_UNCHECK;
        } else {
            sound = AUDIO_ACTION;
        }

    } else {
        // Not interactive / actionable
        pulseSelector();
        repeat = true;

    }

    /*
     * AUDIO ICON -- something is always played
     */
    playSFX(sound, 'nav');

    /*
     * VOICE
     */
    if (playVoice) {
        if (!repeat) {
            name = getName(obj, source);

            if (name === '') name = getRole(obj);

            action = getValueSubstring(obj, "action");

            voice(name + ' ' + action);
        } else {
            voice(nodArr, {source: source, repeat: true});
        }
    }
}

/**
 * Uses CSS3 effects to 'pulse' the ezSelectorId element.
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
    if (map[KB_TAB] && map[KB_SHIFT] && tabNav != 'none') { //SHIFT+TAB
        if (tinyHelpOpen) {
            if (tinyHelpOpen && helpObj !== null) {
                ez_help_goto_section(-1);
            } else {
                closeTinyHelp('nav');
            }
        } else if (ez_navigateToggle) {
            ez_navigate('up');
            //window.scroll(0,findPos(selectedEls));
        } else {
            ez_navigate_start(false, 'nav');
        }
        return false; // Overwrite default browser functionality
    } else if (map[KB_TAB] && tabNav != 'none') { //TAB
        if (tinyHelpOpen) {
            if (tinyHelpOpen && helpObj !== null) {
                ez_help_goto_section(1);
            } else {
                closeTinyHelp('nav');
            }
        } else if (ez_navigateToggle) {
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
    if (find_parent_attr(selectedEls, 'data-ez-autoadvance') !== undefined) {
        if (find_parent_attr(selectedElsements[currIndex - 1], 'data-ez-autoadvance') === undefined) {
            autoAdvance = find_parent_attr(selectedEls, 'data-ez-autoadvance');
            autoAdvance = parseInt(autoAdvance);
            if (autoAdvance < 100) {
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
    if (autoAdvance !== 0) {
        autoAdvTimer = setInterval(function () {
            ez_navigate('down');
            if (currIndex >= findFocusable('last')) {
                autoAdvance = 0;
                window.clearInterval(autoAdvTimer);
            }
            if (find_parent_attr(selectedEls, 'data-ez-autoadvance') === undefined) {
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
    if (self.pageYOffset) return self.pageYOffset;
    // Internet Explorer 6 - standards mode
    if (document.documentElement && document.documentElement.scrollTop)
        return document.documentElement.scrollTop;
    // Internet Explorer 6, 7 and 8
    if (document.body.scrollTop) return document.body.scrollTop;
    return 0;
}

/**
 * Does the smooth scrolling + slow advancing
 * @param stopY Where to stop the incremental scrolling
 */
function smoothScroll(stopY) {
    var startY = currentYPosition();
    var distance = stopY > startY ? stopY - startY : startY - stopY;
    if (distance < 100) {
        scrollTo(0, stopY);
        return;
    }
    var speed = Math.round(distance / 100);
    if (speed >= 20) speed = 20;
    var step = Math.round(distance / 200);
    var leapY = stopY > startY ? startY + step : startY - step;
    var timer = 0;
    if (stopY > startY) {
        for (i = startY; i < stopY; i += step) {
            setTimeout("window.scrollTo(0, " + leapY + ")", timer * speed);
            leapY += step;
            if (leapY > stopY) leapY = stopY;
            timer++;
        }
        return;
    }
    for (i = startY; i > stopY; i -= step) {
        setTimeout("window.scrollTo(0, " + leapY + ")", timer * speed);
        leapY -= step;
        if (leapY < stopY) leapY = stopY;
        timer++;
    }
}