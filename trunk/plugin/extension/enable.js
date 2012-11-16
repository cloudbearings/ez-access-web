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

var ezNavigate;
chrome.extension.sendRequest({localstorage: "ezNavigate"}, function(response) {
	ezNavigate = response.ezNavigate;
});

var checkingIfEz = function() {
  if (ezNavigate == 'all' || document.body.getAttribute('data-ez') !== null) {
    // The regular expression produced a match, so notify the background page.
    load_ez();
    chrome.extension.sendRequest({ezShow: "true"}, function(response) {});
  } else {
    // No match was found.
  }
}
addLoadEvent(checkingIfEz);