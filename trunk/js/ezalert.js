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

    TINYALERT.box.show('<p>' + str + '</p>', 0, 400, 0, 0);

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