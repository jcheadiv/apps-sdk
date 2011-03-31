/*
 * Copyright(c) 2010 BitTorrent Inc.
 *
 */

(function($) {

  if (!window.use_remote) return

  window.btrpc = {
    funcs: {
      settings: [ 'all', 'get', 'set', 'keys'],
      // stash: ['all', 'get', 'set', 'unset', 'keys'],
      properties: ['all', 'keys', 'get', 'set' ],
      torrent: [ 'keys' ],
      rss_feed: [ 'keys' ],
      rss_filter: [ 'keys' ],
      add: [ 'torrent', 'rss_feed', 'rss_filter' ],
      events: [ 'keys' ]
    },
    _request: function(payload) {
      var resp;
      $.ajax({
        url: '/rpc',
        data: payload,
        async: false,
        contentType: 'application/json',
        type: 'POST',
        success: function(r) { resp = r }
      });
      if ('error' in resp) {
        console.log('ERROR', resp.error);
        throw resp.error.message;
      }
      return resp.result;
    },
    _basic_request: function(fname, args) {
      return btrpc._request(JSON.stringify({ call: fname, args: args }));
    },
    _subobj_request: function(id, fname) {
      return btrpc._request(JSON.stringify({
        call: fname,
        args: _.toArray(arguments).slice(2),
        id: id
      }));
    },
    _transport: function(name) {
      return btrpc._basic_request(name, _.toArray(arguments).slice(1));
    },
    _torrent_obj: function(serial) {
      var tor = {};
      tor._remote_id = serial.id;
      _.each(serial.methods, function(n) {
        tor[n] = _.bind(btrpc._subobj_request, this,
                        serial.id, n);
      });

      _.each([ "file", "peer", "properties" ], function(p) {
        tor[p] = {};
        _.each([ "all", "get", "keys", "set", "unset" ], function(n) {
          tor[p][n] = _.bind(btrpc._subobj_request, this,
                             serial.id, p + "." + n);
        });
      });

      _.each([ "file", "peer" ], function(p) {
        _.each([ "all", "get" ], function(s) {
          tor[p][s] = _.bind(btrpc._subobj[s], this, p + '.' + s, tor);
        });
      });

      return tor;
    },
    _subobj: function(serial) {
      var file = _.reduce(serial.methods, function(acc, v) {
        acc[v] = _.bind(btrpc._subobj_request, this,
                        serial.id, v);
        return acc;
      }, {});

      _.each([ "all", "get", "keys", "set", "unset" ], function(n) {
        file.properties[n] = _.bind(btrpc._subobj_request, this,
                                    serial.id, "properties." + n);
      });

      return file;
    },
    torrent: {
      all: function() {
        var result = btrpc._basic_request('btapp.torrent.all',
                                          _.toArray(arguments));
        _.each(result, function(v, k) {
          result[k] = btrpc._torrent_obj(v);
        });
        return result
      },
      get: function() {
        return btrpc._torrent_obj(btrpc._basic_request('btapp.torrent.get',
                                                       _.toArray(arguments)));
      }
    },
    _subobj: {
      _constructor: function(serial) {
        var obj = _.reduce(serial.methods, function(acc, v) {
          acc[v] = _.bind(btrpc._subobj_request, this,
                          serial.id, v);
          return acc;
        }, {});

        _.each([ "all", "get", "keys", "set", "unset" ], function(n) {
          obj.properties[n] = _.bind(btrpc._subobj_request, this,
                                     serial.id, "properties." + n);
        });

        return obj;
      },
      all: function(method, tor) {
        var result = btrpc._subobj_request.apply(
          this, [tor._remote_id, method].concat(
            _.toArray(arguments).slice(2)));

        _.each(result, function(v, k) {
          result[k] = btrpc._subobj._constructor(v);
        });
        return result
      },
      get: function(method, tor) {
        return btrpc._subobj._constructor(btrpc._subobj_request.apply(
          this, [tor._remote_id, method].concat(
            _.toArray(arguments).slice(2))));
      }
    },
    events: {
      _init: function() {
        window.sock = new io.Socket(window.location.host.split(':')[0], {
          port: window.location.port,
          transports: [ 'xhr-multipart', 'xhr-polling', 'jsonp-polling' ],
          resource: 'browser'
        });

        sock.connect();

        sock.on('message', function(msg) {
          btrpc.events._fire(JSON.parse(msg));
        });
      },
      _handlers: {},
      _fire: function(msg) {
        if (!(msg.event in btrpc.events._handlers)) return

        btrpc.events._handlers[msg.event].apply(this, msg.args);
      },
      get: function(k) {
        if (k in btrpc.events._handlers) return btrpc.events._handlers[k];
      },
      set: function(k, cb) {
        btrpc.events._handlers[k] = cb;
      }
    }
  }

  _.each(btrpc.funcs, function(v, k) {
    if (!(k in btrpc))
      btrpc[k] = {};
    _.each(v, function(n) {
      btrpc[k][n] = _.bind(btrpc._transport, this, sprintf('bt.%s.%s', k, n));
    });
  });

  btrpc.events._init();

})(jQuery);
