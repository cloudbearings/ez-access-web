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
 * By default, diplay the following text in the alert.
 * @type {string}
 */
var idleSpeech = "If you have difficulty using the touchscreen, press the blue, diamond-shaped EZ Help button";

/**
 * By default, do not loop.
 * @type {boolean}
 */
var idleLoop = false;

/**
 * By default, never go off.
 * @type {number}
 */
var idleDelay = 0;

/**
 * The alert to open and speak
 * @param str The string to alert and read
 * @param source {'nav'|'point'} Navigation method
 */
function newAlert(str, source) {

    playSFX(AUDIO_ACTION_NONE);

    voice(str);

    if (tinyHelpOpen) closeTinyHelp(source);

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
 * @param {boolean} display If false, start timer for idle loop. Otherwise, display lightbox + reset.
 */
function idle_loop(display) {
    if (!display) {
        if (idleDelay > 0) {
            timeoutIdleTimer = clearInterval(timeoutIdleTimer);
            timeoutIdleTimer = setInterval(function () {
                idle_loop(true);
            }, idleDelay);
        }
    } else {
        if (!tinyHelpOpen && ez_navigateToggle) {
            if (!tinyAlertOpen) {
                if (!idleLoop) timeoutIdleTimer = clearInterval(timeoutIdleTimer);
                newAlert(idleSpeech, 'nav');
            } else if (idleLoop) {
                newAlert(idleSpeech, 'nav');
            }
        }
    }
}