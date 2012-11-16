// SETTINGS STORAGE
chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		if (request.localstorage == "ezNavigate") {
			sendResponse({ezNavigate: localStorage.ezNavigate});
		} else if(request.tts !== undefined) {
			chrome.tts.speak(request.tts);
		} else {
			sendResponse({}); // snub them.
		}
});

// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Called when a message is passed.  We assume that the content script
// wants to show the page action.
function onRequest(request, sender, sendResponse) {
  // Show the page action for the tab that the sender (content script)
  // was on.
  chrome.pageAction.show(sender.tab.id);

  // Return nothing to let the connection be cleaned up.
  sendResponse({});
};

// Listen for the content script to send a message to the background page.
chrome.extension.onRequest.addListener(onRequest);