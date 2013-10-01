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
 |  FILE            enable.js
 |  DESCRIPTION     This file contains the file that bridges between the background page(s) and the EZ Access
 |                  content page(s). It is primarily responsible for listening for requests and invoking
 |                  the relevant functions.
 *--------------------------------------------------------------------------------------------------------------------*/


var EzCustomColor;
chrome.extension.sendMessage({
    localstorage: "ezHighlightColor"
}, function (response) {
    EzCustomColor = response.ezHighlightColor;
});

chrome.extension.sendMessage({
    localstorage: "ssml"
}, function (response) {
    SSML = response.ssml === "true";
});

chrome.extension.sendMessage({
    localstorage: "debug"
}, function (response) {
    debugMode = response.debug === "true";
    _debug("Debug Mode Enabled.");
});

var ezSessionDisable = sessionStorage["ezSessionDisable"];

function checkingIfEz() {
    if (ezSessionDisable == "true") {
        chrome.extension.sendMessage({
            ezShow: "true"
        }, function (response) {
        });
    } else if (document.body.getAttribute('data-ez') !== null) {
        // The regular expression produced a match, so notify the background page.
        load_ez();
        chrome.extension.sendMessage({
            ezShow: "true"
        }, function (response) {
        });
    } else {
        // No match was found.
        chrome.extension.sendMessage({
            localstorage: "ezNavigate"
        }, function (response) {
            ezNavigate = response.ezNavigate;
            if (ezNavigate == 'all') {
                load_ez();
                chrome.extension.sendMessage({
                    ezShow: "true"
                }, function (response) {
                });
            }
        });
    }
}

setTimeout(function () {
    checkingIfEz();

    // Handle idle loop when EZ Access is disabled.
    idleVoiceLoop(false);
}, 5);

// Storing whether to disable for this session
chrome.extension.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.ezSessionDisable == "true") {
            sessionStorage["ezSessionDisable"] = "true";
            stopEZ();
            sendResponse({});
            window.location.reload();
        } else if (request.ezSessionDisable == "false") {
            sessionStorage["ezSessionDisable"] = "false";
            load_ez();
            sessionStorage.setItem("EZ_Toggle", "1");
            ez_navigateToggle = true;
            sounds[getElementAudio()].feed.play();
            drawSelected(selectElements[currIndex]);
            voice(selectElements[currIndex], 'point');
            sendResponse({});
        } else if (request.ezSessionDisable == "state") {
            var packet = String(sessionStorage["ezSessionDisable"]);
            sendResponse({
                ezSessionState: packet
            });
        } else if (request.ezHighlightDisable == "true") {
            stopEZ();
            sendResponse({});
        } else if (request.ezTtsState == "done") {
            if(request.onTTSDone === 'idleVoiceLoop') {
                if (beginIdleTimerLoop) idleVoiceLoop(false);
            } else if(request.onTTSDone === 'timeout') {
                idle_loop_after_speech();
            }
            auto_advance_decide();
        } else if (request.ezVolume !== undefined) {
            audioVolume = parseFloat(request.ezVolume);
            sessionStorage.setItem("EZ_Volume", audioVolume);
            set_volume();
            sounds[AUDIO_MOVE].feed.play();
            voice("Volume... " + audioVolume + " percent");
        } else if (request.volume == 'getter') {
            sendResponse({
                volume: audioVolume
            });
        }
    }
);