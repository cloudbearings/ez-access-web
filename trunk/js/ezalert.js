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
 * TODO Not currently b/c of debugging + development
 * @param {boolean} display If false, start timer for idle loop. Otherwise, display lightbox + reset.
 */
function idle_loop(display) {
    if (!display) {
        if (alerts.idle.wait != -1) {
            idleLoop = self.setInterval(function () {
                idle_loop(true)
            }, alerts.idle.wait);
        }
    } else {
        if (!tinyHelpOpen && !ez_navigateToggle) {
            idleLoop = self.clearInterval(idleLoop);
            tinyHelpOpen = true;
            ez_help(alerts.idle.value);
        }
    }
}