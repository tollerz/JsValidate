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
        errorList: [],
        errorMap: {}
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
            //loop through all elements
            $.each(this.options.rules, function(element, value) {
                var element = $("#" + element);
                $this.checkValidity(element);
            });

            return $this.formValid();
    	},

        // Validate a single element
        checkValidity: function(element) {
            $.each(element.data("rules"), function(ruleType, details) {
                console.log(ruleType);
                console.log(details);
            });
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
                var input = $("#" + input);
                var inputType = $this.inputtype(input);

                if (!$this.validinputtype(input)){
                    console.log(inputType + " is not a valid form element, please alter your configuration.");
                    return false;
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

        // Based on the input type set the event handlers.
        seteventhandler: function(input, inputType) {
            console.log("set event handler for: " + inputType );
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
                    "keyup", 
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
            if (this.options.debug) {
                event.preventDefault();
            } 
            //validate whole form.
            this.validation();             
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
        }
    };

    // A really lightweight plugin wrapper around the constructor, 
    // preventing multiple instantiations.
    $.fn[validate] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "validate")) {
                var validate = $.data(this, "validate", new Validate( this, options ));
            }

            validate.setuprules();
        });
    };

}) ( jQuery, window, document );