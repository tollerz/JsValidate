// gives access to $ (jQuery), the window and document within the plugin.
;(function($, window, document, undefined) {

    /**
     * The name of the plugin
     * @type {String}
     */
    var validate = 'validate',  

    /**
     * Default options set via the plugin. 
     */
    defaults = {
        rules: {},
        verification: {},
        debug: false,
        onchange: true,
        valid: false,
        onsubmit: true,
        highlight: true,
        onchangeElements: ['select', 'checkbox', 'file', 'textarea'],
        onkeyupElements: ['text', 'textarea'],
        errorList: [], //list of elements with validation failures.
        passList: [],
        errorMessage: $("<span class='validation-error' id='message'></span>")
    };

    /**
     * Create the validate class
     * @param {String} form    The ID of the form to be validated.
     * @param {Object} options The options provided by the user for the forms validation.
     */
    function Validate( form, options) {
        this.$form = $(form);
        
        this.options = $.extend( {}, defaults, options);

        this._defaults = defaults;

        this._name = validate;

        return this;
    }

    /**
     * Prototype the validate class
     * This contains all the methods that can be called by all instances of the class.
     */
    Validate.prototype = {

        /**
         * The init function runs all validate and verify rules.
         */
        validation: function() {
            this.options.errorList = [];

            this.checkAll(this.options.rules);
            this.checkAll(this.options.verification);
        },

        /**
         * Loop through the list of rules and run the required check.
         * @param  {Object} checks    The list of rules that should be run.
         */
        checkAll: function(checks) {
            var form = this.$form;
            var $this = this;

            $.each(checks, function(element, value) {
                var element = $(form.find('#' + element));
                $this.checkValidity(element);
            });
        },

        /**
         * Run all the checks specified for the given element.
         * @param  {jQuery} element The element selected by jQuery.
         */
        checkValidity: function(element) {
            var $this = this;
            var value = $this.elementValue(element);
            var validationChecks = element.data('rules');
            var verificationChecks = element.data('verification');

            // run validation checks
            if (validationChecks !== undefined) {
                $.each(validationChecks, function(checkType, details) {
                    console.log('validating ' + value + ' = ' + $this.validateCheck(checkType, value, element));
                    validationChecks[checkType].valid = $this.validateCheck(checkType, value, element);
                });
            }

            // run verification checks
            if (verificationChecks !== undefined) {
                $.each(verificationChecks, function() {
                    $this.verifyCheck(value, element, $this);
                });
            }

            $this.updateErrorList(element, validationChecks);
            $this.displayErrors(element, validationChecks);
        },

        // validate a single rule for the given element.
        validateCheck: function(ruleType, value, element) {
            var parameter = this.options.rules[element.prop('id')][ruleType];
            return this.validate[ruleType](value, element, parameter);
        },

        // The validator (this) is passed so that the errorslist can be updated
        // by a completed ajax request.
        verifyCheck: function(value, element, validator) {

            var url = element.data('verification').ajax.url + value;

            if (value === '') {
                return false;
            }
            else {
                return this.verify.ajax.initiate(element, url, validator);
            }
        },

        // Remove the element from the errorList, and re-add if it is still invalid.
        updateErrorList: function(element, checkType) {
            var $this = this;
            var errorList = this.options.errorList;
            var elementName = element.prop('id');

            $this.removeError(elementName, errorList);

            $.each(element.data(checkType), function(ruleType, details) {
                if(!element.data(checkType)[ruleType].valid) {
                    $this.addError(elementName, errorList);
                }
            });
        },

        // Add an element to the errorList.
        addError: function(element, list) {
            if(list.indexOf(element) === -1) {
                list.push(element);
            }
        },

        // Remove an element from the errorList
        removeError: function(element, list) {
            var index = list.indexOf(element);
           
            if ( index > 0 ) {
                list.splice(index, 1);
            }
        },

        // Display errors for all failed fields.
        // take into account select2 inputs.
        displayErrors: function(element, checkType) {
            var $this = this;
            var selector = element.prop('id');
            var errorEnabled = false;
            var formatElement = element;

            if ($(element).prop('tagName').toLowerCase() === 'select' && (element.prev('div').hasClass('select2-container'))) {
                formatElement = $(element.prev('div'));
            }

            $this.reset(formatElement);
            
            if ( $.inArray(selector, this.options.errorList ) >= 0) {
                $.each( element.data( checkType ), function( ruleType, details ) {

                    if ( !details.valid && !errorEnabled) {
                        var errorMessage = $this.options.errorMessage;
                        formatElement.parent().append((errorMessage).append(details.message));
                        
                        if ($this.options.highlight) {
                            formatElement.css('border', '2px solid #b94a48');
                        }

                        errorEnabled = true;
                    }
                });
            }
        },

        // Reset the error details against a given element.
        // since the error element is currently displayed at the same level as the input
        // the parent element is used to find the #errorMessage element for removal.
        reset: function(element) {
            element.parent().find('#message').remove();
            this.options.errorMessage = $('<span class="validation-error" id="message"></span>');
            element.attr('style', '');
        },

        // If any error remain form is still invalid.
        formValid: function() {
            return this.options.errorList.length === 0;
        },

        /**
         * Set the rule for all valid inputs.
         *
         * rule object
         * @example
         *      {required: "this field is required", number: "must be a number"}
         * @return {Boolean} returns false if there is an invalid input type.
         */
        setuprules: function() {
            var $this = this;
            // will need to check the elements that are in the options and bind change events to them.
            $.each(this.options.rules, function(id, rules){

                var form = $this.$form;
                var input = $(form.find('#' + id));
                var inputType = $this.inputtype(input);

                if (!$this.validinputtype(input)){
                    console.error('Element with id "' + id + '" is a <' + inputType + '> and not a valid form element.');
                    $this.removeRule(input.prop('id'));
                    return;
                }
                // store rules against the input element.
                input.data('rules', $this.setValidationRules(rules));
                $this.seteventhandler(input, inputType);
            });

            // do the same again for the verify rules (this duplicated code will need to be removed)
            $.each(this.options.verification, function(id, verification){

                var form = $this.$form;
                var input = $(form.find('#' + id));
                var inputType = $this.inputtype(input);

                if (!$this.validinputtype(input)){
                    console.error('Element with id "' + id + '" is a <' + inputType + '> and not a valid form element.');
                    $this.removeRule(input.prop('id'));
                    return;
                }
                // store rules against the input element.
                input.data('verification', $this.setVerificationRules(verification));
                
                $this.seteventhandler(input, inputType);
            });


            // Setup event handler for on submit
            if (this.options.onsubmit === true) {
                $this.seteventhandler(this.$form, 'submit');
            }
        },

        // Build the rules for an element setting validity at false.
        setValidationRules: function(rules) {
            var $this = this;
            var validationRules = {};
            
            $.each(rules, function(rule, value) {
                validationRules[rule] = {
                            'message': value,
                            'valid'  : false
                         }
            });

            return validationRules;
        },

        // Build the verification rules for an element.
        setVerificationRules: function(rules) {
            var $this = this;
            var verficationRules = {};
            
            $.each(rules, function(rule, value) {
                verficationRules[rule] = {
                            'message'    : value[0],
                            'url'        : value[1],
                            'valid'      : false,
                            'inprogress' : false
                         }
            });

            return verficationRules;
        },

        /**
         * Check if the user has specified a custom function.
         */
        defineCustomFunction: function(value) {
            if (typeof value === 'function'){
                return value;
            }
            else {
                return function() {return false;}
            }
        },

        // Delete the rules for a given input (usually this will be to ignore invalid element assignments 
        // when the plugin is instatntiated)
        removeRule: function(input) {
            delete this.options.rules[input];
        },

        // Based on the input type set the event handlers.
        seteventhandler: function(input, inputType) {
            var $this = this;
            
            // if onchange === true set change event handlers
            if (this.options.onchange) {
                if ($.inArray(inputType, this.options.onchangeElements) !== -1) {
                    input.on(
                        'change', 
                        function() {
                            $this.onchange(input);
                        });
                }

                if ($.inArray(inputType, this.options.onkeyupElements) !== -1) {
                    input.on(
                        'keyup blur', 
                        function() {
                            $this.onkeyup(input);
                        });
                }
            }

            if (inputType === 'submit'){
                input.on(
                    'submit',
                    function( event ) {
                        $this.onsubmit(event);
                    });
            }

        },

        /**
         * Manage on submit event
         * This will need to ensure that Ajax scripts have finished before submitting.
         * 
         * @param  {Event} event   The submit event
         * @return {Boolean}       Return false if the form is not ready to be submitted.
         */
        onsubmit:function(event) {
            //If debug mode set then never submit the form.
            if (this.options.debug) {
                event.preventDefault();
                return false;
            } 

            this.validation();

            // if Ajax requests not complete do not submit.
            // (code to check Ajax need to goes here)
    
            if(!this.formValid()){
                event.preventDefault();
                return false;
            }
        },

        // The onkeyup event
        onkeyup: function(element) {
            this.checkValidity(element);
        },

        // The onchange event
        onchange: function(element) {
            this.checkValidity(element);
        },

        // Check if the element is a valid input type for a form.
        validinputtype: function(element) {
            return element.is('select, input, textarea, file, text');
        },

        // Return the input type as a string.
        inputtype: function(element) {
            var type = '';

            type = $(element).prop('tagName').toLowerCase();

            // If an input, get the input type.
            if (type === 'input'){
                return $(element).prop('type');
            }
            
            return type; 
        },

        // Return the value of the given form element.
        elementValue: function(element) {
            var val,
            $element = $( element ),
            type = element.type;

            if ( type === 'radio' || type === 'checkbox' ) {
                return $( 'input[name="' + element.name + '"]:checked' ).val();
            } 

            val = $element.val();

            if ( typeof val === 'string' ) {
                return val.replace(/\r/g, '' );
            }

            return val;
        },

        // Methods to check inputs value is correct.
        validate: {
            required: function(value) {
                return $.trim( value ).length > 0;
            },

            number: function(value) {
                return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test( value );
            },

            email: function(value) {
                // From http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
                return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test( value );
            },
            
            noSymbols: function(value) {
                return /^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$/.test(value);
            },

            maxLength: function(value, element, parameter) {
                element.data('rules').maxLength.message = 'must be less than ' + parameter + ' characters long, currently ' + value.length;
                return value.length <= parameter;
            },

            minLength: function(value, element, parameter) {
                element.data('rules').minLength.message = 'must be more than ' + parameter + ' characters long, currently ' + value.length;
                return value.length >= parameter;
            },

            rangeLength: function(value, element, parameter) {
                element.data('rules').rangeLength.message = 'must be between ' + parameter[ 0 ] + ' and ' + parameter[ 1 ] + ' characters long, currently ' + value.length;
                return value.length >= parameter[ 0 ] && value.length <= parameter[ 1 ];
            }
        },

        verify: {
            ajax: {
                ajaxRequest: null,
                requestTime: null,

                // Begin a new Ajax request (an existing request will be aborted).
                // Thismay require a way of managing different requests based on the urls provided.
                initiate: function(element, url, validator) {
                    if (this.ajaxRequest !== null) {
                        this.ajaxRequest.abort();
                    } 
                    clearTimeout(this.requestTimer);

                    element.data('verification').ajax.inprogress = true;

                    this.requestTimer = setTimeout(this.request(url), 350);
                    this.response(element, validator);
                },

                // Initiate an ajax request.
                request: function(url) {                 
                    this.ajaxRequest = $.ajax({
                        type:'GET',
                        url: url
                    });
                },

                // Deal with the ajax response.
                response: function(element, validator) {
                    this.ajaxRequest.done(function(data) {
                        var value = $.parseJSON(data);
                        valid = value === 'true' || value === true;
                        element.data('verification').ajax.valid = valid;

                        validator.updateErrorList(element, 'verification');
                        validator.displayErrors(element, 'verification');

                        element.data('verification').ajax.inprogress = false;
                    });
                }
            }
        }
    };

    // A really lightweight plugin wrapper around the constructor, 
    // preventing multiple instantiations.
    $.fn[validate] = function( options ) {
        return this.each( function() {
            if ( !$.data( this, 'validate' )) {
                var validate = $.data( this, 'validate', new Validate( this, options ));
            }
            validate.setuprules();
        });
    };

}) ( jQuery, window, document );