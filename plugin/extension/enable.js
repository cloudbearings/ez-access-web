/*
 * Copyright (c) 2010 The Chromium Authors. All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 */

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
var checkingIfEz = function() {
  if (document.body.getAttribute('data-ez') !== null) {
    // The regular expression produced a match, so notify the background page.
    load_ez();
    chrome.extension.sendRequest({}, function(response) {});
  } else {
    // No match was found.
  }
}
addLoadEvent(checkingIfEz);