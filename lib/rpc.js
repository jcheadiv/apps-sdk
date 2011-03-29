/*
 * Copyright(c) 2010 BitTorrent Inc.
 *
 */

(function($) {

  window.btrpc = {
    funcs: {
      settings: [ 'all', 'get', 'set', 'keys'],
      stash: ['all', 'get', 'set', 'unset', 'keys'],
      properties: ['all', 'keys', 'get', 'set' ],
      torrent: [ 'keys' ],
      rss_feed: [ 'keys' ],
      rss_filter: [ 'keys' ],
      add: [ 'torrent', 'rss_feed', 'rss_filter' ]
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

      tor.file.get = _.bind(btrpc._file.get, this, tor);
      tor.file.all = _.bind(btrpc._file.all, this, tor);

      return tor;
    },
    _file_obj: function(serial) {
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
        var result = btrpc._basic_request('bt.torrent.all',
                                          _.toArray(arguments));
        _.each(result, function(v, k) {
          result[k] = btrpc._torrent_obj(v);
        });
        return result
      },
      get: function() {
        return btrpc._torrent_obj(btrpc._basic_request('bt.torrent.get',
                                                       _.toArray(arguments)));
      }
    },
    _file: {
      all: function(tor) {
        var result = btrpc._subobj_request.apply(
          this, [tor._remote_id, 'file.all'].concat(
            _.toArray(arguments).slice(1)));

        _.each(result, function(v, k) {
          result[k] = btrpc._file_obj(v);
        });
        return result
      },
      get: function(tor) {
        return btrpc._file_obj(btrpc._subobj_request.apply(
          this, [tor._remote_id, 'file.get'].concat(
            _.toArray(arguments).slice(1))));
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

})(jQuery);
