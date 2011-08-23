/*
 * jquery-inputs is a jQuery plugin that allows set/get on form inputs using hierarchical JSON structures
 *
 * Forked from: http://github.com/dshimkoski/jquery-inputs/
   The following significant changes were applied:
   - plethora of delimiters was dropped, simplifying name -> keys chain parsing into simple .split()
     Only dot is now supported as a key separator:  keyA.keyB.keyC = value
   - JavaScript version required was upped to 1.6 (to simplify array lookup and iterating logic). 
     This means you pretty much must load some JS16 shims like 'augment.js' for old broswers to work with this plugin.
 *
 * MIT license: http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright (c) 2011, Denny Shimkoski (denny.webdev -[at]- gmail -[dot]- com )
 * Copyright (c) 2011, Daniel Dotsenko (ddotsenko -[at]- walnutcomputing -[dot]- com )
 */
 (function($, undefined){
	
	var methods = {
		set: function(values) {
			// jquery form (technically could be any element with nested inputs)
			var $form = $(this);
			// loop through form inputs
			$form.find(':input').each(function(){
				// jquery input
				var $input = $(this);
				// reference value structure
				var lookup = values;
				// set update flag to true
				var update = true;
				// clear input
				clearInput( $input );
				// array of keys representing fully qualified value in json tree
				var keys = $input.attr('name').split('.')
				// use keys for hierarchical lookup
				for( var i = 0, len = keys.length; i < len; i++ ) {
					var key = keys[i];
					// no need to hunt further
					if( !lookup[key] ) {
						// set update to false to indicate failed lookup
						update = false;
						break;
					}
					// drill down into value structure
					lookup = lookup[key];
				}
				// lookup succeeded
				if( update ) {
					//console.log('setting value', keys.slice(0, i + 1).join('_'), lookup);
					if( $input.is(':checkbox, :radio') ) {
						if( $.isArray(lookup) ) {
							for( var i = 0, len = lookup.length; i < len; i++ ) {
								$input.filter('[value='+lookup[i]+']').attr('checked', true).data('defaultValue', true)
							}
						} else {
							$input.filter('[value='+lookup+']').attr('checked', true).data('defaultValue', true)
						}
					} else {
						$input.val(lookup).data('defaultValue', lookup)
					}
				}
			});
		},
		get: function() {
			// scope for processInput() writes
			var scope = {};
			// serialize form values
			$.each(
				$(this).serializeArray()
				, function(){
					// log("This is get's scope for name and values "+ this.name + ' ' + this.value)
					// processInput( this.name, this.value, scope );
					applyValueToScope(this.name, this.value, scope)
					// log(scope)
				}
			);
			// scope will return value structure
			return scope;
		}
	};

	function applyValueToScope(name, value, scope) {
		var keychain = name.split('.')
			,lastkey = keychain.pop()
			,currentscope = scope
			,tmpscope = currentscope
		keychain.forEach(function(key){
			tmpscope = currentscope[key]
			if (tmpscope == null) {
				currentscope[key] = {}
			}
			else {
				if (!$.isPlainObject(tmpscope)) {
					throw new TypeError("Value cannot be assigned to key '"+name+"' as another element on this path terminates with an non-object object.")
				}
			}
			currentscope = currentscope[key]
		})

		// log("Testing pre lastkey for name, value: " + name + " " + value)
		// log(scope)
		// log(lastkey)
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
					// log("Offending value:")
					// log(tmpscope)
					throw new TypeError("Value cannot be assigned to key '"+name+"' as another element on this path continues with object chain.")
				}
			}
		}
	}

	function clearInput($input) {
		if( $input.is(':checkbox, :radio') ) {
			$input.attr('checked', false);
		} else {
			$input.val('');
		}
	}

	$.fn.inputs = function(method) {
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.inputs' );
		}
	};

})(jQuery);
