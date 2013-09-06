/*----------------------------------------------------------------------------------------------------------------------
 |  COPYRIGHT       (c) 2012 - 2013 Trace Research and Development Center,
 |                  The Board of Regents of the University of Wisconsin System.
 |                  All rights reserved.
 |
 |  LICENSE         New BSD License
 |
 |  CODE            Alexander Harding and Bern Jordan
 |  SPECIFICATIONS  Bern Jordan
 |
 |  FILE            ezhelp.js
 |  DESCRIPTION     This file contains the driver for the EZ Help module of the EZ Access plugin, including
 |                  parsing contents for the help lightbox, invoking the lightbox, and navigation through it.
 |                  Lightbox-general code for EZ Help is found in "eztinyhelp.js".
 *--------------------------------------------------------------------------------------------------------------------*/


/**
 * Keep track if the TINY modal is open or not
 */
var tinyHelpOpen = false;

/**
 * The current object in which ez help is describing.
 * If none, place null.
 * @type {Object|null}
 */
var helpObj = null;

/**
 * The ordered section in which the prompt is currently on, as per DOM structure.
 * @type {Number}
 */
var helpCounter = 0;

/**
 * If help was just opened, and nothing else done
 * @type {boolean}
 */
var helpJustOpened = false;

/**
 * Default EZ Help HTML File. Might make more flexible later,
 * but for now, replace ' with \' and remove linebreaks and replace here.
 * @type {string}
 */
var DEFAULT_HELP = '<!doctype html> <html lang="en"> <head> <meta charset="utf-8" /> <title>Default help text layers for EZ Access</title> <meta name="author" content="J. Bern Jordan" /> <style type="text/css"> body { background-color: #EEE; } section { background-color: #FFF; margin: 1em 3em; } </style> </head> <body> <h1 class="instructions">Default help text layers for EZ Access</h1> <p class="instructions">This default text was developed at the <a href="http://trace.wisc.edu/">Trace <abbr title="Research and Development">R&amp;D</abbr> Center</a> with user testing on some kiosk prototypes. The default text may be improved in some cases by making them more application specific.</p> <h2 class="instructions">Help Layers for the 8-Button EZ Keypad</h2> <h3 class="instructions">Generic Help Layers</h3> <pre class="instructions">id="keypad8"</pre> <div id="keypad8" data-ez-help> <p class="instructions">The generic help layers should be provided on the <code>&lt;body&gt;</code> tag as the default help layers for the screen.</p> <p class="instructions">Ideally, you should create your own first help layer/s for each screen of your application and then follow that with the more generic help. In your HTML for a page, do something like the following:</p> <pre class="instructions"> &lt;body data-ez="data-ez" data-ez-help="<var>appHelp.html</var><var>#screenX</var>| <var>defaultEZHelp.html</var>#keypad8"&gt; ... &lt;/body&gt; </pre> <p class="instructions">Where:</p> <ul class="instructions"> <li><code><var>appHelp.html</var></code> is the location of your help file with your application-specific help content.</li> <li><code><var>screenX</var></code> is the <code>id</code> of the <code>div</code> or other element that contains the help content for the specific page.</li> <li><code><var>defaultEZHelp.html</var></code> is the location of this file (with the generic help layers).</li> </ul> <h4 class="instructions">Layer 1</h4> <section> <h1>How to use EZ Help:</h1> <p>You can press the diamond-shaped EZ Help button for help at any time while using this kiosk.</p> <p>Then use the EZ Up and Down arrow buttons to move through the help instructions, and use the round EZ Action button to repeat a help instruction item.</p> <p>You can also press the EZ Help button twice to stop the speech whenever you are not already in EZ Help.</p> </section> <h4 class="instructions">Layer 2</h4> <section> <h1>How to use Button Help:</h1> <p>When Button Help is turned on, the keys, buttons, and on-screen items do nothing except say their name and function. This lets you safely explore and learn about the keyboard keys, the EZ Access buttons, and all of the buttons and information items that are shown on the screen.</p> <p>To use Button Help, hold down the diamond-shaped EZ Help button, and then press any other key or button, or touch any item on the screen to learn about it.</p> <p>Button Help can also be locked on by pressing the EZ Help button five times in a row.</p> </section> <h4 class="instructions">Layer 3</h4> <section> <h1>Quick help on how to use EZ Access:</h1> <p>The EZ Access buttons allow you to hear about the things you can do with this kiosk and to make choices. Screens on this kiosk may have many items on them. First, you will move to the item you want with the EZ Up & Down arrows. Then, you will need to use the EZ Action button to choose that item.</p> <p>You will usually start near the top of each screen. The EZ Down arrow will move you down to the next item. If you do not want that item, you can use the EZ Down arrow again. To go up to a previous item, use the EZ Up arrow.</p> <p>The round EZ Action button chooses an item. After moving to the item you want, you will then need to choose that item by pressing the EZ Action button.</p> </section> <h4 class="instructions">Layer 4</h4> <section> <p>End of quick help for EZ Access.</p> <p>You may exit help now by pressing the EZ Help button or continue to get long, very detailed instructions on using EZ Access.</p> </section> <p class="instructions">Note that this is followed by all of the tutorial layers below...</p> <h3 class="instructions">Tutorial (8-button keypad)</h3> <pre class="instructions">id="keypad8-tutorial"</pre> <div id="keypad8-tutorial" data-ez-help> <p class="instructions">The tutorial should be used on the first screen of an application. This tutorial walks users through how the buttons of the 8-button EZ Access keypad are used. Other screens should start with the generic help layers.</p> <p class="instructions">On the first HTML page of your application, the code might look like the following:</p> <pre class="instructions"> &lt;body data-ez="data-ez" data-ez-help="<var>defaultEZHelp.html</var>#keypad8-tutorial"| <var>appHelp.html</var><var>#screen1</var>"&gt; ... &lt;/body&gt; </pre> <p class="instructions">Where:</p> <ul class="instructions"> <li><code><var>defaultEZHelp.html</var></code> is the location of this file (with the tutorial help layers).</li> <li>(optional) <code><var>appHelp.html</var></code> is the location of your help file with your application-specific help content.</li> <li>(optional) <code><var>screen1</var></code> is the <code>id</code> of the <code>div</code> or other element that contains the help content for the first page.</li> </ul> <h4 class="instructions">Tutorial Layer 1</h4> <section> <h1>How to use EZ Access</h1> <p>The EZ Access buttons on the keypad allow you to hear about the things you can do with this kiosk and to make choices. The kiosk will read to you through headphones when you use EZ Access. It will stop reading to you when you touch the rest of the screen.</p> <p>Screens on this kiosk may have many items on them, such as words, pictures, buttons, and checkboxes. You can use the EZ Up &amp; Down buttons to move through these items. You will then use the round EZ Action button to make choices.</p> <p>To learn how to use the EZ Access buttons, let\'s start with the EZ Down arrow. The EZ Down arrow is a yellow button at the bottom of the EZ Access keypad. It is shaped like a triangle with the point down. Press it now to go to the next help screen.</p> </section> <h4 class="instructions">Tutorial Layer 2</h4> <section> <h1>How to find the EZ Access buttons</h1> <p>There are six EZ Access buttons on the keypad below the screen. You can use these buttons to operate this kiosk instead of trying to read, reach, or use the touchscreen.</p> <p>Two of the buttons are very important. They are the EZ Down &amp; EZ Action buttons. The EZ Down arrow is the yellow button at the bottom of the keypad, which is shaped like a triangle with the point down. The green EZ Action button is in the lower right corner of the keypad and is a circle shape.</p> <p>Press the EZ Down arrow button now to learn more about these important buttons.</p> </section> <h4 class="instructions">Tutorial Layer 3</h4> <section> <h1>How to use the EZ Access buttons</h1> <p>You will usually start near the top of each screen. The EZ Down arrow will move you down to the next item. If you do not want that item, you can use the EZ Down arrow again. The EZ Down arrow only moves and does not activate items or make any changes.</p> <p>The round EZ Action button is to the right of the EZ Down arrow. It is used to choose items. After moving to the item you want, you will then need to choose that item by pressing the EZ Action button. Because you will start near the top of each screen, to operate this kiosk you will usually arrow down several times and then press EZ Action.</p> <p>Press the EZ Down arrow button now to learn more about moving on the screen.</p> </section> <h4 class="instructions">Tutorial Layer 4</h4> <section> <h1>How to move through screens</h1> <p>The EZ Down arrow moves down to the next item on the screen. The EZ Up arrow is the opposite, and moves up to the previous item on the screen.</p> <p>The EZ Up arrow is just above the EZ Down arrow on the keypad. If you went past something you wanted when using the EZ Down arrow, you can move back up to it with the EZ Up arrow.</p> <p>You can do everything you need to do on this kiosk using three buttons: EZ Up, Down, &amp; Action. To exit help and start using this kiosk, press the blue, diamond-sharn about the other EZ Access buttons, press the EZ Down arrow to get to the next help screen.</p> </section> <h4 class="instructions">Tutorial Layer 5</h4> <section> <h1>How to use the other EZ Access buttons</h1> <p>Above and to the left of the EZ Up arrow is the Back page button. Above and to the right of the EZ Up arrow is the Next page button.</p> <p>The EZ Back &amp; Next buttons are similar to turning pages in a book. You may wish to go back to a previous screen to make changes or fix a mistake. To go back to a previous screen, press the EZ Back button. On some screens, you can move forward to the next screen by pressing the EZ Next button.</p> <p>Help is available on every screen. You can get or exit help at any time by pressing the EZ Help button. It is the blue button, which is shaped like a diamond and has small raised dot or bump on it.</p> <p>The buttons at the top left and right corners of the keypad can be used to decrease or increase the headphone volume.</p> </section> </div> <!-- End tutorial for 8-button keypad --> </div> <p class="instructions">Note that this is the end of the generic help for the 8-button keypad, which includes the complete tutorial.</p> <h2>Help for other input methods</h2> <p>coming soon...</p> <footer> <ul> <li>Last updated: <time>2013-06-06</time></li> </ul> </footer> </body> </html> ';

/**
 * Creates a TINY lightbox given a reference.
 * @param {string|object} alert A string to display or object to get help info about.
 */
function ez_help(alert) {
    if (tinyAlertOpen) closeAlert('nav');


    // If null, EZ Access is not started, so default to body help text.
    if (alert === null) alert = document.body;

    helpJustOpened = true;

    tinyHelpOpen = true;

    helpCounter = 0;
    helpObj = null;

    // Hide EZ Highlight
    if (document.getElementById(ezSelectorId)) document.getElementById(ezSelectorId).style.visibility = 'hidden';

    var helpText = "";

    if (typeof alert === 'string') {
        helpText = alert + append_footnote(true, true);
    } else if (typeof alert === 'object') {
        helpObj = alert;
        var helpArr = getHelpArray(alert);
        if (helpArr.length === 0) {
            helpText = 'No EZ Help is available.';
        } else {
            helpText = helpArr[0] + append_footnote(true, false);
        }
    }
    TINYHELP.box.show(helpText, 0, 400, 0, 0);
    tinyContent = document.getElementById('tinycontenthelp');

    voice([tinyContent]);
}

/**
 * Skips to the next help screen, if one exists.
 * @param skip Relative order of sections to skip. Should usually be -1 or 1.
 */
function ez_help_goto_section(skip) {

    helpJustOpened = false;

    var helpText = "";

    if (helpObj !== null) {
        var helpPrompts = getHelpArray(helpObj);

        if (helpCounter !== Math.round(helpCounter)) {
            throw new Error('Invalid section! Check passed parameters.')
        } else if (helpCounter + skip === -1) {
            // First, 'default' page
            helpCounter += skip;
            helpText = 'Start of help text.' + append_footnote(true, false);
            TINYHELP.box.show(helpText, 0, 400, 0, 0);
            playSFX(AUDIO_NAV_MOVE, 'nav');
            playSFX(AUDIO_NAV_MOVE, 'nav');
            tinyContent = document.getElementById('tinycontenthelp');
            voice([tinyContent]);
        } else if (helpPrompts.length === helpCounter + skip) {
            // Last, 'default' page
            helpCounter += skip;
            helpText = 'End of help text.' + append_footnote(false, true);
            TINYHELP.box.show(helpText, 0, 400, 0, 0);

            playSFX(AUDIO_NAV_MOVE, 'nav');
            tinyContent = document.getElementById('tinycontenthelp');
            voice([tinyContent]);
        } else if (helpCounter + skip < -1 || helpCounter + skip > helpPrompts.length) {
            // Out of range, exit
            closeTinyHelp('nav');
        } else {
            // Still in range; normal
            helpCounter += skip;
            helpText = helpPrompts[helpCounter] + append_footnote(false, false);

            TINYHELP.box.show(helpText, 0, 400, 0, 0);

            playSFX(AUDIO_NAV_MOVE, 'nav');
            tinyContent = document.getElementById('tinycontenthelp');
            voice([tinyContent]);
        }
    }
}

/**
 * Based on params, this function returns a string of an HTML EZ Access Help Footnote
 * @param isFirst If the first EZ Help dialogue
 * @param isLast If the last (or last 'warning of falling off help') dialogue
 * @returns {string} HTML EZ Access Help Footnote, containing <hr>, and relevant <p>s.
 */
function append_footnote(isFirst, isLast) {

    var ret = '';

    var repeat = "To repeat this message, press the round EZ Action button.";
    var more = "For more Help, touch the EZ Down arrow button.";
    var leave = "To leave Help, touch the EZ Help button.";

    ret += '<hr>';

    if (isFirst) {
        ret += '<p style="text-align:center">' + repeat + '</p>';
    }

    if (!isLast) {
        ret += '<p style="text-align:center">' + more + '</p>';
    }

    ret += '<p style="text-align:center">' + leave + '</p>';


    return ret;
}

/**
 * Cleanup in closing a Tiny Box (lightbox)
 * @param source ['nav'|'point'] Navigation method
 * Mostly for when clicking outside of lightbox and it closes itself.
 */
function closeTinyHelp(source) {
    if (!helpJustOpened) {
        if (ez_navigateToggle) {
            ez_navigate('top');
        }
        voice(selectedEls, {source: source, pre: 'EZ Help Closed. '});
    } else {
        voice('');
    }

    // Show EZ Highlight
    if (document.getElementById(ezSelectorId)) document.getElementById(ezSelectorId).style.visibility = '';

    playSFX(AUDIO_NAV_MOVE, 'nav');
    TINYHELP.box.hide();
    tinyHelpOpen = false;
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
    var attr = '';
    /**
     * Whether the function should end or not.
     * @type {boolean}
     */
    var end;

    if (obj.hasAttribute('data-ez-help')) {
        attr = obj.getAttribute('data-ez-help');
    } else if (obj.tagName === 'BODY') {
        attr = 'default#keypad8';
    }

    if (attr !== '') {

        //See if this function needs to make a recursive call
        end = attr.slice(-TERMINATOR.length) === TERMINATOR;

        ret = attr.split(DELIMITER);

        for (var i = 0; i < ret.length;) {
            if (ret[i] == '' || ret[i] === null) {
                ret.splice(i, 1);
            } else {
                var parsedRet = parseHelpPageString(ret[i]);
                // Merge this array at pos; delete ret[i]
                ret.splice(i, 1);
                ret.splice.apply(ret, [i, 0].concat(parsedRet));
                i += parsedRet.length;
            }
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

        if (isArray({o: recursive}) && recursive !== null) {
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
 * Takes a string for a single help layer (from the data-ez-help attribute)
 * and parses it. If the string is a reference to a part of another file,
 * then the proper string from that file is returned. If the string is not a
 * reference, it is cleaned up so that only plain text remains.
 * @param s {string} The single help layer string to be parsed.
 * @return {string[]} The resulting layer(s) from the parsing.
 */
function parseHelpPageString(s) {
    /**
     * The string to be returned.
     */
    var ret;

    //First check if the string is a reference to another string
    if (s.indexOf('#') !== -1) {

        // Potentially ID-referencing
        var ref = s.split('#');

        if (ref[0].trim().length === 0) {
            //Referencing ID of el on current page

            //Hashes are *not* allowed in IDs (http://goo.gl/YgTLi), but get
            //rest just to be safe.
            id = s.slice(s.indexOf('#') + 1);

            div = document.getElementById(id);

            ret = getHelpFromObj(div, 'current page', id);

            if (ret !== null) return ret;

        } else {
            // (Potentially) referencing an external file
            var url = ref[0];
            var ext = url.slice(url.lastIndexOf('.') + 1);

            if (ext == 'htm' || ext == 'html') {
                // Forms URL: HTM or HTML. Still don't know if exists
                var externalDocument = getDocument(url);
                if (externalDocument !== null) {
                    // Document exists. Still don't know if specific ID exists

                    var id = s.slice(s.indexOf('#') + 1);
                    var div = externalDocument.getElementById(id);

                    ret = getHelpFromObj(div, url, id);

                    if (ret !== null) return ret;

                } else {
                    // Document doesn't exist; is an error
                    console.log("Error: Could not find file '" + url + "' for help layers");
                }
            } else if (url === 'default') { // Default file
                var doc = document.implementation.createHTMLDocument("");
                doc.body.innerHTML = DEFAULT_HELP;

                var id = s.slice(s.indexOf('#') + 1);
                var div = doc.getElementById(id);

                ret = getHelpFromObj(div, url, id);

                if (ret !== null) return ret;

            } // ELSE: Invalid URL; not an error: Could just be a normal file
        }
    } // ELSE: Content is string (as-is)

    ret = new Array(s);
    return ret;
}

/**
 * Gets help information from an object.
 * @param obj Object to look for help layers from.
 * @param url For console debugging: URL of HTML file looking inside for object.
 * @param id For console debugging: ID of element.
 * @returns {string[]} Returns array of strings of 'help layers' that can be used from a given object.
 */
function getHelpFromObj(obj, url, id) {
    if (obj !== null) {
        if (obj.hasAttribute('data-ez-help')) {
            var sections = obj.getElementsByTagName('section');
            if (sections.length == 0) {
                console.log("Error: No sections in ID '" + id + "' with data-ez-help attribute in '" + url + "' for help layers");
            } else {
                var tempSecs = [];
                for (var i = 0; i < sections.length; i++) {
                    tempSecs[i] = sections[i].innerHTML;
                }
                return tempSecs;
            }
        }
        return new Array(obj.innerHTML);
    } else {
        console.log("Error: Could not find ID '" + id + "' in '" + url + "' for help layers");
    }
    return null;
}

/**
 * Create XMLHttpRequest to get HTML file of help layers on page load.
 * @type {XMLHttpRequest}
 */
var xmlhttp = new XMLHttpRequest();

/**
 * Gets
 * TODO DOM Parser can break! No error message provided if it does.
 * @param {string} url Location (relative to current page) of help layers reference file.
 * @returns {HTMLDocument|null} Returns DOM of URL requested.
 */
function getDocument(url) {
    xmlhttp.open("GET", url + '?t=' + new Date().getTime(), false); // TODO : Disable caching for troubleshooting
    xmlhttp.send();
    if (xmlhttp.status == 200) {
        var xmlString = xmlhttp.responseText,
            doc = document.implementation.createHTMLDocument("");
        doc.body.innerHTML = xmlString;
        // returns a HTMLDocument, which also is a Document.
        return doc;
    } else {
        return null;
    }
}