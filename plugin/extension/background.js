// If not initialized
if(localStorage.ezHighlightColor === undefined) {
	localStorage.ezHighlightColor = "#0000FF";
}
if(localStorage.ezNavigate === undefined) {
	localStorage.ezNavigate = "some";
}
if(localStorage.ssml === undefined) {
	// Disable for Macs only
	if (navigator.userAgent.indexOf('Mac OS X') !== -1) {
		localstorage.ssml = "false";
	} else localStorage.ssml = "true";
}

// SETTINGS STORAGE
chrome.extension.onRequest.addListener(
	function (request, sender, sendResponse) {
		if(request.localstorage == "ezNavigate") {
			sendResponse({
				ezNavigate: localStorage.ezNavigate
			});
		} else if(request.localstorage == "ezHighlightColor") {
			sendResponse({
				ezHighlightColor: localStorage.ezHighlightColor
			});
		} else if(request.localstorage == "ssml") {
			sendResponse({
				ssml: localStorage.ssml
			});
		} else if(request.tts !== undefined) {
			chrome.tabs.getSelected(null, function (tab) {
				sessionStorage.setItem("tabid", tab.id);
			});
			chrome.tts.speak(request.tts, {
				'volume': parseFloat(request.volume),
				requiredEventTypes: ['end'],
				onEvent: function (event) {
					if(event.type === 'end') {
						chrome.tabs.sendRequest(parseFloat(sessionStorage.getItem("tabid")), {
							ezTtsState: 'done'
						}, function (response) {});
					}
				}
			});
		} else if(request.ezShow == "true") {
			chrome.pageAction.show(sender.tab.id);
		} else {
			sendResponse({}); // snub them.
		}
	});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	if(parseFloat(sessionStorage.getItem("tabid")) == tabId) {
		chrome.tts.stop();
	}
});