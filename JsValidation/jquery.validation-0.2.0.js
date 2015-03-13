;(function($, window, document, undefined) {
    // Variables only created once.

    // Name of the plugin
    var validate = 'validate',  

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
        errorMessage: $("<span class='validation-error' style='line-height:22px;  position:absolute;' id='errorMessage'></span>")
    };

    // create the validate class
    function Validate( form, options) {
        this.$form = $(form);
        
        this.options = $.extend( {}, defaults, options);

        this._defaults = defaults;
        this._name = validate;

        return this;
    }

    // Prototype the validate class
    // This contains all the methods that can be called by all instances of the class.
    Validate.prototype = {

        // the init function will need to check the validity of all required elements.
        validation: function() {
            var $this = this;
            var form = this.$form;
            this.options.errorList = [];

            //loop through all validation elements
            $.each(this.options.rules, function(element, value) {
                var element = $(form.find('#' + element));
                
                $this.checkValidity(element);
                $this.updateErrorList(element, 'rules');
            });

            //loop through all verification elements
            $.each(this.options.verification, function(element, value) {
                var element = $(form.find('#' + element));
                
                $this.checkValidity(element);
                $this.updateErrorList(element, 'verification');
            });
        },

        // Validate a single element
        checkValidity: function(element) {
            var $this = this;
            var value = $this.elementValue(element);

            // run validation checks
            $.each(element.data("rules"), function(ruleType, details) {
                element.data("rules")[ruleType].valid = $this.check(ruleType, value, element);
            });

            // run verification checks
            if(element.data("verification") !== undefined) {
                $.each(element.data("verification"), function(ruleType) {
                    $this.verifyCheck(value, element, $this);
                });
            }

            $this.updateErrorList(element, 'rules');
            $this.displayErrors(element, 'rules');
        },

        // validate a single rule for the given element.
        check: function(ruleType, value, element) {
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
            var failure = false;
            var errorList = this.options.errorList;
            var elementName = element.prop('id');

            $this.removeError(elementName, errorList);

            $.each(element.data(checkType), function(ruleType, details) {
                if(!element.data(checkType)[ruleType].valid) {
                    $this.addError(elementName, errorList);
                    failure = true;
                }
            });
        },

        // Add an element to the errorList
        addError: function(element, list) {
            list.push(element);
        },

        // remove an element from the errorList
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
            
            if ($.inArray(selector, this.options.errorList) >= 0) {
                $.each(element.data(checkType), function(ruleType, details) {

                    if (!details.valid && !errorEnabled) {
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
            element.parent().find('#errorMessage').remove();
            this.options.errorMessage = $('<span class="validation-error" id="errorMessage"></span>');
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
                input.data('rules', $this.setrules(rules));
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
                input.data('verification', $this.setVerification(verification));
                
                $this.seteventhandler(input, inputType);
            });


            // Setup event handler for on submit
            if (this.options.onsubmit === true) {
                $this.seteventhandler(this.$form, 'submit');
            }
        },

        // Build the rules for an element setting validity at false.
        setrules: function(rules) {
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
        setVerification: function(rules) {
            var $this = this;
            var verficationRules = {};
            
            $.each(rules, function(rule, value) {
                verficationRules[rule] = {
                            'message': value[0],
                            'url'    : value[1],
                            'valid'  : false
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
                        $this.onsubmit(event, input);
                    });
            }

        },

        // The onsubmit event
        onsubmit:function(event, element) {
            //If debug mode set then never submit the form.
            if (this.options.debug) {
                event.preventDefault();
            } 

            this.validation();
            // If the form is not valid do not submit.

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
                    });
                }
            }
        }
    };

    // A really lightweight plugin wrapper around the constructor, 
    // preventing multiple instantiations.
    $.fn[validate] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'validate')) {
                var validate = $.data(this, 'validate', new Validate( this, options));
            }
            validate.setuprules();
        });
    };

}) ( jQuery, window, document );