WebSocket.__flash = true;

$(document).ready(function() {

  sock = new io.Socket('10.20.30.79', {
    port: 8080,
    transports: [ 'xhr-multipart', 'xhr-polling', 'jsonp-polling' ]
  });
  sock.connect();
  sock.on('connect', function() { });

  sock.on('message', function(msg) {
    msg = JSON.parse(msg);
    console.log(msg);
    if (msg.task != 'push') return

    console.log('push', msg);
    obj = window;
    _.each(msg.call.split('.'), function(o) {
      obj = obj[o];
    });

    var result = obj.apply(this, msg.args);
    sock.send(JSON.stringify({ result: result }));
  });

});
