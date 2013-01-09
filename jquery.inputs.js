/* @license
  jquery-inputs is a jQuery plugin that allows set/get on form inputs using hierarchical JSON structures

  https://github.com/willowsystems/jquery-inputs

  MIT license: http://www.opensource.org/licenses/mit-license.php

  Copyright (c) 2012, Willow Systems Corporation (ddotsenko -[at]- willow-systems.com )
  Copyright (c) 2011, Denny Shimkoski (denny.webdev -[at]- gmail -[dot]- com )
 */
(function(){
	'use strict'

	var window = this

	var jquery_inputs_appender = function($){

		var applyValueToResults = function(namechain, value, scope) {
			var lastkey = namechain.pop()
			, currentscope = scope
			, tmpscope = currentscope

			namechain.forEach(function(key){
				tmpscope = currentscope[key]
				if (tmpscope == null) {
					currentscope[key] = {}
				} else if (!$.isPlainObject(tmpscope)) {
					throw new TypeError("Value '"+value+"' cannot be assigned to key '"+namechain.join(".")+"' as another element on this path terminates with an non-object object.")
				}
				currentscope = currentscope[key]
			})
			tmpscope = currentscope[lastkey]
			if (tmpscope == null) {
				currentscope[lastkey] = value
			}
			else {
				// ok, there is something already set for that key and competes for space with out value.
				// this may be both ok (it's an array of values, or same exact value)ok, and not ok (any other outcome).
				// we do NOT create arrays by guessing there should be one.
				// our scoped value is still in tmpscope from 5+ lines above
				if (value != tmpscope) {
					if (Array.isArray(tmpscope) && typeof(value) == 'string') {
						// we determined earlier that this is going to be a ordered group of values.
						// Likely a result of checkbox or radio elem group.
						if (tmpscope.indexOf(value) == -1) {
							tmpscope.push(value)
						}
					} else if (typeof(value) == 'string' && typeof(tmpscope) == 'string') {
						currentscope[lastkey] = [tmpscope, value]
					} else {
						throw new TypeError("Value cannot be assigned to key '"+namechain.join(".")+"' as another element on this path continues with object chain.")
					}
				}
			}
		}
		, getNameChain = function(name, separators){
			if (separators.length === 0){
				return [name]
			}
			var sep = separators[0]
			, index = 1
			, len = separators.length

			while (len > index) {
				// found a bug in Chrome "one.two.three".replace(".","_") gives "one_two.three" WTF?!
				// have to use .split(). They say it's even faster than replace...
				name = name.split(separators[index]).join(sep)
				index += 1
			}
			return name.split(sep)
		}
		, getSeparators = function(settings){
			return (settings != null && settings.separators != null) ? settings.separators : ['|','_',':','.']
		}
		, getfn = function(jqselector, settings) {
			/* when provided, jqselector is a string that allows to select only input elements within the jQuery object
			that match the selector The selector is still evaluated in the context of "this" - the element on which you call
			.inputs('get') Example calls with selector:
			$(elem).inputs('get', '.changed')
			This way only :input-matching elems that either have class 'changed' or are children of elems with class 'changed'
			will be selected.

			If you need to pass in settings and NO selector pass falsy value for selector text.

			*/
			var $i
			if (jqselector) {
				$i = $(jqselector, this)
			} else {
				$i = $(this)
			}
			// 'this' can be non-form. $.serialize* do not work on non-form or non-input obj. Need to narrow it down to individual inputs.
			$i = $i.filter(':input').add($i.find(':input'))

			var results = {}
			, separators = getSeparators(settings)
			$.each(
				$i.serializeArray()
				, function(){
					applyValueToResults(getNameChain(this.name, separators), this.value, results)
				}
			)
			return results
		}
		, setfn = function(values, settings) {
			// could be any element with nested inputs)
			var $form = $(this)
			, separators = getSeparators(settings)
			// loop through form inputs.
			// this convoluted selector allows us to find inputs
			// directly in already-selected elements and in their descendants.
			$form.find(':input').add($form.filter(':input')).each(function(){
				var $input = $(this)
				, namechain = getNameChain( $input.prop('name'), separators )
				, setflag = true
				, scope = values
				namechain.forEach( function(key) {
					try {
						scope = scope[key]
						if( scope == undefined ) {
							throw new TypeError("jQuery.Input: Path traversal in data object for '"+ key +"' of '" + $input.prop('name') + "' was cut short by an incompatible object")
						}
					}
					catch (ex) {
						setflag = false
					}
				})

				if ( $input.is(':checkbox, :radio') ) {
					$input.prop('checked', false).data('defaultValue', false)
					if ( setflag ) {
						if ( Array.isArray(scope) ) {
							if  ( scope.some(
									function(item) {
										return ( $input.prop('value') == new String(item) )
									})
								) {
								$input.prop('checked', true).data('defaultValue', true)
							}
						} else if ( $input.prop('value') == new String(scope) ) {
							$input.prop('checked', true).data('defaultValue', true)
						}
					}
				} else if (setflag) {
					$input.val(scope).data('defaultValue', scope)
				} else {
					// we are here when data does not contain value for this field.
					// we are going to pull default value from HTML itself.
					// if 'value="some default"' was provided in the HTML, we will use that.
					// this is good for forms that deal with amounts, where default value
					// is not "" but something like "0.00" and is specified right in the HTML.
					var df = $input[0].defaultValue
					// we are going to mirror that in $.data on the field as well, for
					// centralized default management.
					$input.val(df).data('defaultValue', df)
				}
			})
		}
		, methods = {
			set: setfn,
			get: getfn
		}

		$.fn.inputs = function(method) {
			if (!method) {
				method = 'get'
			}
			if ( methods[method] ) {
				return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ))
			} else {
				$.error( 'Method "' +  method + '" does not exist on jQuery.inputs' )
			}
		}

		return $
	}

	if ( typeof define === "function" && define.amd != null) {
		// AMD-loader compatible resource declaration
		define(['jquery'], function($){if($.fn.inputs == null){return jquery_inputs_appender($)}else{return $}} )
	} else {
		// global-polluting outcome.
		jquery_inputs_appender(window.jQuery)
	}

}).call(this)
