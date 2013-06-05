// Keep track if the TINY modal is open or not
var tinyOpen = false;

function ez_help(alert) {
  var helptext = String(alert);
  TINY.box.show("<span style='font-size:150%'>" + helptext + "</span>",0,400,0,0);
  voice(String(helptext));
}

function idle_loop(display) {
  if(!display) {
	if(alerts.idle.wait != -1) {
		idleLoop = self.setInterval(function(){idle_loop(true)},alerts.idle.wait);
	}
  } else {
    if(!tinyOpen && !ez_navigateToggle) {
      idleLoop = self.clearInterval(idleLoop);
      tinyOpen = true;
      ez_help(alerts.idle.value);
    }
  }
}