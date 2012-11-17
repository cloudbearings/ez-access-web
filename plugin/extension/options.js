var defaultNavigate = "some";

document.addEventListener('DOMContentLoaded', function () {
  loadOptions();
  document.getElementById("save").onclick=function(){ saveOptions(); };
  document.getElementById("reset").onclick=function(){ eraseOptions(); };
});

function loadOptions() {
	var ezHighlightColor = localStorage["ezHighlightColor"];
	var colorSelector = document.getElementById('highlightColor');
	
	// valid colors are red, blue, green and yellow
	if (ezHighlightColor == undefined) {
		ezHighlightColor = colorSelector.value;
		localStorage["ezHighlightColor"] = ezHighlightColor;
	}
	
	colorSelector.value = ezHighlightColor;
	
	var navigate = localStorage["ezNavigate"];
	var navSome = document.getElementById('some');
	var navAll = document.getElementById('all');
	if (navigate == 'all') {
		navSome.checked = false;
		navAll.checked = true;
	} else if(navigate == 'some') {
		navSome.checked = true;
		navAll.checked = false;
	} else {
		localStorage["ezNavigate"] = 'some';
	}
	
}

function saveOptions() {
	var colorSelector = document.getElementById('highlightColor');
	localStorage["ezHighlightColor"] = colorSelector.value;
	
	var navSome = document.getElementById('some');
	var navAll = document.getElementById('all');
	if(navSome.checked) {
		localStorage["ezNavigate"] = 'some';
	} else if(navAll.checked) {
		localStorage["ezNavigate"] = 'all';
	}
}

function eraseOptions() {
	localStorage.removeItem("ezHighlightColor");
	localStorage.removeItem("ezNavigate");
	location.reload();
}