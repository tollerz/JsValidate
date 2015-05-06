describe("Setup rules", function() {
    var eventNamespace = 'validation';
  
    /**
     * Function to destroy the plugin instance on an element, so it may be instantiated again.
     */
    function destroyPlugin(elem) {
    	var isInstantiated  = !! $.data(elem.get(0));
   	 
	    if (isInstantiated) {
	        $.removeData(elem.get(0));
	        elem.off(eventNamespace);
	        elem.unbind('.' + eventNamespace);
	    }
    } 
    
    beforeEach(function () {  
    	destroyPlugin($('form'));
    	
    	testVariable = '';
    	
    	$('form').on('submit', function(){
    		testVariable = 'submitted';
    	});
    });
    
    /**
     * When only rules are provided ensure they are extended in the options correctly.
     */
    it('Options with only rules extended correctly', function() {  	
        $('#singleInputNoValueform').validate({
            rules: {
                testInput1: {
                    required: 'input 1 required'
                }
            }
        }); 
        
    	var expectedRules = {testInput1: {required: 'input 1 required'}};
    						  
    	var options = $('form').data('validate').options;
    	var rules = options.rules;
    	var verification = options.verification;
    	var errorsMap = options.errorsMap;

    	expect(rules).toEqual(expectedRules);
    	expect(verification).toEqual({});
    	expect(errorsMap).toEqual({rules:[], verification:[]});
    });
    
    /**
     * When only verifications are provided ensure they are extended in the options correctly.
     */
    it('Options with only verification extended correctly', function() {
    	$('#singleInputNoValueform').validate({
            verification: {
            	testInput1: {
            		ajax: ['verification message', 'urlforajaxRequest.index/something=']
            	}
            }
        }); 
    	
    	var expectedVerification = {testInput1 : { ajax : [ 'verification message', 'urlforajaxRequest.index/something=' ] }};
    	
     	var options = $('form').data('validate').options;
    	var rules = options.rules;
    	var verification = options.verification;
    	var errorsMap = options.errorsMap;
    	
    	expect(rules).toEqual({});
    	expect(verification).toEqual(expectedVerification);
    	expect(errorsMap).toEqual({rules:[], verification:[]});
    });
    
    /**
     * When rules and verifications are provided ensure they are extended in the options correctly.
     */
    it('Options with rules and verification extended correctly', function() {
    	$('#singleInputNoValueform').validate({
            verification: {
            	testInput1: {
            		ajax: ['verification message', 'urlforajaxRequest.index/something=']
            	}
            },
            rules: {
                testInput1: {
                    required: 'input 1 required'
                }
            }
        }); 
    	
    	var expectedVerification = {testInput1 : { ajax : [ 'verification message', 'urlforajaxRequest.index/something=' ] }};
    	var expectedRules = {testInput1: {required: 'input 1 required'}};
    	
     	var options = $('form').data('validate').options;
    	var rules = options.rules;
    	var verification = options.verification;
    	var errorsMap = options.errorsMap;
    	
    	expect(rules).toEqual(expectedRules);
    	expect(verification).toEqual(expectedVerification);
    	expect(errorsMap).toEqual({rules:[], verification:[]});
    });

    /**
     * Check that the rules provided are set on the form elements 'data' property correctly.
     */
    it('rules on form element data set correctly', function() {
        $('#singleInputNoValueform').validate({
            rules: {
                testInput1: {
                    required: 'input 1 required'
                }
            }
        });
       
        var expectedRules = {required: {message: 'input 1 required',
                                    			valid:   false}}
        
        var rules = $('#testInput1').data().rules; 
        
        expect(rules).toEqual(expectedRules);
    });
    
    /**
     * Check that the verification options provided are set on the form elements 'data' property correctly.
     */
    it('verification on form element data set correctly', function() {
        $('#singleInputNoValueform').validate({
        	verification: {
            	testInput1: {
            		ajax: ['verification message', 'urlforajaxRequest.index/something=']
            	}
            }
        });
       
        var expectedVerification = {ajax : { message : 'verification message', 
        									url : 'urlforajaxRequest.index/something=', 
        									valid : false }}
        
        var verification = $('#testInput1').data().verification;
        
        expect(verification).toEqual(expectedVerification);
    });
 
    /**
     * Check that both the verification and rules options provided are set on the form elements 'data' property correctly.
     */
    it('verification and rules on form element data set correctly', function() {
        $('#singleInputNoValueform').validate({
        	verification: {
            	testInput1: {
            		ajax: ['verification message', 'urlforajaxRequest.index/something=']
            	}
            },
            rules: {
                testInput1: {
                    required: 'input 1 required'
                }
            }
        });
       
        var expectedVerification = {ajax : { message : 'verification message', 
        									url : 'urlforajaxRequest.index/something=', 
        									valid : false }};
        var expectedRules = {required: {message: 'input 1 required',
										valid:   false}};
        
        var verification = $('#testInput1').data().verification;
        var rules = $('#testInput1').data().rules;
        
        expect(verification).toEqual(expectedVerification);
        expect(rules).toEqual(expectedRules);
    });
    
    /**
     * Test that the submit handler, if specified, is called when the form is valid.
     */
    it('submit handler run when validation passed', function() {
    	$('#singleInputValueform').validate({
    		submitHandler: function(){ return testVariable = 'test'; }
    	});
    	
    	// manually submit the form
    	$('#singleInputValueform').find('#submit').click();

    	expect('test').toEqual(testVariable);
    });
    
    /**
     * Test that the submit handler, if specified, is not called when the form is invalid.
     */
    it('submit handler not run when validation fails', function() {
    	$('#singleInputNoValueform').validate({
    		submitHandler: function(){ return testVariable = 'test'; },
            rules: {
                testInput1: {
                    required: 'input 1 required'
                }
            }
    	});
    	
    	// manually submit the form
    	$('#singleInputNoValueform').find('#submit').click();

    	expect('').toEqual(testVariable);
    });

    /**
     * Test that when debug option set to false the form does submit
     */
    it('submit when not in debug mode', function() {
    	$('#singleInputValueform').validate({
    		debug: false,
            rules: {
                testInput1: {
                    required: 'input 1 required'
                }
            }
    	});
    	
    	// manually submit the form
    	$('#singleInputValueform').find('#submit').click();

    	expect('submitted').toEqual(testVariable);
    }); 
    
//    /**
//     * Test that when debug option set to true the form does not submit
//     */
//    it('do not submit form when in debug mode', function() {
//    	$('#singleInputValueform').validate({
//    		debug: true,
//            rules: {
//                testInput1: {
//                    required: 'input 1 required'
//                }
//            }
//    	});
//    	
//    	// manually submit the form
//    	$('#singleInputValueform').find('#submit').click();
//
//    	expect(testVariable).toEqual('');
//    });  
    
   
    
    // Test Highlight
    
    // Test onChange
    
    //TODO: Add tests for building rules based on HTML5 form attributes.
    
});