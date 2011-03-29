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
    _file_obj: function(tor_id, obj) {
      var id = tor_id + '::' + obj.properties.get('name');
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
    all_files: function(msg) {
      var _fobj = _.bind(shim._file_obj, this, msg.id);
      return _(eval(shim._query(msg.call, msg.args))).chain().map(
        _fobj).reduce(function(acc, v) {
          acc[_.last(v.id.split('::'))] = v;
          return acc;
        }, {}).value();
    },
    file: function(msg) {
      return shim._file_obj(msg.id, eval(shim._query(msg.call, msg.args)));
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
    }
  };
  window.shim = shim;

  shim._handlers = {
    "bt.torrent.all": shim.all_torrents,
    "bt.torrent.get": shim.torrent,
    "file.all": shim.all_files,
    "file.get": shim.file
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

    var handler = msg.call in shim._handlers ? shim._handlers[msg.call] :
      shim._default;

    if ('id' in msg)
      msg.call = sprintf('obj_cache["%s"].%s', msg.id, msg.call);

    try {
      var result = handler(msg);

      sock.send(JSON.stringify({ result: result }));
    } catch(err) {
      sock.send(JSON.stringify({ error: err }));
    }

    // if (obj == bt.torrent.get) obj = shim.torrent;

    // if ('keys' in msg) obj = shim.torrent_method(msg);


  });

});
