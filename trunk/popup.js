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
 |  FILE            popup.js
 |  DESCRIPTION     This file loads information for the extension's Chrome popup when clicking the extension's button
 |                  in Chrome's URL bar.
 *--------------------------------------------------------------------------------------------------------------------*/

document.addEventListener('DOMContentLoaded', function () {
    loadOptions();
});

function loadOptions() {
    var disable = document.getElementById("sessionDisable");
    disable.onclick = function () {
        doSessionDisable(true);
    };
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.sendRequest(tab.id, {
            ezSessionDisable: 'state'
        }, function (response) {
            if (response.ezSessionState == "true") {
                disable.childNodes[0].nodeValue = "Reenable for this session";
                disable.onclick = function () {
                    doSessionDisable(false);
                };
            }
        });
    });
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.sendRequest(tab.id, {
            'volume': 'getter'
        }, function (response) {
            document.getElementById('slide').value = response.volume;
            document.getElementById('volumeamt').innerHTML = response.volume;
        });
    });
    var highlightDisable = document.getElementById("highlightDisable");
    highlightDisable.onclick = function () {
        doHighlightDisable();
    };
    document.getElementById('slide').onchange = function () {
        doChangeVolume();
        document.getElementById('volumeamt').innerHTML = document.getElementById('slide').value;
    };
}

function doChangeVolume() {
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.sendRequest(tab.id, {
            ezVolume: String(document.getElementById('slide').value)
        }, function (response) {
        });
    });
}

function doHighlightDisable() {
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.sendRequest(tab.id, {
            ezHighlightDisable: 'true'
        }, function (response) {
        });
    });
}

function doSessionDisable(on) {
    var disable = document.getElementById("sessionDisable");
    if (on) {
        disable.childNodes[0].nodeValue = "Reenable for this session";
        disable.onclick = function () {
            doSessionDisable(false);
        };
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendRequest(tab.id, {
                ezSessionDisable: 'true'
            }, function (response) {
            });
        });
    } else {
        disable.childNodes[0].nodeValue = "Disable for this session";
        disable.onclick = function () {
            doSessionDisable(true);
        };
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendRequest(tab.id, {
                ezSessionDisable: 'false'
            }, function (response) {
            });
        });
    }
}