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
 |  FILE            background.js
 |  DESCRIPTION     This file contains the background file for the Chrome extension, including variables
 |                  that need to be stored permanently such as EZ Access options.
 *--------------------------------------------------------------------------------------------------------------------*/


// If not initialized
if (localStorage.ezHighlightColor === undefined) {
    localStorage.ezHighlightColor = "#0000FF";
}
if (localStorage.ezNavigate === undefined) {
    localStorage.ezNavigate = "some";
}
if (localStorage.ssml === undefined) {
    // Disable for Macs only
    if (navigator.userAgent.indexOf('Mac OS X') !== -1) {
        localStorage.ssml = "false";
    } else {
        localStorage.ssml = "true";
    }
}
if (localStorage.debug === undefined) {
    localStorage.debug = "false";
}

// SETTINGS STORAGE
chrome.extension.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.localstorage == "ezNavigate") {
            sendResponse({
                ezNavigate: localStorage.ezNavigate
            });
        } else if (request.localstorage == "ezHighlightColor") {
            sendResponse({
                ezHighlightColor: localStorage.ezHighlightColor
            });
        } else if (request.localstorage == "ssml") {
            sendResponse({
                ssml: localStorage.ssml
            });
        } else if (request.localstorage == "debug") {
            sendResponse({
                debug: localStorage.debug
            });
        } else if (request.tts !== undefined) {
            chrome.tabs.getSelected(null, function (tab) {
                sessionStorage.setItem("tabid", tab.id);
            });
            chrome.tts.speak(request.tts, {
                'volume': parseFloat(request.volume),
                'enqueue': request.enqueue,
                requiredEventTypes: ['end'],
                onEvent: function (event) {
                    if (event.type === 'end') {
                        chrome.tabs.sendMessage(parseFloat(sessionStorage.getItem("tabid")), {
                            ezTtsState: 'done',
                            onTTSDone: request.onTTSDone
                        }, function (response) {
                        });
                    }
                }
            });
        } else if (request.stop == "true") {
            chrome.tts.stop();
        } else if (request.ezShow == "true") {
            chrome.pageAction.show(sender.tab.id);
        } else {
            sendResponse({}); // snub them.
        }
    });

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (parseFloat(sessionStorage.getItem("tabid")) == tabId) {
        chrome.tts.stop();
    }
});