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
    _subobj_request: function(id, type, fname, args) {
      return btrpc._request(JSON.stringify({
        call: type,
        args: args,
        keys: id
      }));
    },
    _transport: function(name) {
      return btrpc._basic_request(name, _.toArray(arguments).slice(1));
    },
    torrent: {
      get: function() {
        var result = btrpc._basic_request('bt.torrent.get',
                                          _.toArray(arguments));

        var tor = {};
        _.each(result.methods, function(n) {
          tor[n] = _.bind(btrpc._subobj_request, this,
                          result.id, 'bt.torrent.get', n);
        });

        tor.properties = {
          all: function() {
            return result.properties;
          },
          keys: function() {
            return _.keys(result.properties);
          },
          get: function(k) {
            return result.properties[k];
          },
          set: function() {
            return btrpc._subobj_request([result.id], ['bt.torrent.get'],
                                         'properties.set',
                                         _.toArray(arguments));
          }
        };

        return tor;
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
