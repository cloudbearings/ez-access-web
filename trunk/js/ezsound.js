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
 |  FILE            ezsound.js
 |  DESCRIPTION     This file contains the EZ Sound audio icons, which includes determining the sound file to play
 |                  (given the DOM node), loading the HTML5 audio, and playing it.
 *--------------------------------------------------------------------------------------------------------------------*/


/**
 * Volume of the audio elements (0-100)
 */
var audioVolume;
if (sessionStorage.getItem("EZ_Volume") !== null) {
    audioVolume = parseInt(sessionStorage.getItem("EZ_Volume"));
} else {
    audioVolume = 100;
}

/**
 * AUDIO CONSTANTS finder function
 * loads all audio files into cache
 */
function load_audio() {
    var i;
    for (i = 0; i < sounds.length; i++) {
        sounds[i].feed = new Audio(chrome.extension.getURL(sounds[i].src));
    }
}

/**
 *  AUDIO CONSTANTS
 * These usually shouldn't be changed (cached indexes): just change
 * the URL for the audio name in the settings.js file.
 */
var AUDIO_ACTION = find_audio('action');
var AUDIO_ACTION_NONE = find_audio('action-none');
var AUDIO_ACTION_CHECK = find_audio('action-check');
var AUDIO_ACTION_UNCHECK = find_audio('action-uncheck');

var AUDIO_NAV_INTERACTIVE = find_audio('nav-interactive');
var AUDIO_NAV_MOVE = find_audio('nav-move');
var AUDIO_NAV_CHECKED = find_audio('nav-checked');
var AUDIO_NAV_UNCHECKED = find_audio('nav-unchecked');

var AUDIO_PAGECHANGE = find_audio('pagechange');
var AUDIO_ALERT = find_audio('alert');

/**
 * Searches sounds array of objects for name of sound
 * @param audio_name Name of the audio file to search in object for
 * @return {number} Position in sounds[].name array
 */
function find_audio(audio_name) {
    for (var i = 0; i < sounds.length; i++) {
        if (audio_name === sounds[i].name) {
            return i;
        }
    }
    _debug('No audio file named "' + audio_name + '" found (below error for more info).');
    return -1;
}

/**
 * Sets to volume of all audio feeds.
 */
function set_volume() {
    for (var i = 0; i < sounds.length; i++) {
        sounds[i].feed.volume = audioVolume / 100;
    }
}

/**
 * Plays an appropriate sound effect. The sound effect can be defined either
 * by passing a keyword or the element/nodes for which a sound effect is
 * needed (e.g., on navigation or pointing).
 * @author J. Bern Jordan
 * @param {string|object} arg If a string, then it must be an AUDIO_* constant
 * value or a name/keyword that is in sounds[], which is defined by a JSON file.
 * If an object, it must be a DOM Element or other node.
 * @return {boolean} Whether a sound effect was played.
 *
 * NOTE: This function needs QA checking yet.
 */
function playSFX(arg, source) {
    'use strict';
    /** The default sound effect if a better one is not found */
    var DEFAULT_SOUND = AUDIO_NAV_MOVE;
    /** The reference to the sound effect in sounds[] */
    var sfxRef;

    //Check if arguments are undefined
    if (arg === undefined) {
        _debug('Undefined arg in playSFX(arg).');
        return false;
    }
    if (source === undefined) {
        source = 'nav'
    }

    //TODO: Or should this return false?
    if (arg === null) {
        sfxRef = DEFAULT_SOUND;
    }

    //If argument is a number, play the file (via index) in sounds[]
    if (typeof arg === 'number' || arg instanceof Number) {
        sfxRef = arg;
    }

    else if (true) { //TODO check if DOM element or text node or collect of some type...
        var type = getType(arg);
        if (!isInteractive(arg)) {
            sfxRef = AUDIO_NAV_MOVE;
        } else if (type === 'checkbox' || type === 'radio') {
            //example of value-dependent SFX
            var val = getValue(arg);
            if (val === true) {
                sfxRef = AUDIO_NAV_CHECKED;
            } else if (val === false) {
                sfxRef = AUDIO_NAV_UNCHECKED;
            } else {
                sfxRef = AUDIO_NAV_INTERACTIVE;
            }
        } else {
            sfxRef = AUDIO_NAV_INTERACTIVE;
        }

        if (isElement(arg)) {
            //Override above if there are data-ez-sfx* attributes
            if (arg.hasAttribute('data-ez-sfx')) {
                sfxRef = arg.getAttribute('data-ez-sfx');
                if (sfxRev < 0) {
                    sfxRef = DEFAULT_SOUND;
                    _debug('data-ez-sfx=' + arg.getAttribute('data-ez-sfx') +
                        ' not found in sounds[]');
                }
            }
            if (source === 'nav' && arg.hasAttribute('data-ez-sfx-nav')) {
                sfxRef = arg.getAttribute('data-ez-sfx-nav');
                if (sfxRev < 0) {
                    sfxRef = DEFAULT_SOUND;
                    _debug('data-ez-sfx-nav='
                        + arg.getAttribute('data-ez-sfx-nav') +
                        ' not found in sounds[]');
                }
            }
            if (source === 'point' && arg.hasAttribute('data-ez-sfx-point')) {
                sfxRef = arg.getAttribute('data-ez-sfx-point');
                if (sfxRev < 0) {
                    sfxRef = DEFAULT_SOUND;
                    _debug('data-ez-sfx-point='
                        + arg.getAttribute('data-ez-sfx-point') +
                        ' not found in sounds[]');
                }
            }
        }
    } else {
        return false;
    }

    //Play the sound
    sounds[sfxRef].feed.play();
    return true;
}