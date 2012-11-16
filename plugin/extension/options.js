var defaultHighlight = "red";
var defaultNavigate = "some";

document.addEventListener('DOMContentLoaded', function () {
  loadOptions();
  document.getElementById("save").onclick=function(){ saveOptions(); };
  document.getElementById("reset").onclick=function(){ eraseOptions(); };
  //document.getElementById("save").addEventListener('click',saveOptions());
  //document.getElementById("reset").addEventListener('click',eraseOptions());
});

function loadOptions() {
	var favColor = localStorage["ezHighlightColor"];
	
	// valid colors are red, blue, green and yellow
	if (favColor == undefined || (favColor != "red" && favColor != "blue" && favColor != "green" && favColor != "yellow")) {
		favColor = defaultHighlight;
	}

	var select = document.getElementById("color");
	for (var i = 0; i < select.children.length; i++) {
		var child = select.children[i];
			if (child.value == favColor) {
			child.selected = "true";
			break;
		}
	}
	
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
	var select = document.getElementById("color");
	var color = select.children[select.selectedIndex].value;
	localStorage["ezHighlightColor"] = color;
	
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