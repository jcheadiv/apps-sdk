var twt = new twitter();
//Note that I think this test made Twitter flag my user accounts--tends to 
//start forcing a reCaptcha on login until such time as it believes I'm human
var uname = "your username here";
var good_pass = "your password here";
var bad_pass = "whatever";

test('badlogin', function(){
  twt.logout();
  stop(3000);
  twt.login(uname, bad_pass, function(error){
    ok(error, "Couldn't log in");
    console.log(error);
    start();
  });
});

test('goodlogin', function(){
  stop(3000);
  twt.login(uname, good_pass, function(error){    
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
  twt.login(uname, bad_pass, function(error){
    start();
    ok(error, "Couldn't log in with bad credentials after a good login");
    console.log(error);
  })
});