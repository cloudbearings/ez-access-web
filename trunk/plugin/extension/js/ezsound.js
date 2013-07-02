/**
 * Volume of the audio elements (0-100)
 */
var audioValume;
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
	console.log('No audio file named "' + audio_name + '" found (below error for more info).'); // Debugging
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
	for(var tmp = ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'li'], i = 0; i < tmp.length; i++) {
		// To simplify comparing to a whole lot of possibilities, use a loop
		if(getClick(obj) !== undefined || obj.tagName == 'INPUT') {
			return AUDIO_BUTTON;
		}
		if(obj.tagName == tmp[i].toUpperCase()) {
			return AUDIO_MOVE;
		}
	}
	console.log('No specific sound for "' + obj.tagName + '" HTML tag.');
	return AUDIO_MOVE;
}