/**
 * Volume of the audio elements (0-100)
 */
var audioVolume;
if(sessionStorage.getItem("EZ_Volume") !== null) {
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
	for(i = 0; i < sounds.length; i++) {
		sounds[i].feed = new Audio(chrome.extension.getURL(sounds[i].src));
	}
}

/**
 *  AUDIO CONSTANTS
 * These usually shouldn't be changed (cached indexes): just change
 * the URL for the audio name in the settings.json file.
 */
var AUDIO_MOVE = find_audio('move');
var AUDIO_SELECT = find_audio('select');
var AUDIO_DESELECT = find_audio('deselect');
var AUDIO_NOACTION = find_audio('noaction');
var AUDIO_BUTTON = find_audio('button');

/**
 * Searches sounds array of objects for name of sound
 * @param audio_name Name of the audio file to search in object for
 * @return {number} Position in sounds[].name array
 */
function find_audio(audio_name) {
	for(var i = 0; i < sounds.length; i++) {
		if(audio_name === sounds[i].name) {
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
	for(var i = 0; i < sounds.length; i++) {
		sounds[i].feed.volume = audioVolume / 100;
	}
}

/**
 * Indexes sounds for specific tags from JSON setup file.
 * @returns {number} The audio ID.
 */
function getElementAudio(obj) {

    if(obj === null) return AUDIO_MOVE;

	for(var tmp = ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'li'], i = 0; i < tmp.length; i++) {
		// To simplify comparing to a whole lot of possibilities, use a loop
		if(getClick(obj) !== undefined || obj.tagName == 'INPUT') {
			return AUDIO_BUTTON;
		}
		if(obj.tagName == tmp[i].toUpperCase()) {
			return AUDIO_MOVE;
		}
	}
	_debug('No specific sound for "' + obj.tagName + '" HTML tag.');
	return AUDIO_MOVE;
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
	var DEFAULT_SOUND = AUDIO_MOVE;
	/** The reference to the sound effect in sounds[] */
	var sfxRef;

	//Check if arguments are undefined
	if (arg === undefined) {
		_debug('Undefined arg in playSFX(arg).');
		return false;
	}
	if(source === undefined) {
		source = 'nav'
	}

	//TODO: Or should this return false?
	if (arg === null) {
		sfxRef = DEFAULT_SOUND;
	}

	//If argument is a string, play the file in sounds[]
	if (typeof arg === 'string' || arg instanceof String) {
		sfxRef = find_audio(arg);
		if (arg.indexOf('AUDIO_') === 0) {
			sfxRef = arg;
		} else if (sfxRef < 0) { 
			//Could potentially do something else, like play a spearcon
			_debug('getSFX(arg): arg=' + arg + ' not found in sounds[]');
			return false;
		}
	}

	else if (true) { //TODO check if DOM element or text node or collect of some type...
		var type = getType(arg);
		if (!isInteractive(arg)) {
			sfxRef = AUDIO_MOVE;
		} else if (type === 'checkbox' || type === 'radio') { 
			//example of value-dependendent SFX
			if (getValue(arg) === 'checked') {
				sfxRef = AUDIO_BUTTON; //TODO: AUDIO_CHECKED
			} else {
				sfxRef = AUDIO_BUTTON; //TODO: AUDIO_UNCHECKED
			}
		} else {
			sfxRef = AUDIO_BUTTON;
		}

        if(isElement(arg)) {
            //Override above if there are data-ez-sfx* attributes
            if (arg.hasAttribute('data-ez-sfx')) {
                sfxRef = arg.getAttribute('data-ez-sfx');
                if (sfxRev < 0) {
                    sfxRef = DEFAULT_SOUND;
                    _debug('data-ez-sfx=' + arg.getAttribute('data-ez-sfx') +
                    ' not found in sounds[]');
                }
            }
            if (source ==='nav' && arg.hasAttribute('data-ez-sfx-nav')) {
                sfxRef = arg.getAttribute('data-ez-sfx-nav');
                if (sfxRev < 0) {
                    sfxRef = DEFAULT_SOUND;
                    _debug('data-ez-sfx-nav='
                    + arg.getAttribute('data-ez-sfx-nav') +
                    ' not found in sounds[]');
                }
            }
            if (source ==='point' && arg.hasAttribute('data-ez-sfx-point')) {
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