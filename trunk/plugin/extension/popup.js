document.addEventListener('DOMContentLoaded', function () {
	loadOptions();
});

function loadOptions() {
	var disable = document.getElementById("sessionDisable");
	disable.onclick=function(){ doSessionDisable(true); };
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendRequest(tab.id, {ezSessionDisable:'state'}, function(response) {
			if(response.ezSessionState == "true"){
				disable.childNodes[0].nodeValue="Reenable for this session";
				disable.onclick=function(){ doSessionDisable(false); };
			}
		});
	});
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendRequest(tab.id, {'volume': 'getter'}, function(response) {
			document.getElementById('slide').value = response.volume;
			document.getElementById('volumeamt').innerHTML = response.volume;
		});
	});
	var highlightDisable = document.getElementById("highlightDisable");
	highlightDisable.onclick=function(){ doHighlightDisable(); };
}

function doHighlightDisable(){
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendRequest(tab.id, {ezHighlightDisable:'true'}, function(response) {
			});
		});
}

function doSessionDisable(on){
	var disable = document.getElementById("sessionDisable");
	if(on) {
		disable.childNodes[0].nodeValue="Reenable for this session";
		disable.onclick=function(){ doSessionDisable(false); };
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendRequest(tab.id, {ezSessionDisable:'true'}, function(response) {
			});
		});
	} else {
		disable.childNodes[0].nodeValue="Disable for this session";
		disable.onclick=function(){ doSessionDisable(true); };
		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendRequest(tab.id, {ezSessionDisable:'false'}, function(response) {
			});
		});
	}
}