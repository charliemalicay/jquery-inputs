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

    var getfn = function(jqselector) {
        /* when provided, jqselector is a string that allows to select only input elements that are children of 
        the stated selector. The selector is still evaluated in the context of "this" - the element on which you call .inputs('get')
        Example calls with selector:
        $(elem).inputs('get', '.changed')
        This way only :input-matching elems that either have class 'changed' or are children of elems with class 'changed'
        will be selected.
        */
        log(this)
        var $i
        if (jqselector) {
            $i = $(jqselector, this) // 'this' can be non-form. $.serialize* do not work on non-form or non-input obj. 
            $i = $i.filter(':input').add($i.find(':input'))
        } else {
            $i = $(':input', this) // 'this' can be non-form. $.serialize* do not work on non-form or non-input obj. 
        }

        var scope = {}
        $.each(
            $i.serializeArray()
            , function(){ 
                applyValueToScope(this.name, this.value, scope) 
            }
        )
        return scope
    }

    var applyValueToScope = function(name, value, scope) {
        var keychain = name.replace('_','.').split('.')
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
    
    var setfn = function(values) {
        // jquery form (technically could be any element with nested inputs)
        var $form = $(this)
        // loop through form inputs
        $form.find(':input').each(function(){
            var $input = $(this)
                , keys = $input.attr('name').replace('_','.').split('.')
                , setflag = true
                , scope = values
            keys.forEach( function(key) {
                try {
                   scope = scope[key]
                   if( scope == undefined ) {
                       throw new TypeError("jQuery.Input: Path traversal in data object for '"+ key +"' of '" + $input.attr('name') + "' was cut short by an incompatible object")
                   }
                }
                catch (ex) {
                   setflag = false
                }
            })
            
            if ( $input.is(':checkbox, :radio') ) {
                $input.attr('checked', false).data('defaultValue', false)
                if ( setflag ) {
                    if ( Array.isArray(scope) ) {
                        if  ( scope.some( 
                                function(item) {
                                    return ( $input.attr('value') == new String(item) )
                                })
                            ) {
                            $input.attr('checked', true).data('defaultValue', true)
                        }
                    } else if ( $input.attr('value') == new String(scope) ) {
                        $input.attr('checked', true).data('defaultValue', true)
                    }
                }
            } else if (setflag) {
                $input.val(scope).data('defaultValue', scope)
            } else {
                $input.val('').data('defaultValue', '')
            }
        })
    }
 
    var methods = {
        set: setfn,
        get: getfn
    }

    $.fn.inputs = function(method) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ))
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.inputs' )
        }
    }

})(jQuery)
