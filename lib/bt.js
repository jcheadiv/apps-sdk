/*
 * Base of the bt convenience object for creating apps.
 *
 * Copyright(c) 2010 BitTorrent Inc.
 *
 */

if (typeof(bt) == 'undefined') window.bt = {};

_.extend(bt, {
  _tor: {
    removed: -1,
    failed: 0,
    added: 1,
    complete: 2
  },
  _rss: {
    removed: -1,
    failed: 0,
    added: 1
  },
  _objs: {},
  _templates: {},
  _init: function() {

  },
  create: function(name, files, cb) {
    btapp.create(name, files, cb);
  },
  add: {
    torrent: function(url, defaults, cb, label) {
      /*
       * Parameters:
       *     url - URL to add the torrent from
       *     defaults(optional) - The defaults to set the torrent to.
       *     cb - A callback to call after the torrent has been added.
       */
      // Shift arguments if defaults is omited
      if(_.isString(cb))
        label = cb;
      if (_.isFunction(defaults) || _.isUndefined(defaults)) {
        cb = defaults;
        defaults = { };
      }

      var setter = function(resp) {
        if (resp.state != bt._tor.added)
          return resp;
          var tor = bt.torrent.get(resp.url);
        _.each(defaults, function(v, k) {
          tor.properties.set(k, v);
        });
        return resp;
      };

      bt._handlers._torrents[url] = cb ? _.compose(cb, setter) : setter;
      //convert local file path to URI format
      if (!url.match(/(^ftp|^http(|s)|^magnet)\:/gi)) url = 'file:///' + url;

      if(label)
        return btapp.add.torrent(url, label);
      return btapp.add.torrent(url);
    },
    rss_feed: function(url) {
      return btapp.add.rss_feed(url);
    },
    rss_filter: function(name) {
      return btapp.add.rss_filter(name);
    }
  },
  stash: {
    all: function() {
      var everything = btapp.stash.all();
      _.each(everything, function(v, k) {
        try {
          everything[k] = JSON.parse(v);
        } catch(err) { }
      });
      return everything;
    },
    keys: function() { return btapp.stash.keys() },
    get: function(k, d) {
      try {
        return JSON.parse(btapp.stash.get(k));
      } catch(err) {
        if (d == null && d !== null)
          throw err;
        return d;
      } },
    set: function(k, v) { btapp.stash.set(k, JSON.stringify(v)); },
    unset: function(k) { return btapp.stash.unset(k) }
  },
  events: {
    all: function() { return btapp.events.all(); },
    keys: function() { return btapp.events.keys(); },
    get: function(k) { return btapp.events.get(k); },
    set: function(k, v) { return btapp.events.set(k, v); }
  },
  torrent: {
    // Move all properties into the actual object.
    all: function() { return btapp.torrent.all() },
    keys: function() { return btapp.torrent.keys() },
    get: function(key) {
      // Get by download url or hash
      if (key.match(/(^ftp|^http(|s)|^magnet)\:/gi)) {
        var lookup = {
          prop: 'download_url',
          key: key
        };
        if (key.indexOf('magnet:') == 0)
          lookup = {
            prop: 'hash',
            key: key.match(/btih:(\S{40})/)[1]
          }
        var matches = _(bt.torrent.all()).chain().values().filter(function(v) {
          return v.properties.get(lookup.prop) == lookup.key;
        }).value();
        if (!matches.length) throw 'Unknown torrent ' + key;
        return matches[0];
      }
      var file_match = _(bt.torrent.all()).chain().values().filter(function(v) {
        try {
          return v.properties.get('uri') == ('file:///'+ key);
        } catch (e) { return false; }
      }).value();
      if (file_match.length) return file_match[0];

      return btapp.torrent.get(key);
    },
    add: function(url, defaults, cb, label) {
      return bt.add.torrent(url, defaults, cb, label);
    },
    remove: function(id) {
      var t = bt.torrent.get(id);
      if (t) return t.remove();
      throw Error(sprintf('Remove failed on nonexistent torrent %s.', id));
    },
    stop: function(id) {
      var t = bt.torrent.get(id);
      if (t) return t.stop();
      throw Error(sprintf('Remove failed on nonexistent torrent %s.', id));
    },
    start: function(id) {
      var t = bt.torrent.get(id);
      if (t) return t.start();
      throw Error(sprintf('Remove failed on nonexistent torrent %s.', id));
    },
    values: function() { return _.values(bt.torrent.all()) },
    first: function() { return _.first(bt.torrent.values()) },
    last: function() { return _.last(bt.torrent.values()) },
    rest: function() { return _.rest(bt.torrent.values()) }
  },
  _handlers: {
    _torrents: { },
    torrent: function(resp) {
      /*
       * resp.state -
       *    -1 - removed
       *     0 - not added
       *     1 - added, started
       *     2 - completed
       *     3 - metadata complete
       */
      jQuery("body").trigger('torrentStatus', resp);
      if (resp.url in bt._handlers._torrents)
        bt._handlers._torrents[resp.url](resp);
    },
    _rss_feeds: { },
    rss: function(resp) {
      /*
       * resp.state -
       *    -1 - removed
       *     0 - not added
       *     1 - added
       */
      jQuery("body").trigger('rssStatus', resp);
      if (resp.url in bt._handlers._rss_feeds)
        bt._handlers._rss_feeds[resp.url](resp);
    }
  },
  rss_feed: {
    all: function() { return btapp.rss_feed.all() },
    keys: function() { return btapp.rss_feed.keys() },
    get: function(k) { return btapp.rss_feed.get(k) },
    add: function(url, defaults, cb) {
      return bt.add.rss_feed(url, defaults, cb);
    },
    remove: function(id) {
      var r = bt.rss_feed.get(id);
      if (r) {
        return r.remove();
      }
      else {
        throw Error(sprintf('Remove failed on nonexistent rss feed %s.', id));
      }
    }
  },
  rss_filter: {
    all: function() { return btapp.rss_filter.all() },
    keys: function() { return btapp.rss_filter.keys() },
    get: function(k) { return btapp.rss_filter.get(k) }
  },
  resource: function(v) {
    return btapp.resource(v);
  },
  settings: {
    all: function() { return btapp.settings.all() },
    keys: function() { return btapp.settings.keys() },
    get: function(k, d) { try{return btapp.settings.get(k);}catch(e){return d;} },
    set: function(k, v) { btapp.settings.set(k, v) }
  },
  properties: {
    all: function() { return btapp.properties.all() },
    keys: function() { return btapp.properties.keys() },
    get: function(k, d) { try{return btapp.properties.get(k);}catch(e){return d;} },
    set: function(k, v) { btapp.properties.set(k, v) }
  },
  log: function() {
    return btapp.log(JSON.stringify(_.map(arguments, function(v) { return v })));
  },
  language: {
    all: function() { return btapp.language.all() }
  },
  reload: function() {
    btapp.reload();
  },
  _parse_params: function(str_params, on_success) {
    var params = {};
    var arr = str_params.split('&');
    for(var i = 0; i < arr.length; i++) {
      var bits = arr[i].split('=');
      params[unescape(bits[0])] = unescape(bits[1]);
    }
    on_success && on_success(params);
    return params;
  },
  fb_login: function(appid, redirect_url, scope, callback) {
    var on_success = callback || scope;
    var _this = this;
    var cb = function(resp) {
      _this._parse_params(resp, on_success);
    };

    //optional params aren't as nice in the C++ code, must do it this way
    if (callback) {
      btapp.fb_login(appid, redirect_url, scope, cb);
    } else {
      btapp.fb_login(appid, redirect_url, cb);
    }
  },
  fb_apprequest: function(appid, redirect_url, message, to, callback) {
    var on_success = callback || to;
    var _this = this;
    var cb = function(resp) {
      _this._parse_params(resp, on_success);
    };

    //optional params aren't as nice in the C++ code, must do it this way
    if (callback) {
      btapp.fb_apprequest(appid, redirect_url, message, to, cb);
    } else {
      btapp.fb_apprequest(appid, redirect_url, message, cb);
    }
  },
  template: function(tmpl_name, vals, pkg) {
      /*
       * Parameters:
       *     tmpl_name - The name of the file containing the template you'd
       *                 like to use.
       *     vals - Key, value pairs to replace in the template itself.
       *     pkg  - Optional package name if the file ships as package contents.
       *
       */
    var path = 'string' === typeof pkg ? sprintf('packages/%s/', pkg) : '';
    var tmpl = sprintf('%shtml/%s.html', path, tmpl_name);
    if (!(tmpl in bt._templates)) {
      var resource = bt.resource(tmpl);
      if ('undefined' === typeof resource) {
        throw Error(sprintf('Template %s does not exist.', tmpl));
      }
      bt._templates[tmpl] = _.template(resource);
    }
    return bt._templates[tmpl](vals || {});
  },
  // This is so that main.html content can go into an element other than body.
  _page_element: "body",
  _index_content: 'html/main.html'
});

(function() {
  // If there isn't a console, default to bt.log
  if (!window.console)
    window.console = { log: bt.log };

  window.nativeclient = window.btapp ? true : false;

  jQuery(document).ready(function() {

    // If btapp exists, this is running natively, so don't replace anything.
    if (!window.btapp) {
      window.develop = true;
      stub._init();
      window.btapp = stub;

      if (window.use_remote)
        window.btapp = _.extend(stub, btrpc);
    }

    var pkg = JSON.parse(bt.resource('package.json'));
    window.NAME = pkg.name;
    window.VERSION = pkg.version;
    window.RELEASE = pkg['bt:release_date'];

    // Setup the event handler for torrents that allows passing callbacks in to
    // monitor state.
    bt.events.set('torrentStatus', bt._handlers.torrent);
    bt.events.set('rssStatus', bt._handlers.rss);
  });
})();

