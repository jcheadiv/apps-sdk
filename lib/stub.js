/*
 * "stub" object that replicates btapp functionality in pure javscript.
 *
 * Copyright(c) 2010 BitTorrent Inc.
 * License: ************
 *
 * Date: %date%
 * Version: %version%
 *
 */

var stub = {
  _init: function() {
    stub.settings = new bt._objs.Properties({
      v: -1,
      torrents_start_stopped: false,
      check_update: false,
      anoninfo: false,
      'sys.prevent_standby': false,
      'bind_port': 1,
      rand_port_on_start: false,
      natpmp: false,
      seed_prio_limitul_flag: false,
      seed_prio_limitul: 1,
      seed_ratio: 1,
      computer_id: '0000000000',
      revision: '0000'
    });
    stub.properties = new bt._objs.Properties({
      badging_num: 0,
      background: false,
      visible: false,
      min_api_version: null,
      max_api_version: null,
      permissions: 0,
      updateUrl: 'http://example.com'
    });
    if (!stub.stash.get('__torrents'))
      stub.stash.set('__torrents', []);
    // Add in the current torrents.
    _.each(stub.stash.get('__torrents'), function(v) {
      stub.add._add_torrent.apply(this, v);
    });
  },
  _torrents: { },
  add: {
    _delay: 1000,
    _add_torrent: function(url, opts) {
      var tor = new bt._objs.Torrent(url, opts);
      window.stub._torrents[tor.hash] = tor;
      if ('torrentStatus' in stub.events._registered) {
        stub.events._registered.torrentStatus(
          { appid: 'c:\\example\\foo',
            url: url,
            status: 200,
            message: 'success',
            hash: tor.hash,
            state: 1
          });
      }
    },
    torrent: function(url) {
      var added = function(resp) {
        var opts = resp;
        if (!('hash' in opts))
          opts.hash = bt._objs.Torrent.prototype._sha();
        if (!('added_on' in opts))
          opts['added_on'] = Math.floor(new Date().getTime() / 1000);
        stub.stash.set('__torrents', stub.stash.get('__torrents').concat(
          [[url, opts]]));
        stub.add._add_torrent(url, opts);
      };
      if (_.filter(stub.stash.get('__torrents'), function(v) {
        return url == v[0]; }).length > 0) return
      $.ajax({
        url: url,
        success: added
      });
    },
    rss_feed: function() { throw Error('Not Implemented') },
    rss_filter: function() { throw Error('Not Implemented') }
  },
  events: {
    _registered: { },
    all: function() { return btapp.events._registered },
    keys: function() { return _.keys(btapp.events._registered); },
    get: function(k) { return btapp.events._registered[k]; },
    set: function(k, v) { btapp.events._registered[k] = v; }
  },
  stash: {
    _get_data: function() {
      return _($.jStorage.get('index', [])).chain().map(function(v) {
        return [v, $.jStorage.get(v)];
      }).reduce(function(acc, val) {
        acc[val[0]] = val[1]; return acc }, {}).value();
    },
    _set_data: function(key, value) {
      $.jStorage.set('index', $.jStorage.get('index', []).concat([key]));
      $.jStorage.set(key, value);
    },
    all: function() { return stub.stash._get_data(); },
    keys: function() { return _.keys(stub.stash.all()) },
    get: function(k) { return stub.stash.all()[k]; },
    set: function(k, v) { stub.stash._set_data(k, v); },
    unset: function(k) {
      $.jStorage.set('index', _.without($.jStorage.get('index', []), k));
      return $.jStorage.deleteKey(k);
    },
    _clear: function() { $.jStorage.flush(); }
  },
  torrent: {
    // Move all properties into the actual object.
    all: function() { return btapp._torrents; },
    keys: function() { return _.keys(btapp._torrents) },
    get: function(k) {
      var tor = btapp._torrents[k];
      if (!tor) throw "Unknown property " + k;
      return tor;
    },
    add: function(k) { return stub.add.torrent(k); },
    remove: function(k) { return stub.torrent.get(k).remove(); }
  },
  resource: function(url) {
    var response;
    $.ajax({
      url: url,
      dataType: 'text',
      success: function(v) { response = v; },
      async: false,
      dataType: 'text'
    });
    return response;
  },
  rss_feed: {
    all: function() { throw Error('Not Implemented') },
    keys: function() { throw Error('Not Implemented') },
    get: function(k) { throw Error('Not Implemented') },
    add: function(k) { return stub.add.rss_feed(k); },
    remove: function(k) { return stub.rss_feed.get(k).remove(); }
  },
  rss_filter: {
    all: function() { throw Error('Not Implemented') },
    keys: function() { throw Error('Not Implemented') },
    get: function(k) { throw Error('Not Implemented') }
  },
  settings: {
    all: function() { throw Error('Not Implemented') },
    keys: function() { throw Error('Not Implemented') },
    get: function(k) { throw Error('Not Implemented') },
    set: function(k, v) { throw Error('Not Implemented') }
  },
  properties: {
    all: function() { throw Error('Not Implemented') },
    keys: function() { throw Error('Not Implemented') },
    get: function(k) { throw Error('Not Implemented') },
    set: function(k, v) { throw Error('Not Implemented') }
  },
  log: function() { console.log.apply(this, arguments) },
  language: {
    all: function() {
      return (navigator.language ||
              navigator.systemLanguage).toLowerCase().substr(0, 2) }
  }
};
