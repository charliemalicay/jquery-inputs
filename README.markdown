# jquery-inputs plugin

jquery-inputs is a jQuery plugin that allows to set/get form inputs using hierarchical JSON structures

This version is a (significant rewrite of and) a deviation on [dshimkoski/jquery-inputs](http://github.com/dshimkoski/jquery-inputs/ "dshimkoski/jquery-inputs"). 

The following backward-INcompatible changes were made on top on original code:

*   .set() now also stores the default value as $(input element).data['defaultValue'] (useful for checking for changes on a per-field basis and coloring the field on-change.)
*   support of underscore and square brackets as separators in input field names is removed. This shaves off a bit of time when parsing long forms. Only dot (".") and underscore ("_") chars are now supported as key names separator.
*   plugin now relies on some JavaScript 1.6+ methods of Object, Array objects. This means you must load a shim (like augment.js) for older browsers (IE less than 9). (Test for Array.isArray and Array.prototype.indexOf support as indicators of needing a shim.)
*   Tunned for operation against jQuery 1.6+ where there is a tangible difference between .attr and .prop. Plugin is not tested against earlier versions, which are subjectively considered not to exist.
*   Plugin is now AMD-loader compatible. You can now simply require(['jquery.inputs'], function($){ /* do things with $ */}) We require 'jquery' internally. Please, insure that you hard-define 'jquery' before loading this plugin by define('jquery', ...   or by setting up a 'path' for it as 'jqeury' in AMD loader's config.

## Usage

Form elements may be named using a dot-delimited or underscore-delimited key name chain. 
For example, "One.Two_Three" will be translated as reference to a value addressed as such in
a JavaScript Object "obj['One']['Two']['Three'] = Value

Add something like this to your page:


	<script src="jquery.js"></script>
	<script src="jquery.inputs.js"></script>
	<form id="demo-form">
		<input type="text" name="demo_text" value="textval" />
		<textarea name="demo.textarea">textareaval</textarea>
		<select name="demo.select" multiple="multiple">
			<option value="option_a" selected="selected">Option A</option>
			<option value="option_b" selected="selected">Option B</option>
		</select>
		<label><input type="radio" name="demo.radio" value="1" />1</label>
		<label><input type="radio" name="demo.radio" value="2" />2</label>
		<label><input type="checkbox" name="demo.checkbox" value="1" />1</label>
		<label><input type="checkbox" name="demo.checkbox" value="2" />2</label>
	</form>


Set/get values via javascript:


	<script>
	jQuery(document).ready(function($) {
		$('#demo-form').inputs('set', {
			demo: {
				text: 'text',
				textarea: 'text',
				radio: 2,
				checkbox: 2, // [1,2]
				select: ['option_a', 'option_b']
			}
		});
		console.log( $('#demo-form').inputs('get') );
	});
	</script>


See tests for more examples.

## License, Copyright

[MIT License](http://www.opensource.org/licenses/mit-license.php)

See source header for full and most current Copyright attributions.
