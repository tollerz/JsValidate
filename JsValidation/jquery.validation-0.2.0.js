;(function($, window, document, undefined) {
    // Variables only created once.

    // Name of the plugin
    var validate = "validate",  

    defaults = {
        rules: {},
        validationError: "validationError",
        debug: true,
        onchange: false,
        valid: false,
        onsubmit: true,
        onchangeElements: ['select', 'checkbox'],
        onkeyupElements: ['text', 'textarea'],
        errorList: [], //list of elements with validation failures.
        errorMap: {},
        errorMessage: $("<span class='alert alert-danger' id='errorMessage'></span>")
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

            //loop through all elements
            $.each(this.options.rules, function(element, value) {
                var element = $(form.find("#" + element));
                
                $this.checkValidity(element);
                $this.updateErrorList(element);
            });
        },

        // Validate a single element
        checkValidity: function(element) {
            var $this = this;

            $.each(element.data("rules"), function(ruleType, details) {
                var value = $this.elementValue(element);
                element.data("rules")[ruleType].valid = $this.validateRule(ruleType, value);
            });

            $this.updateErrorList(element);
            $this.displayErrors(element);
        },

        // validate a single rule for the given element.
        validateRule: function(ruleType, value) {
            switch(ruleType){
                case 'required':
                    return this.methods.required(value);
                break;

                case 'number':
                    return this.methods.number(value);
                default:
                    return false;
            }
        },

        //If an elements rule is valid == false then it should be added to the errorMap.
        updateErrorList: function(element) {
            var $this = this;
            var failure = false;

            $.each(element.data("rules"), function(ruleType, details) {
                if(!element.data("rules")[ruleType].valid) {
                    failure = true;
                }
            });

            var errorList = this.options.errorList;

            if(failure) {
                errorList.push(element.prop("id"));
            }
            else{
                var index = errorList.indexOf(element.prop("id")); 
                if(index > 0) {
                    errorList.splice(index, 1);
                }
            }
        },

        // Display errors for all failed fields.
        displayErrors: function(element) {
            var $this = this;
            var selector = element.prop("id");
            var errorEnabled = false;

            this.reset(element);

            if ($.inArray(selector, this.options.errorList) >= 0) {
                $.each(element.data("rules"), function(ruleType, details) {
                    if (!details.valid && !errorEnabled) {
                        var errorMessage = $this.options.errorMessage;
                        element.parent().append((errorMessage).append(details.message));
                        element.css("border", "2px solid #b94a48");
                        errorEnabled = true;
                    }
                }) 
            }
        },

        // Reset the error details for an element.
        reset: function(element) {
            element.next("#errorMessage").remove();
            this.options.errorMessage = $("<span class='label alert-danger' id='errorMessage'></span>");
            element.attr("style", "");
        },

        // If any error remain form is still invalid.
        formValid: function() {
            return this.options.errorList.length === 0;
        },

        // Set the rule for all valid inputs.
        setuprules: function() {
            var $this = this;
            // will need to check the elements that are in the options and bind change events to them.
            $.each(this.options.rules, function(input, rules){
                var form = $this.$form;
                var input = $(form.find("#" + input));
                var inputType = $this.inputtype(input);

                if (!$this.validinputtype(input)){
                    console.log(inputType + " is not a valid form element, please alter your configuration.");
                    $this.removeRule(input.prop("id"));
                    return;
                }
                // Apply rules to the input.
                input.data("rules", $this.setrules(rules));
                $this.seteventhandler(input, inputType);
            });

            // Setup event handler for on submit
            if (this.options.onsubmit === true) {
                $this.seteventhandler(this.$form, "submit");
            }
        },

        // Build the rules for an element setting validity at false.
        setrules: function(rules) {
            var validationRules = {};
            
            $.each(rules, function(element, value) {

                validationRules[element] = {
                            'message': value,
                            'valid'  : false
                         }
            });

            return validationRules;
        },

        // Delete the rules for a given input (usually this will be to ignore invalid element assignments 
        // when the plugin is instatntiated)
        removeRule: function(input) {
            delete this.options.rules[input];
        },

        // Based on the input type set the event handlers.
        seteventhandler: function(input, inputType) {
            var $this = this;
            // set event types based on the element type.
            if ($.inArray(inputType, this.options.onchangeElements) === 0) {
                input.on(
                    "change", 
                    function() {
                        $this.onchange(input)
                    });
            }

            if ($.inArray(inputType, this.options.onkeyupElements) === 0) {
                input.on(
                    "keyup blur", 
                    function() {
                        $this.onkeyup(input)
                    });
            }

            if (inputType === 'submit'){
                input.on(
                    "submit",
                    function( event ) {
                        $this.onsubmit(event, input)
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
            return element.is("select, input, textarea");
        },

        // Return the input type as a string.
        inputtype: function(element) {
            var type = "";

            type = $(element).prop('tagName').toLowerCase();

            // If an input, get the input type.
            if (type === "input"){
                return $(element).prop("type");
            }
            
            return type; 
        },

        // Return the value of the given form element.
        elementValue: function(element) {
            var val,
            $element = $( element ),
            type = element.type;

            if ( type === "radio" || type === "checkbox" ) {
                return $( "input[name='" + element.name + "']:checked" ).val();
            } 

            val = $element.val();

            if ( typeof val === "string" ) {
                return val.replace(/\r/g, "" );
            }

            return val;
        },

        // Methods to check inputs value is correct.
        methods: {
            required: function(value) {
                return $.trim( value ).length > 0;
            },

            number: function(value) {
                return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test( value );
            }
        }
    };

    // A really lightweight plugin wrapper around the constructor, 
    // preventing multiple instantiations.
    $.fn[validate] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "validate")) {
                var validate = $.data(this, "validate", new Validate( this, options));
            }
            validate.setuprules();
        });
    };

}) ( jQuery, window, document );