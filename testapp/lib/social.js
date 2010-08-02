var twt = new twitter();
// Don't try a testing with a good uname/bad pass combination--twitter will 
// flag your account, forcing reCaptcha on login and tests will start failing
var good_uname = "btunittest";
var good_pass = "foobar546";
var bad_uname = "whatever4096283";
var bad_pass = "whatever";

test('badlogin', function(){
  twt.logout();
  stop(3000);
  twt.login(bad_uname, bad_pass, function(error){
    ok(error, "Couldn't log in");
    console.log(error);
    start();
  });
});

test('goodlogin', function(){
  stop(3000);
  twt.login(good_uname, good_pass, function(error){    
    ok(!error, "Successfully logged in");
    console.log(error);   
    start();
  })
});

test('logout', function(){
   stop();
   twt.logout();
   setTimeout(function(){
     ok(!twt.screen_name, "Deleted previous credentials");
     start();
   }, 3000)
});

test('badlogin2', function(){
  stop(3000);
  twt.login(bad_uname, bad_pass, function(error){
    start();
    ok(error, "Couldn't log in with bad credentials after a good login");
    console.log(error);
  })
});