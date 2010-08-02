var gt;
test('gt_init', function(){
    //Checks that language defined correctly
    //Checks that links loaded correctly
    //Load link when bt.resource exists
    //Load link when bt.resource doesn't exist
    expect(5);
    
    $('head').append("<link rel='gettext' href='lang/test/test.po' lang='test'>");
    $('head').append("<link rel='gettext' href='lang/missing/missing.po' lang='missing'>");
    $('head').append("<link href='lang/ignore/ignore.po' lang='en'>");
    
    gt = new bt.Gettext();
    var btlang = btapp.language.all()
    console.log(btlang);
    if(btlang.name == "default"){
        equals(gt.lang, "en", "Language setting defaults to client language");
    }else{
        equals(gt.lang, gt.lcodes[btlang.name], "Language setting defaults to client language");
    }
    
    
    var l = 'test';
    gt = new bt.Gettext(l);
    gt.debug = true;
    
    equals(gt.lang, l, "Language set properly");
    equals(gt.links.length, 4, "Found two gettext links");
    ok(gt.LCmessages[l], "Loaded test language");
    ok(!gt.LCmessages["missing"], "Didn't load missing language");
});
test('gt_gettext', function(){
    //Translate message with existing translation
    //Translate message with no existing translation
    //Translate string with proper number of arguments
    //Translate string with improper number of arguments
    //Translate string with improper argument type
    expect(5);
    
    equals(gt.gettext("translate this"), 
           "TRANSLATE THIS", 
           "Found translation message");
    equals(gt.gettext("don't translate this"), 
           "don't translate this", 
           "Returned original string for nonexistent translation");
    
    var str_arg = "arg string";
    var char_arg = 97; //a
    var bad_char_arg = 'a';
    var signed_int = -5;
    
    var arg_msg = gt.gettext("string (%s), character(%c), signed int(%d)", 
                             str_arg, char_arg, signed_int);
    equals(arg_msg, 
           "STRING (arg string), CHARACTER(a), SIGNED INT(-5)", 
           "Handled arguments properly");
    
    var missing_arg_msg = gt.gettext("string (%s), character(%c), signed int(%d)", 
                                     str_arg, signed_int);
    ok(!missing_arg_msg, "Returned empty string for missing args");
    
    var bad_arg_msg = gt.gettext("string (%s), character(%c), signed int(%d)", 
                                 char_arg, bad_char_arg, str_arg);
    equals(bad_arg_msg, 
           "STRING (97), CHARACTER(), SIGNED INT()", 
           "Handled bad argument types without dying");

});
test('gt_extfile', function(){
    expect(8);
    //get external file
    //parse string input
    //test behavior on duplicate message with different translation
    stop();
    $.get('http://staging.apps.bittorrent.com/featured/lang/test/test.po', function(resp){
        gt.include_raw(resp);      
        start();
        equals(gt.gettext("new message"), "NEW MESSAGE", "External PO was successfully loaded from text");
        equals(gt.gettext("translate this"), "TRANSLATE THIS", "For duplicate messages, default to the first one loaded");
        
        gt.fifo = false;
        equals(gt.gettext("translate this"), "TRANSLATE THIS DIFFERENTLY", "Can switch behavior to search from end of array instead");
        
        $.each(gt.LCmessages.test.msgid, function(i, msg){ok(gt.LCmessages.test.msgstr[i], gt.LCmessages.test.msgid[i]+": "+gt.LCmessages.test.msgstr[i]);} );
    });
});