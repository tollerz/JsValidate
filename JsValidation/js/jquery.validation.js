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
        submitHandler: "",
        highlight: true,
        onchangeElements: ['select', 'checkbox', 'file', 'textarea'],
        onkeyupElements: ['text', 'textarea'],
        passList: [],
        errorsMap: {}, // A map to store multiple errorLists based on the type of check being ran.
        inFocus: false
    };

    /**
     * Create the validate class
     * @param {String} form    [The ID of the form to be validated.]
     * @param {Object} options [The options provided by the user for the forms validation.]
     */
    function Validate( form, options) {
        $this = this;

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
        validation: function(checkType) {
            this.checkAll(this.options[checkType]);
        },

        /**
         * Loop through the list of rules and run the required check.
         * @param  {Object} checks    [The list of rules that should be run.]
         */
        checkAll: function(checks) {
            var $this = this;
            var form = $this.$form;
            
            $.each(checks, function(element, value) {
                var element = $(form.find('#' + element));
                $this.checkElement(element);
            });
        },

        /**
         * Run all the checks specified in the 'data' of the given element.
         * @param  {jQuery} element [The element selected by jQuery.]
         */
        checkElement: function(element) {
            var $this = this;

            var value = $this.elementValue(element);
            var validationChecks = element.data('rules');
            var verificationChecks = element.data('verification');

            // Run validation checks.
            if (validationChecks !== undefined) {
                $.each(validationChecks, function(check, details) {
                    validationChecks[check].valid = $this.validateCheck(check, value, element);
                });
            }

            // Verification checks set the 'valid' value themselves due to waiting for Ajax response.
            if (verificationChecks !== undefined) {
                $.each(verificationChecks, function() {
                    $this.verifyCheck(value, element, $this);
                });
            }
            
            $this.updateErrorList(element, 'rules');
            $this.displayErrors(element, 'rules');
        },

        /**
         * validate a single rule for the given element.
         * 
         * @param  {String} check    [The validation check to run.]
         * @param  {String} value    [The value of input to validate against]
         * @param  {jQuery} element  [The form field being validated]
         * @return {Boolean}         [True if the value passes the validation check]
         */
        validateCheck: function(check, value, element) {
            var parameter = this.options.rules[element.prop('id')][check];
            return this.validate[check](value, element, parameter);
        },

        /**
         * Run all specified verification checks against an element.
         * 
         * @param  {String} value     [The value of input to verfy]
         * @param  {jQuery} element   [The form field being verified]
         * @param  {Object} validator ['this', passed so that the errorlist can be updated by the completed Ajax]
         * @return {Boolean}          [Return false if the value of the form field is not verifiable]
         */
        verifyCheck: function(value, element, validator) {
            var url = element.data('verification').ajax.url + value;

            if (value === '' || value ===  null) {
                return false;
            }
            else {
                this.verify.ajax.initiate(element, url, validator);
            }
        },

        /**
         * Update the error list with the id's of all elements currently failing 
         * either validation or verification.
         * 
         * @param  {jQuery} element   [The form field to check is valid.]
         * @param  {String} checkType [The type of check to lookup the validity for]
         */
        updateErrorList: function(element, checkType) {
            var $this = this;

            var errorList = this.options.errorsMap[checkType];
            var elementName = element.prop('id');

            $.each(element.data(checkType), function(ruleType, details) {
                if(!element.data(checkType)[ruleType].valid) {
                    $this.addError(elementName, errorList);
                }
                else {
                    $this.removeError(element, errorList, checkType);                
                }
            });
        },

        /**
         * Check if an element is in the error list.
         * 
         * @param  {jQuery} element [The form field to check]
         * @return {Boolean}        [True if there is currently and error for the form field]
         */
        hasError: function(element, list) {
            return $.inArray(element.prop('id'), list) >= 0
        },

        /**
         * Add a form fields id to the list of elements failing validation.
         * 
         * @param {String} elementName [The id of the for field]
         * @param {Array}  list    [The list of errors to update]
         */
        addError: function(elementName, list) {
            if(list.indexOf(elementName) === -1) {
                list.push(elementName);
            }
        },

        /**
         * Remove a form fields id from the list of elements failing validation.
         * 
         * @param  {String} elementName [The id of the form field]
         * @param  {Array}  list    [The list of errors to update]
         */
        removeError: function(element, list, checkType) {
            var invalidElement = false;

            $.each(element.data(checkType), function(check, details) {
                if (!details.valid) {
                    invalidElement = true;
                }
            });

            if (!invalidElement) {
                var index = list.indexOf(element.prop('id'));
                
                if ( index >= 0 ) {
                    list.splice(index, 1);
                }
            }
        },

        /**
         * Create an error message element.
         * @param {String} message [The text to display in the error container]
         * @return {String}        [The error container]
         */
        createErrorMessage: function(message) {
            var errorContainer = $('<span class="validation-error" id="message"></span>');
            return errorContainer.append(message);
        },

        /**
         * Reset the error details against a given element.
         * Since the error element is currently displayed at the same level as the input
         * the parent element is used to find the  #errorMessage element for removal.
         *
         * By introducing a popover/tooltip error notification it may be possible to get around this.
         * 
         * @param  {jQuery} element [The form field to reset the error message for.]
         */
        removeErrorMessage: function(element) {
            element.parent().find('#message').remove();
            element.attr('style', '');
        },

        /**
         * Display the errors for all failed fields.
         *     (This has to take into account select2 form fields as styling will 
         *      will need to be appended to a different element than normal.)
         *
         * @param  {jQuery} element   [The form field to display the error for]
         * @param  {String} checkType [The type of check]
         */
        displayErrors: function(element, checkType) {
            var $this = this;

            var selector = element.prop('id');
            var errorEnabled = false;
            var formatElement = element;
           
            if ($(element).prop('tagName').toLowerCase() === 'select' && (element.prev('div').hasClass('select2-container'))) {
                formatElement = $(element.prev('div')).attr('tabindex', '-1');
            }

            $this.removeErrorMessage(formatElement);
            
            if ($this.hasError(element, $this.options.errorsMap[checkType])) {
                $.each(element.data(checkType), function(ruleType, details) {
                    
                    if (!details.valid && !errorEnabled) {                      
                        formatElement.parent().append($this.createErrorMessage(details.message));
                        if ($this.options.highlight) {
                            formatElement.css('border', '2px solid #b94a48');
                        }
                        if(!$this.options.inFocus) {
                            formatElement.focus();
                            $this.options.inFocus = true;
                        }

                        errorEnabled = true;
                    }
                });
            }
        },

        /**
         * If any error remains in any of the errorlists then the form is still invalid.
         * 
         * @return {Boolean} [True if no errors]
         */
        formValid: function() {
            var valid = true;

            $.each(this.options.errorsMap, function() {
                if (this.length > 0) {
                    valid = false;
                }
            });

            return valid;
        },

        /**
         * Prepare the form for validation by setting the required checks on the form fields 'data'
         * property and applying the required event handlers.
         */
        prepareForm: function() {
            var $this = this;
            var form = $this.$form;
            
            // Add novalidate tag for HTML5 compatible browsers.
            form.attr( "novalidate", "novalidate" );

            this.applyRules(this.options.rules, 'rules', this.setValidationRules);
            this.applyRules(this.options.verification, 'verification', this.setVerificationRules);

            this.options.errorsMap['rules'] = [];
            this.options.errorsMap['verification'] = [];

            // If a submit handler has been provided then do not submit the form.
            if(this.options.submitHandler !== "") {
                form.off('submit').on('submit', function(event) {
                    event.preventDefault();
                });
            }
            // Setup event handler for on submit
            $this.submitHandler(form);
        },
        /**
         * The validator must handle the submission of the form so that it is not submit until after 
         * all the validation has complete, to do this the submit button must be disabled.
         * 
         * @param  {Element} form [the form being validated]
         */
        submitHandler: function(form) {
            //disable the existing submit button.
            var submitButton = $('input[type=submit]', form);
            submitButton.prop('type', 'button').prop('name', 'name');
            this.seteventhandler(submitButton, 'submit');
        },

        /**
         * Set the options provided by the user to the 'data' property of each specified form field.
         * The event handlers are set for each element at this time.
         * 
         * @param  {Object}   options   [The checks specified by the user]
         * @param  {String}   checkType [The type of checks (Validation or Verification)]
         * @param  {Function} buildCheckDetails  [The function to build check details to set against the form field]
         */
        applyRules: function(options, checkType, buildCheckDetails) {
            var $this = this;

            $.each(options, function(id, check){
                var input = $($this.$form.find('#' + id));
                var inputType = $this.inputtype(input);

                if (!$this.validinputtype(input)){
                    console.error('Element with id "' + id + '" is a <' + inputType + '> and not a valid form element.');
                    $this.removeRule(id);
                    return;
                }

                input.data(checkType, buildCheckDetails(check));
                $this.seteventhandler(input, inputType);
            });
        },

        /**
         * From the checks provided build an object to keep track of the status of each validation check.
         * 
         * @param {Object} checks [The checks]
         */
        setValidationRules: function(checks) {
            var validationChecks = {};

            $.each(checks, function(check, value) {
                validationChecks[check] = {
                            'message': value,
                            'valid'  : false
                         }
            });

            return validationChecks;
        },

        /**
         * From the checks provided build an object to keep track of the status of each verification check.
         * 
         * @param {Object} checks [The checks]
         */
        setVerificationRules: function(checks) {
            var verficationChecks = {};
            
            $.each(checks, function(check, value) {
                verficationChecks[check] = {
                            'message'    : value[0],
                            'url'        : value[1],
                            'valid'      : false
                         }
            });

            return verficationChecks;
        },

        /**
         * Delete the rules for a given input.
         *     (usually this will be to ignore invalid element assignments when the 
         *      plugin is instantiated.)
         *  
         * @param {String} input [The input to remove the rules for]
         */
        removeRule: function(input) {
            delete this.options.rules[input];
        },

        /**
         * Based on the form field input type set the event handlers for the field.
         * 
         * @param  {jQuery} input     [The form field to set the event handler too.]
         * @param  {String} inputType [the type of form field input e.g. 'text', 'textarea', 'select' etc...]
         */
        seteventhandler: function(input, inputType) {
            var $this = this;

            if (this.options.onchange) {
                if ($.inArray(inputType, this.options.onchangeElements) !== -1) {
                    input.off('change').on(
                        'change', 
                        function() {
                            $this.onchange(input);
                        });
                }

                if ($.inArray(inputType, this.options.onkeyupElements) !== -1) {
                    input.off('keyup').on(
                        'keyup', 
                        function() {
                            $this.onkeyup(input);
                        });
                }
            }

            if (inputType === 'submit'){
                input.off('click').on(
                    'click',
                    function() {
                        $this.onsubmit();
                    });
            }
        },

        /**
         * Manage on submit event
         * This will need to ensure that Ajax scripts have finished before submitting.
         */
        onsubmit:function() {
            var $this = this;

            this.options.inFocus = false;
            this.validation('rules');
            if(!this.options.debug){
                this.submitForm($this.$form);
            }
        },

        /**
         * The onkeyup event
         * @param {jQuery} element [The element]
         */
        onkeyup: function(element) {
            this.checkElement(element);
        },

        /**
         * The onchange event
         * @param {jQuery} element [The element]
         */
        onchange: function(element) {
            this.checkElement(element);
        },
        
        /**
         * If all the ajaxRequests are complete and the form is valid then submit.
         * @param  {Element} form [The form being validated]
         */
        submitForm: function(form) {
            var $this = this;

            if (this.verify.ajax.ajaxCount !== 0) {
                setTimeout(function(){$this.submitForm(form)}, 200);
            }
            else {
                // If a submit handler has been provided use that instead of a default form submit.
                if($this.options.submitHandler !== "" && typeof($this.options.submitHandler) === "function" ) {
                    console.info('Calling provided Submit Handler for form submission.')
                    if ($this.formValid()) {
                        $this.options.submitHandler();
                    }
                }
                else {
                    if ($this.formValid()) {
                        console.info('Submitting form by default submit event');
                        form.submit();
                    }
                }
                return true;
            }
        },

        /**
         * Check if the element is a valid input type for a form.
         * 
         * @param  {String} element [The element type]
         * @return {Boolean}        [True if the element is a valid type]
         */
        validinputtype: function(element) {
            return element.is('select, input, textarea, file, text');
        },

        /**
         * Return the input type as a string.
         * 
         * @param  {String} element [The element id to use as a selector]
         * @return {String}         [The 'tagName' of the element or the 'type' if an input field]
         */
        inputtype: function(element) {
            var type = '';

            type = $(element).prop('tagName').toLowerCase();

            // If an input, get the input type.
            if (type === 'input'){
                return $(element).prop('type');
            }
            
            return type; 
        },

        /**
         * Return the value of the given form element.
         * 
         * @param  {String} element [The element id to use as a selector]
         * @return {String}         [The value of the form field]
         */
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

        /**
         * Validation methods
         * @type {Object}
         */
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
                element.data('rules').maxLength.message = 'must be no more than ' + parameter + ' characters long, currently ' + value.length;
                return value.length <= parameter;
            },

            minLength: function(value, element, parameter) {
                element.data('rules').minLength.message = 'must be no less than ' + parameter + ' characters long, currently ' + value.length;
                return value.length >= parameter;
            },

            rangeLength: function(value, element, parameter) {
                element.data('rules').rangeLength.message = 'must be between ' + parameter[ 0 ] + ' and ' + parameter[ 1 ] + ' characters long, currently ' + value.length;
                return value.length >= parameter[ 0 ] && value.length <= parameter[ 1 ];
            }
        },

        /**
         * Verification methods.
         * @type {Object}
         */
        verify: {
            ajax: {
                ajaxRequestsStore: {},
                requestTime: null,
                ajaxCount: 0,

                // Begin a new ajax request and store it against the elements id (since it should always have one);
                initiate: function(element, url, validator) {
                    var elementId = element.prop('id');

                    if (this.ajaxRequestsStore[elementId] !== null && this.ajaxRequestsStore[elementId] !== undefined) {
                        this.ajaxRequestsStore[elementId].abort();
                        this.ajaxCount--;
                    } 

                    clearTimeout(this.requestTimer);

                    this.requestTimer = setTimeout(this.request(url, elementId), 350);
                    this.response(element, elementId, validator);
                },

                // Initiate an ajax request.
                request: function(url, elementId) {  
                    this.ajaxCount++;
                    this.ajaxRequestsStore[elementId] = $.ajax({
                        type:'GET',
                        url: url
                    });
                },

                // Deal with the ajax response.
                response: function(element, elementId, validator) {
                    var $this = this;
                    this.ajaxRequestsStore[elementId].done(function(data) {
                        var value = $.parseJSON(data);

                        valid = value === 'true' || value === true;

                        element.data('verification').ajax.valid = valid;

                        validator.updateErrorList(element, 'verification');
                        validator.displayErrors(element, 'verification');

                        if (validator.hasError(element, validator.options.errorsMap['rules'])) {
                            validator.displayErrors(element, 'rules');
                        }

                        $this.ajaxCount--;
                        $this.ajaxRequestsStore[elementId] = null;
                    });
                }
            }
        }
    };

    /**
     * A lightweight plugin wrapper around the constructor, 
     * preventing multiple instantiations.
     * 
     * @param  {Object} options [the validation/Verification checks specified by the user]
     * @return {this}         [returns an instance of the element the validator is called on]
     */
    $.fn[validate] = function( options ) {
        return this.each( function() {
            if ( !$.data( this, 'validate' )) {
                var validate = $.data( this, 'validate', new Validate( this, options ));
            }
            validate.prepareForm();
        });
    };

}) ( jQuery, window, document );