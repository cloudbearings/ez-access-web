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
 |  FILE            options.js
 |  DESCRIPTION     This file contains the javascript controlling the extension's options page, as well as storing
 |                  the settings (HTML5 localstorage).
 *--------------------------------------------------------------------------------------------------------------------*/


var defaultNavigate = "some";

document.addEventListener('DOMContentLoaded', function () {
    loadOptions();
    document.getElementById("save").onclick = function () {
        saveOptions();
    };
    document.getElementById("reset").onclick = function () {
        eraseOptions();
    };
});
var checkssml;
function loadOptions() {
    if (localStorage['ssml'] === undefined) {
        if (navigator.userAgent.indexOf('Mac OS X') !== -1) {
            localStorage.ssml = "false";
        } else {
            localStorage.ssml = "true";
        }
    }
    if (localStorage['ssml'] === undefined) {
        localStorage.debug = "false";
    }
    var ezHighlightColor = localStorage["ezHighlightColor"];
    var colorSelector = document.getElementById('highlightColor');
    checkssml = document.getElementById('checkssml');
    checkdebug = document.getElementById('checkdebug');
    // valid colors are red, blue, green and yellow
    if (ezHighlightColor == undefined) {
        ezHighlightColor = colorSelector.value;
        localStorage["ezHighlightColor"] = ezHighlightColor;
    }

    colorSelector.value = ezHighlightColor;

    var navigate = localStorage["ezNavigate"];
    var ssml = localStorage["ssml"];
    var debug = localStorage["debug"];
    var navSome = document.getElementById('some');
    var navAll = document.getElementById('all');
    if (navigate == 'all') {
        navSome.checked = false;
        navAll.checked = true;
    } else if (navigate == 'some') {
        navSome.checked = true;
        navAll.checked = false;
    } else {
        localStorage["ezNavigate"] = 'some';
    }
    if (ssml === 'true') checkssml.checked = true;
    else checkssml.checked = false;

    if (debug === 'true') checkdebug.checked = true;
    else checkdebug.checked = false;
}

function saveOptions() {
    var colorSelector = document.getElementById('highlightColor');
    localStorage["ezHighlightColor"] = colorSelector.value;
    localStorage["ssml"] = checkssml.checked;
    localStorage["debug"] = checkdebug.checked;
    var navSome = document.getElementById('some');
    var navAll = document.getElementById('all');
    if (navSome.checked) {
        localStorage["ezNavigate"] = 'some';
    } else if (navAll.checked) {
        localStorage["ezNavigate"] = 'all';
    }
}

function eraseOptions() {
    localStorage.removeItem("ezHighlightColor");
    localStorage.removeItem("ezNavigate");

    if (navigator.userAgent.indexOf('Mac OS X') !== -1) {
        localStorage.ssml = "false";
    } else {
        localStorage.ssml = "true";
    }

    localStorage["debug"] = 'false';
    location.reload();
}