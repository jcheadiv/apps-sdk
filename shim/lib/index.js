WEB_SOCKET_SWF_LOCATION = "WebSocketMain.swf";
WEB_SOCKET_DEBUG = true;

$(document).ready(function() {

  $.get("http://ask.com", function(v) { console.log(v) });

});
