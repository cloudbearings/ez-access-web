// Tab keycodes
var KB_TAB = 9;
var KB_SHIFT = 16;
var KB_ENTER = 13;

//EZ-Access keycode declarations
var EZ_KEY_SKIPFORWARD = 135; // is >>
var EZ_KEY_SKIPBACKWARD = 134; // is <<
var EZ_KEY_HELP = 128; // is ?
var EZ_KEY_BACK = 132; // is BACK
var EZ_KEY_NEXT = 133; // is NEXT
var EZ_KEY_UP = 129; // is up arrow key
var EZ_KEY_DOWN = 130; // is down arrow key
var EZ_KEY_ENTER = 131; // is green circle enter key

// Whether slide to read is enabled universally
var slideToRead = true;

// Determines key autorepeat preperty or not
var autoRepeat = 'off';

// Tabular navigation behavior (& cooperation w/ browser)
var tabNav = 'ezaccess';

// Global idle loop timer if no user action is taken
var idleLoop;

// If autoadvance is enabled or not
// Also autoadvance timer is global to disable from other functions
var autoAdvance = 0;
var autoAdvTimer;


/* Referred to by window.onload anonymous function.
   http://www.dreamincode.net/code/snippet1246.htm */
function key_event(e) {
  // 'if' keycode statements
  if(e.keyCode == EZ_KEY_HELP || e.keyCode == 72) { // 72 == 'h'
    if(tinyOpen) {
      tinyOpen = false;
      TINY.box.hide();
    } else {
      tinyOpen = true;
      ez_help(selectElements[currIndex]);
    }
  }
  else if(e.keyCode == EZ_KEY_UP) {
    if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
    else {
      if(ez_navigateToggle) {
        window.scroll(0,findPos(selectElements[currIndex]));
        ez_navigate('up');
      } else {
        ez_navigate_start();
      }
    }
  }
  else if(e.keyCode == EZ_KEY_DOWN) {
    if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
    else {
      if(ez_navigateToggle) {
        window.scroll(0,findPos(selectElements[currIndex]));
        ez_navigate('down');
      } else {
        ez_navigate_start();
      }
    }
  }
  else if(e.keyCode == EZ_KEY_BACK || e.keyCode == 66) { // 'b' == 66
    // TODO
    var inGroup = findGroupParent();
    if(inGroup == currIndex) {
      if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
      else {
        if(ez_navigateToggle) {
          window.history.back();
        } else {
          ez_navigate_start();
        }
      }
    } else {
      globalSayBefore = "Navigating out of group... ";
      ez_jump(inGroup);
    }
  }
  else if(e.keyCode == EZ_KEY_ENTER || e.keyCode == KB_ENTER) {
    if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
    else {
      if(ez_navigateToggle) {
        ez_enter();
      } else {
        ez_navigate_start();
      }
      return false; // Disable any browser actions
    }
  } else if(e.keyCode == EZ_KEY_SKIPFORWARD) {
    if(selectElements[currIndex].type == 'range') {
      selectElements[currIndex].value = parseFloat(selectElements[currIndex].value) + parseFloat(selectElements[currIndex].step);
      sounds[AUDIO_MOVE].feed.play();
      voice(selectElements[currIndex].value);
    } else if(selectElements[currIndex].tagName == 'SELECT') {
      if(selectElements[currIndex].selectedIndex < selectElements[currIndex].length-1) {
        selectElements[currIndex].selectedIndex++;
        sounds[AUDIO_MOVE].feed.play();
        voice(selectElements[currIndex].value + '... option ' + (selectElements[currIndex].selectedIndex+1) + ' of ' + selectElements[currIndex].length);
      } else {
        document.getElementById(ezSelectorId).className = 'pulse';
        setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
      }
    } else {
      if(audioVolume <= 90) {
        audioVolume += 10;
        sessionStorage.setItem("EZ_Volume",audioVolume);
        set_volume();
        sounds[AUDIO_MOVE].feed.play();
        voice("Volume... " + audioVolume + " percent");
      } else {
        document.getElementById(ezSelectorId).className = 'pulse';
        setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
        voice("Maximum volume");
      }
    }
  } else if(e.keyCode == EZ_KEY_SKIPBACKWARD) {
    if(selectElements[currIndex].type == 'range') {
      selectElements[currIndex].value = parseFloat(selectElements[currIndex].value) - parseFloat(selectElements[currIndex].step);
      sounds[AUDIO_MOVE].feed.play();
      voice(selectElements[currIndex].value);
    } else if(selectElements[currIndex].tagName == 'SELECT') {
      if(selectElements[currIndex].selectedIndex > 0) {
        selectElements[currIndex].selectedIndex--;
        sounds[AUDIO_MOVE].feed.play();
        voice(selectElements[currIndex].value + '... option ' + (selectElements[currIndex].selectedIndex+1) + ' of ' + selectElements[currIndex].length);
      } else {
        document.getElementById(ezSelectorId).className = 'pulse';
        setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
      }
    } else {
      if(audioVolume >= 10) {
        sessionStorage.setItem("EZ_Volume",audioVolume);
        audioVolume -= 10;
        set_volume();
        sounds[AUDIO_MOVE].feed.play();
        voice("Volume... " + audioVolume + " percent");
      } else {
        document.getElementById(ezSelectorId).className = 'pulse';
        setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
        sounds[AUDIO_NOACTION].feed.play();
        voice("Minimum volume");
      }
    }
  } else if(selectElements[currIndex].type == 'textarea' || selectElements[currIndex].type == 'text') {
    var key = String.fromCharCode(e.keyCode);
    if(!key.match(/[^A-Za-z0-9\-_]/)) voice(key);
  }
  return true;
}

function ez_jump(location) {
  selectElements[currIndex].blur();
  currIndex = parseFloat(location);
  drawSelected(selectElements[currIndex])
  sounds[getElementAudio()].feed.play();
  selectElements[currIndex].focus();
  voice(selectElements[currIndex],'nav');
}

function ez_enter() {
  var obj = selectElements[currIndex];
  if(obj.tagName == "A") {
		if(obj.href.indexOf("#") != -1) {
			var hrefBase = obj.href.substring(0,obj.href.indexOf("#"));
			if(window.location.href.indexOf("#") != -1) {
				var pageBase = window.location.href.substring(0,window.location.href.indexOf("#"));
			} else {
				var pageBase = window.location.href;
			}
			if(hrefBase == "" || hrefBase == pageBase) { // If from same URL base
				var jumpTo = obj.href.substring(obj.href.indexOf("#")+1);
				var idLocation = getCurrIndexById(jumpTo);
				var nameLocation = getCurrIndexByName(jumpTo);
				if(idLocation != -1) {
					ez_jump(idLocation);
					obj.click();
					return;
				} else if(nameLocation != -1) {
					ez_jump(nameLocation);
					obj.click();
					return;
				}
			}
		}
	}
	if(getClick(obj) !== undefined) {
    obj.click();
  } else if(obj.tagName == 'INPUT' && (obj.type == 'radio' || obj.type == 'checkbox') ) {
    obj.click();
    if(obj.checked) {
      sounds[AUDIO_SELECT].feed.play();
    } else {
      sounds[AUDIO_DESELECT].feed.play();
    }
    voice(obj);
  }
  else if(obj.tagName == 'INPUT' && (obj.type == 'submit' || obj.type == 'image') ) {
    obj.click();
  } else if(selectElements[currIndex].getAttribute('data-ez-chunking') == 'group' && selectElements[currIndex].getAttribute('data-ez-subnavtype') == 'nested' || selectElements[currIndex].getAttribute('data-ez-subnavtype') == 'hierarchical') {
    ez_navigate_in_group();
  }
  else {
    document.getElementById(ezSelectorId).className = 'pulse';
    setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
    sounds[AUDIO_NOACTION].feed.play();
    document.getElementById(ezSelectorId).className = 'pulse';
    setTimeout(function(){document.getElementById(ezSelectorId).className = '';},300);
    voice(obj,0,true);
  }
}

// Check if new element (and exists to be highlighted), and then highlights
function mouseOver(e) {
  var newElement = true;
  var found = false;
  for(var i = 0; i < selectElements.length;i++) {
    if(e == selectElements[i]) {
      if(currIndex == i) {
        newElement = false;
      }
      if(!selectElements[i].hasAttribute('data-ez-focusable-point') && !selectElements[i].hasAttribute('data-ez-focusable')) {
        // If we're not supposed to navigate here by pointing
        selectElements[currIndex].blur(); // Add blur to old element
        currIndex = i;
        selectElements[currIndex].focus(); // Add focus to new element
        found = true;
      }
    }
  }
  if( (newElement && found) || !ez_navigateToggle) { //Override if ez is not enabled
    sessionStorage.setItem("EZ_Toggle", "1");
    ez_navigateToggle = true;
    sounds[getElementAudio()].feed.play();
    drawSelected(selectElements[currIndex]);
    voice(selectElements[currIndex],'point');
  }
}

function multikey_event(e){
    e=e||event//to deal with IE
    map[e.keyCode]=e.type=='keydown'?true:false
    if (map[KB_TAB] && map[KB_SHIFT] && tabNav != 'none'){ //SHIFT+TAB
      if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
      if(ez_navigateToggle) {
        ez_navigate('up');
        smoothScroll(findPos(selectElements[currIndex]));
        //window.scroll(0,findPos(selectElements[currIndex]));
      } else {
        ez_navigate_start();
      }
      return false; // Overwrite default browser functionality
    } else if(map[KB_TAB] && tabNav != 'none'){//TAB
      if(tinyOpen) { tinyOpen = false;  TINY.box.hide(); }
      if(ez_navigateToggle) {
        ez_navigate('down');
        smoothScroll(findPos(selectElements[currIndex]));
        //window.scroll(0,findPos(selectElements[currIndex]));
      } else {
        ez_navigate_start();
      }
      return false;
    }
    return true;
}
function auto_advance_set() {
	// If this is a new element to start autoadvancing, set the timer
	if(find_parent_attr(selectElements[currIndex],'data-ez-autoadvance') !== undefined) {
		if(find_parent_attr(selectElements[currIndex-1],'data-ez-autoadvance') === undefined) {
			autoAdvance = find_parent_attr(selectElements[currIndex],'data-ez-autoadvance');
			autoAdvance = parseInt(autoAdvance);
			if(autoAdvance < 100) {
				console.log("Please choose a autoadvance pause of 100 ms or greater.");
				autoAdvance = 100;
			}
			auto_advance_decide();
		}
	}
}

function auto_advance_decide() {
	window.clearInterval(autoAdvTimer);
	if(autoAdvance !== 0) {
		autoAdvTimer = setInterval(function(){
			ez_navigate('down');
			if(currIndex >= findFocusable('last')) {
				autoAdvance = 0;
				window.clearInterval(autoAdvTimer);
			}
			if(find_parent_attr(selectElements[currIndex],'data-ez-autoadvance') === undefined) {
				autoAdvance = 0;
				window.clearInterval(autoAdvTimer);
			}
		},autoAdvance);
	}
}

//Finds y value of given object -- for automated scrolling
function findPos(obj) {
    var curtop = -100;
    if (obj.offsetParent) {
        do {
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
    return [curtop];
    }
}

// Smooth Scrolling
// http://www.itnewb.com/tutorial/Creating-the-Smooth-Scroll-Effect-with-JavaScript
function currentYPosition() {
    // Firefox, Chrome, Opera, Safari
    if (self.pageYOffset) return self.pageYOffset;
    // Internet Explorer 6 - standards mode
    if (document.documentElement && document.documentElement.scrollTop)
        return document.documentElement.scrollTop;
    // Internet Explorer 6, 7 and 8
    if (document.body.scrollTop) return document.body.scrollTop;
    return 0;
}

function smoothScroll(stopY) {
    var startY = currentYPosition();
    var distance = stopY > startY ? stopY - startY : startY - stopY;
    if (distance < 100) {
        scrollTo(0, stopY); return;
    }
    var speed = Math.round(distance / 100);
    if (speed >= 20) speed = 20;
    var step = Math.round(distance / 200);
    var leapY = stopY > startY ? startY + step : startY - step;
    var timer = 0;
    if (stopY > startY) {
        for ( var i=startY; i<stopY; i+=step ) {
            setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
            leapY += step; if (leapY > stopY) leapY = stopY; timer++;
        } return;
    }
    for ( var i=startY; i>stopY; i-=step ) {
        setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
        leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
    }
}