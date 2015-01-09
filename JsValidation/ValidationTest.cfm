<html>
    <head>
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js" type="text/javascript"></script>
        <script src="jquery.validation-0.2.0.js"></script>
    </head>

    <script type="text/javascript">
        $(function() {
            $('#form1').validate({
                debug: true,
                rules:{
                    testField1: {
                        required: 'A value is required'
                    },
                    testField2: {
                        required: 'A value is required',
                        numeric: 'Must be a number'
                    }

                }
            });
         });
     </script>

    <body>
        <div id="form1">
            <form>
                <label><input type="text" id="testField1" placeholder="textRequired">:Required</label><br/>
                <label><input type="text" id="testField2" placeholder="text Required and Number">:Required & Number</label><br/>
                <div id="invalidFieldType"></div>

                <input type="submit" name="submit" class="btn"/>
            </form>
        </div>

        <div id="form2">
                <form>
                <input type="text" id="testField1">
                <input type="text" id="testField2">

                <input type="submit" name="submit" class="btn"/>
            </form>
        </div>
    </body>
</html>