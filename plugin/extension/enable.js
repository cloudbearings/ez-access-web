// Test the text of the body element against our regular expression.
function addLoadEvent(func) {
	var oldonload = window.onload;
	if (typeof window.onload != 'function') {
		window.onload = func;
	} else {
		window.onload = function() {
			if (oldonload) {
				oldonload();
			}
			func();
		}
	}
}
var EzCustomColor;
chrome.extension.sendRequest({localstorage: "ezHighlightColor" }, function(response) {
	EzCustomColor = response.ezHighlightColor;
});
var ezNavigate;

chrome.extension.sendRequest({localstorage: "ezNavigate" }, function(response) {
	ezNavigate = response.ezNavigate;
});


var ezSessionDisable = sessionStorage["ezSessionDisable"];
var checkingIfEz = function() {
  if(ezSessionDisable == "true") {
	chrome.extension.sendRequest({ezShow: "true"}, function(response) {});
  } else if (ezNavigate == 'all' || document.body.getAttribute('data-ez') !== null) {
    // The regular expression produced a match, so notify the background page.
    load_ez();
    chrome.extension.sendRequest({ezShow: "true"}, function(response) {});
  } else {
    // No match was found.
  }
}
addLoadEvent(checkingIfEz);


// Storing whether to disable for this session
chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		if (request.ezSessionDisable == "true") {
			sessionStorage["ezSessionDisable"] = "true";
			stopEZ();
			sendResponse({});
			window.location.reload();
		} else if(request.ezSessionDisable == "false") {
			sessionStorage["ezSessionDisable"] = "false";
			load_ez();
			sessionStorage.setItem("EZ_Toggle", "1");
			ez_navigateToggle = true;
			sounds[getElementAudio()].feed.play();
			drawSelected(selectElements[currIndex]);
			voice(selectElements[currIndex],'point');
			sendResponse({});
		} else if(request.ezSessionDisable == "state") {
			var packet = String(sessionStorage["ezSessionDisable"]);
			sendResponse({ezSessionState: packet});
		} else if(request.ezHighlightDisable == "true") {
			stopEZ();
			sendResponse({});
		} else if(request.volume == 'getter') {
			sendResponse({volume: audioVolume});
		}
});
