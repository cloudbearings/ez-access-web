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
 |  FILE            ezalert.js
 |  DESCRIPTION     This file contains the driver for the EZ Alert module of the EZ Access plugin, including
 |                  pushing contents of the lightbox, invoking the lightbox, and navigation through it.
 |                  Additionally, this file contains the idle speech related functions.
 |                  Lightbox-general code for EZ Alert is found in "eztinyalert.js".
 *--------------------------------------------------------------------------------------------------------------------*/


/**
 * If the alert lightbox is currently opened.
 * @type {boolean}
 */
var tinyAlertOpen = false;

/**
 * Keeps track of the idle timer (to overwrite, modify, remove etc)
 */
var timeoutIdleTimer;

/**
 * By default, display the following text in the alert.
 * @type {string}
 */
var idleSpeech = "If you have difficulty using the touchscreen, press the blue, diamond-shaped EZ Help button";

/**
 * By default, never go off.
 * @type {number}
 */
var idleDelay = -1;

/**
 * By default, if not specified, go off after 20 seconds.
 * @type {number}
 */
var idleDelayAfter = 20000;

/**
 * Location to redirect user to
 * @type {string}
 */
var idleTimeoutHref = '';

/**
 * If user interaction has been found. Global variable is proprietary for timeout.
 * @type {boolean}
 */
var noUserInteraction = true;

/**
 * The alert to open and speak
 * @param str The string to alert and read
 * @param [options] {Object} Various optional configurations:
 *      source
 *      callback:   Called after speech is completed from alert.
 *                  NOT GUARANTEED to be called (if speech interrupted)
 *                  If === 'timeout' then call idle_loop_after_speech()
 */
function newAlert(str, options) {

    // set up default options
    var defaults = {
        source: 'nav',
        callback: ''
    };
    options = merge_options(defaults, options);

    playSFX(AUDIO_ACTION_NONE);

    voice(str, {onTTSDone: options.callback});

    if (tinyHelpOpen) closeTinyHelp(options.source);

    TINYALERT.box.show('<p style="text-align:center">' + str + '</p>', 0, 400, 0, 0);

    tinyAlertOpen = true;

}

/**
 * Closes the modal and plays a sound effect. Cleans up variables.
 * @param source {'nav'|'point'} Navigation method
 */
function closeAlert(source) {

    TINYALERT.box.hide();
    playSFX(AUDIO_NAV_MOVE, source);
    tinyAlertOpen = false;

}


/**
 * Alerts EZ Access idle loop lightbox asking user if still there.
 */
function idle_loop() {
    timeoutIdleTimer = clearTimeout(timeoutIdleTimer);
    if (idleDelay >= 0) {
        timeoutIdleTimer = setTimeout(function () {
            newAlert(idleSpeech, {callback: 'timeout'});
            noUserInteraction = true;
        }, idleDelay);
    }
}

/**
 * Is called after the speech loop is done called from idle_loop to redirect the user somewhere.
 */
function idle_loop_after_speech() {
    timeoutIdleTimer = clearTimeout(timeoutIdleTimer);
    if (noUserInteraction && idleDelayAfter >= 0) {
        timeoutIdleTimer = setTimeout(function () {
            window.location.href = idleTimeoutHref;
        }, idleDelayAfter);
    }
}