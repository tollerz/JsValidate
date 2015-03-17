describe("Setup rules", function() {
    var form = $('form');
    
    beforeEach(function () {
        $('form').validate({
            rules: {
                testInput1: {
                    required: 'input 1 required'
                }
            }
        });      
    });
  
    it('rules on input', function() {
        var expectedRules = {rules: {
                                required: {
                                    message: 'input 1 required',
                                    valid:   false
                                    }
                                }
                            }
        var rules = $('#testInput1').data();
        expect(rules).toEqual(expectedRules);
    });
});