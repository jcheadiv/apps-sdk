WebSocket.__flash = true;

$(document).ready(function() {

  window.obj_cache = {};

  var shim = {
    _tor_obj: function(obj) {
      obj_cache[obj.properties.get('hash')] = obj;

      return {
        id: obj.properties.get('hash'),
        methods: _.keys(obj)
      }
    },
    _subobj: function(tor_id, obj) {
      var id = tor_id + '::' + ('id' in obj.properties.all() ?
                                obj.properties.get('id') :
                                obj.properties.get('name'));
      obj_cache[id] = obj;

      return {
        id: id,
        methods: _.keys(obj)
      }
    },
    all_torrents: function(msg) {
      return _(eval(shim._query(msg.call, msg.args))).chain().map(
        shim._tor_obj).reduce(function(acc, v) {
          acc[v.id] = v;
          return acc;
        }, {}).value();
    },
    torrent: function(msg) {
      return shim._tor_obj(eval(shim._query(msg.call, msg.args)));
    },
    all_subobj: function(msg) {
      var _fobj = _.bind(shim._subobj, this, msg.id);
      return _(eval(shim._query(msg.call, msg.args))).chain().map(
        _fobj).reduce(function(acc, v) {
          acc[_.last(v.id.split('::'))] = v;
          return acc;
        }, {}).value();
    },
    subobj: function(msg) {
      return shim._subobj(msg.id, eval(shim._query(msg.call, msg.args)));
    },
    torrent_method: function(msg) {
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
    },
    _event_handler: function(name) {
      sock.send(JSON.stringify(
        { event: name, args: _.toArray(arguments).slice(1) }));
    },
    _connect: function() {
      var url = parseUri(bt.stash.get('dev_server'));
      if (url.port == "") url.port = "80";
      url.port = parseInt(url.port, 10);
      sock = new io.Socket(url.host, {
        port: url.port,
        transports: [ 'xhr-multipart', 'xhr-polling', 'jsonp-polling' ],
        resource: 'worker'
      });

      sock.connect();
      sock.on('connect', function() {
        $(".header").removeClass("connected disconnected").addClass(
          "connected");
        $(".header").text("Connected");
      });

      sock.on('message', function(msg) {
        msg = JSON.parse(msg);
        console.log('task', msg);

        var handler = msg.call in shim._handlers ? shim._handlers[msg.call] :
          shim._default;

        if ('id' in msg) {
          msg.id = msg.id.replace(/\\/g, '\\\\');
          msg.call = sprintf('obj_cache["%s"].%s', msg.id, msg.call);
          console.log(msg.id, msg.id in obj_cache);
        }

        try {
          var result = handler(msg);

          sock.send(JSON.stringify({ result: result }));
        } catch(err) {
          sock.send(JSON.stringify({ error: err }));
        }
      });
    }

  };
  window.shim = shim;

  shim._handlers = {
    "btapp.torrent.all": shim.all_torrents,
    "btapp.torrent.get": shim.torrent,
    "file.all": shim.all_subobj,
    "file.get": shim.subobj,
    "peer.all": shim.all_subobj,
    "peer.get": shim.subobj
  };

  // Setup all the local events to send messages
  _.each(btapp.events.keys(), function(name) {
    btapp.events.set(name, _.bind(shim._event_handler, this, name));
  });

  $("form").submit(function() {

    try {
      var _this = $(this);

      bt.stash.set('dev_server', _this.find("#host").val());
      shim._connect();
    } catch (err) { console.log(err) }

    return false;
  });

  if (bt.stash.get('dev_server', false)) {
    $("#host").val(bt.stash.get('dev_server'));
    shim._connect();
  }

});
