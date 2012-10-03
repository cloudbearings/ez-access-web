
//EZ-Access keycode declarations
const key_skipForward = 135; // is >>
const key_skipBackward = 134; // is <<
const key_help = 128; // is ?
const key_back = 132; // is BACK
const key_next = 133; // is NEXT
const key_up = 129 // is up arrow key
const key_down = 130; // is down arrow key
const key_enter = 131; // is green circle enter key

var ez_navigateToggle = false;

var currIndex = 0;

// Provide easy place to change method of speech synthesis
function voice(data) {
  speak.play(data);
}

function ez_navigate_start() {
  ez_navigateToggle = true;
  if(document.body.getAttribute('data-ez-startat') !== null) {
    var startid = document.body.getAttribute('data-ez-startat').split(" ")[0].slice(1);
    document.getElementById(startid).className += ' selector';
  }
}

/* http://www.quirksmode.org/dom/getElementsByTagNames.html
   Gets all elements, IN ORDER _AND_ by element name.
   Commands:
   list :: A string with a comma-separated list of tag names.
   obj  :: An optional start element. If it's present the script searches only for tags that
           are descendants of this element, if it's absent the script searches the entire document. */
function getElementsByTagNames(list,obj) {
	if (!obj) var obj = document;
	var tagNames = list.split(',');
	var resultArray = new Array();
	for (var i=0;i<tagNames.length;i++) {
		var tags = obj.getElementsByTagName(tagNames[i]);
		for (var j=0;j<tags.length;j++) {
			resultArray.push(tags[j]);
		}
	}
	var testNode = resultArray[0];
	if (!testNode) return [];
	if (testNode.sourceIndex) {
		resultArray.sort(function (a,b) {
				return a.sourceIndex - b.sourceIndex;
		});
	}
	else if (testNode.compareDocumentPosition) {
		resultArray.sort(function (a,b) {
				return 3 - (a.compareDocumentPosition(b) & 6);
		});
	}
	return resultArray;
}

function ez_navigate(move) {
  if(move == 'down' && document.getElementsByClassName('selector')[0].nextSibling.nextSibling !== null) {
    if(document.getElementsByClassName('selector')[0].nextSibling.nextSibling.getAttribute('data-ez-focusable') == 'false') {
      while(document.getElementsByClassName('selector')[0].nextSibling.nextSibling !== null && document.getElementsByClassName('selector')[0].nextSibling.nextSibling.getAttribute('data-ez-focusable') == 'false') {
        document.getElementsByClassName('selector')[0].nextSibling.nextSibling.className += ' selector';
        document.getElementsByClassName('selector')[0].className = document.getElementsByClassName('selector')[0].className.replace(' selector','');
      }
    }
    if(document.getElementsByClassName('selector')[0].nextSibling.nextSibling !== null) {
      document.getElementsByClassName('selector')[0].nextSibling.nextSibling.className += ' selector';
      document.getElementsByClassName('selector')[0].className = document.getElementsByClassName('selector')[0].className.replace(' selector','');
    } else {
    document.getElementsByClassName('selector')[0].previousSibling.previousSibling.className += ' selector';
    document.getElementsByClassName('selector')[1].className = document.getElementsByClassName('selector')[0].className.replace(' selector','');    
    }
  }
  else if(move == 'up' && document.getElementsByClassName('selector')[0].previousSibling.previousSibling !== null) {
    if(document.getElementsByClassName('selector')[0].previousSibling.previousSibling.getAttribute('data-ez-focusable') == 'false') {
      while(document.getElementsByClassName('selector')[0].previousSibling.previousSibling !== null && document.getElementsByClassName('selector')[0].previousSibling.previousSibling.getAttribute('data-ez-focusable') == 'false') {
        document.getElementsByClassName('selector')[0].previousSibling.previousSibling.className += ' selector';
        document.getElementsByClassName('selector')[1].className = document.getElementsByClassName('selector')[0].className.replace(' selector','');
      }
    }
    if(document.getElementsByClassName('selector')[0].previousSibling.previousSibling !== null) {
    document.getElementsByClassName('selector')[0].previousSibling.previousSibling.className += ' selector';
    document.getElementsByClassName('selector')[1].className = document.getElementsByClassName('selector')[0].className.replace(' selector','');
    } else {
      document.getElementsByClassName('selector')[0].nextSibling.nextSibling.className += ' selector';
      document.getElementsByClassName('selector')[0].className = document.getElementsByClassName('selector')[0].className.replace(' selector','');
    }
  }
}

// On page load, load key_event() listener
window.onload=function() {
  document.onkeydown = key_event;
  document.onkeypress = key_event;
  var htmlpage = getElementsByTagNames('p,img,span');
}
/* Referred to by window.onload anonymous function.
   http://www.dreamincode.net/code/snippet1246.htm */
function key_event(e) {
  // 'if' keycode statements
  
  if(e.keyCode == key_help) {
    if(ez_navigateToggle) {
    } else {
      ez_navigate_start();
    }
  }
  else if(e.keyCode == key_up) {
    if(ez_navigateToggle) {
      ez_navigate('up');
    } else {
      ez_navigate_start();
    }
  }
  else if(e.keyCode == key_down) {
    if(ez_navigateToggle) {
      ez_navigate('down');
    } else {
      ez_navigate_start();
    }
  }
  else if(e.keyCode == key_back) {
    if(ez_navigateToggle) {
    } else {
      ez_navigate_start();
    }
  }
  else if(e.keyCode == key_enter) {
    if(ez_navigateToggle) {
    } else {
      ez_navigate_start();
    }
  }
  
}