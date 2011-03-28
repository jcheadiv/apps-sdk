WebSocket.__flash = true;

$(document).ready(function() {

  var shim = {
    torrent: function(msg) {
      var result = eval(shim._query('bt.torrent.get', msg.args));

      var special = [ 'properties', 'file', 'peer' ];

      var methods = _(result).chain().keys().filter(function(v) {
        return _.indexOf(special, v) == -1;
      }).value();

      return {
        id: result.properties.get('hash'),
        methods: methods,
        properties: result.properties.all()
      }
    },
    torrent_method: function(msg) {
      console.log(msg);
      var tor = bt.torrent.get(msg.keys[0]);
      console.log(eval("tor." + msg.call + "()"));
      return function() { }
    },
    _query: function(call, args) {
      var query = sprintf('%s()', call);
      if (args.length > 0)
        query = sprintf('%s(%s)', call, _.map(args, function(v) {
          return JSON.stringify(v);
        }).join(','));
      console.log(query);
      return query;
    },
    _default: function(msg) {
      return eval(shim._query(msg.call, msg.args));
    }
  };
  window.shim = shim;

  shim._handlers = {
    "bt.torrent.get": shim.torrent
  };

  sock = new io.Socket('10.20.30.79', {
    port: 8080,
    transports: [ 'xhr-multipart', 'xhr-polling', 'jsonp-polling' ]
  });
  sock.connect();
  sock.on('connect', function() { });

  sock.on('message', function(msg) {
    msg = JSON.parse(msg);
    console.log('task', msg);

    try {
      var result = (msg.call in shim._handlers ? shim._handlers[msg.call] :
                    shim._default)(msg);

      sock.send(JSON.stringify({ result: result }));
    } catch(err) {
      sock.send(JSON.stringify({ error: err }));
    }

    // if (obj == bt.torrent.get) obj = shim.torrent;

    // if ('keys' in msg) obj = shim.torrent_method(msg);


  });

});
