# Release Notes #

Release notes and history for stable versions.


## v. 1.0 ##
DATE - The initial stable release.

### Major features ###
  * Navigation via EZ Access keypad (by Storm Interface) and available at:
    * Newark as non-stocked items ([5-key](http://www.newark.com/storm-interface/ez05-210013/switch-keypad/dp/08N3389) & [8-key](http://www.newark.com/storm-interface/ezo8-210013/switch-keypad/dp/10N9962))
    * Digi-Key ([5-key](http://www.digikey.com/product-detail/en/EZ05-222013/MGR1630-ND/1534149) & [8-key](http://www.digikey.com/product-detail/en/EZ08-222013/EZ08-222013-ND/1534150))
    * Directly from [Storm Interface](http://www.storm-interface.com/products_description.asp?id=9) for large orders
  * Speech output through Chrome using the operating system API and voices
  * Customizable navigation highlight
  * Slide-to-read
  * Customizable help

### Limitations ###
This version works properly with systems that use touchscreen through dedicated touchscreen drivers and input methods. Touchscreens that implement mouse-type input will not behave the same and transition properly between EZ Access and touchscreen modes, but will be usable.
  * At this point, touch screen input is best supported in Windows 7 and 8.

### Elements completely supported ###
The following interactive elements are completely supported by v. 1.0.
  * Buttons
    * `<input type="button"`, `"submit"`, or `"reset"` `/>`
    * `<button>` of all types
    * Elements with `aria-role="button"`
  * Checkboxes
    * `<input type="checkbox" />`
    * Elements with `aria-role="checkbox"`
  * Radio buttons
    * `<input type="radio" />`
    * Elements with `aria-role="radio"`
  * Hyperlinks
    * `<a href="`...`">`
    * Elements with `aria-role="link"`
  * Clickable elements with `onclick` attribute

Other interactive elements are navigable and will be read to the user, but may not behave as expected in this version.