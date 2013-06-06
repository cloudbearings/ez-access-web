// Keep track if the TINY modal is open or not
var tinyOpen = false;

function ez_help(alert) {
	var helptext = new String();
	
	if(typeof alert === 'string') {
		helptext = String(alert);
	} else if(typeof alert === 'object') {
		helptext = getHelpArray(alert)[0];
	}
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

/**
 * The delimiter between layers in the data-ez-help attribute.
 * @const
 */
DELIMITER = '|';
/**
 * The terminator in the data-ez-help attribute. If the attribute ends with 
 * the TERMINATOR, then no additional help layers are provided.
 * @const
 */
TERMINATOR = '||';

/**
 * Takes a DOM object and creates an array of all of the help layers associated
 * with that object (given with the data-ez-help attribute). This function is 
 * recursive so that the help layers from ancestor elements are included 
 * (unless the help string associated with an object ends with the TERMINATOR 
 * character string).
 * @author J. Bern Jordan
 * @param {Object} obj The DOM object for which to get the help layers.
 * @return {null|string[]} The help layers (or null if there are no help layers).
 */
function getHelpArray(obj) {
        'use strict';
        /**
         * The return, which is either an array of strings with each help layer or
         * null if there are no help layers associated with obj.
         */
        var ret;
        /**
         * The value of the data-ez-help attribute.
         * @type {string}
         */
        var attr;
        /**
         * Whether the function should end or not.
         * @type {boolean}
         */
        var end;
        
        if (obj.hasAttribute('data-ez-help')) {
                attr = obj.getAttribute('data-ez-help');
                
                //See if this function needs to make a recursive call
                if (attr.slice(-TERMINATOR.length) === TERMINATOR) {
                        end = true;
                } else {
                        end = false;
                }
                
                ret = attr.split(DELIMITER);
                
                //TODO: Remove empty array elements from ret (null, '')
                
                for (var i=0; i<ret.length; i++) {
                        ret[i] = parseHelpPageString(ret[i]);
                }       
        } else {
                ret = null;
        }

        /**
         * This function may be called recursively on parent elements.
         */
        if (!end) {
                var parent = obj.parentNode;
                
                //End the recursion because there are no more parent elements
                if (parent === null || parent.tagName === 'HTML') {
                        return ret;
                }
                
                var recursive = getHelpArray(parent);
                
                if (isArray(recursive) && recursive !== null) {
                        if (ret === null) {
                                ret = [];
                        }
                        ret = ret.concat(recursive);
                } else if (recursive !== null) {
                        throw new Error('Array not passed to getHelpArray()');
                } //else (thus recursive === null) ret does not change (ret = ret;)
        }
        
        return ret;
} //End function getHelpArray()

/**
 * CURRENTLY A SKELETON OF A FUNCTION
 * Takes a string for a single help layer (from the data-ez-help attribute) 
 * and parses it. If the string is a reference to a part of another file, 
 * then the proper string from that file is returned. If the string is not a
 * reference, it is cleaned up so that only plain text remains. 
 * @param s {string} The single help layer string to be parsed.
 * @return {string} The resulting string from the parsing.
 */
function parseHelpPageString(s) {
        /**
         * The string to be returned.
         */
        var ret;
        
        //First check if the string is a reference to another string
				if(s.indexOf('#') !== -1) {
				
					// Potentially ID-referencing
					var ref = s.split('#');
					
					if(ref[0].trim().length === 0) {
						//Referencing ID of el on current page
						
						//Hashes are *not* allowed in IDs (http://goo.gl/YgTLi), but get 
						//rest just to be safe.
						var id = s.slice(s.indexOf('#') + 1);
						
						var div = document.getElementById(id);
						if(div !== null) {
							return div.innerHTML;
						} else {
							console.log("Error: Could not find ID '" + id + "' on current page for help layers");
						}
					} else {
						// (Potentially) referencing an external file
						var url = ref[0];
						var ext = url.slice(url.lastIndexOf('.') + 1);
						
						if(ext == 'htm' || ext == 'html') {
							// Forms URL: HTM or HTML. Still don't know if exists
							var externalDocument = getDocument(url);
							if(externalDocument !== null) {
								// Document exists. Still don't know if specific ID exists
								
								var id = s.slice(s.indexOf('#') + 1);
								var div = externalDocument.getElementById(id);
								
								if(div !== null) {
									return div.textContent; // TODO : for some reason innerHTML not supported... (?)
								} else {
									// ID doesn't exist; is an error
									console.log("Error: Could not find ID '" + id + "' on document '" + url + "' for help layers");
								}
							} else {
								// Document doesn't exist; is an error
								console.log("Error: Could not find file '" + url + "' for help layers");
							}
						} // ELSE: Invalid URL; not an error: Could just be a normal file
					}
				} // ELSE: Content is string (as-is)
     
        ret = s;
        return ret;
}

var xmlhttp = new XMLHttpRequest();

function getDocument(url) {
	xmlhttp.open("GET",url + '?t=' + new Date().getTime() ,false); // TODO : Disable caching for troubleshooting
	xmlhttp.send();
	if(xmlhttp.status == 200) {
		var xmlString = xmlhttp.responseText
			, parser = new DOMParser()
			, doc = parser.parseFromString(xmlString, "text/xml");
		return doc;
	} else {
		return null;
	}
}