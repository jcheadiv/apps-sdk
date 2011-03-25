WebSocket.__flash = true;

$(document).ready(function() {

  sock = new io.Socket('10.20.30.79', {
    port: 8080,
    transports: [ 'websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling',
                  'jsonp-polling' ]
  });
  sock.connect();
  sock.on('connect', function() {
    sock.send(JSON.stringify({ task: 'register', type: 'manager' }));
    sock.send(JSON.stringify({ task: 'register', type: 'worker' }));
  });

  sock.on('message', function(msg) {
    console.log(msg);
    if (msg.task != 'push') return

    console.log('push', msg);
    obj = window;
    _.each(msg.call.split('.'), function(o) {
      obj = obj[o];
    });

    var result = obj.apply(this, msg.args);
    sock.send(JSON.stringify({ task: 'complete', id: msg.id, result: result }));
  });

});
