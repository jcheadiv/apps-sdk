/*
 * Copyright(c) 2010 BitTorrent Inc.
 * License: ************
 *
 * Date: %date%
 * Version: %version%
 *
 */

if (typeof(bt) == 'undefined') window.bt = {};
if (typeof(bt._objs) == 'undefined') window.bt._objs = {};

_.extend(bt._objs, { Properties: Class.extend({
  init: function() {
    this._props = { };
  },
  all: function() { return this._props; },
  keys: function() { return _.keys(this._props); },
  get: function(k) {
    var v = this._props[k];
    if (v == undefined)
      throw Error('Unknown property ' + k);
    return v;
  },
  set: function(k, v) { this._props[k] = v; }
})});

_.extend(bt._objs, { Torrent: Class.extend({
  init: function(url, opts) {
    var self = this;
    this.properties = new bt._objs.Properties();
    this.properties.set('download_url', url);
    this.hash = opts.hash || this._sha();
    this.properties.set('hash', this.hash);
    this._set_props(opts);
    this.file._files = { };
    _.each(opts.info.files, function(v) {
      self.file.set(v.path[0], new bt._objs.File(v, self));
    });
    this.opts = opts;
  },
  _set_props: function(opts) {
    var self = this;
    _.each(_.extend({
      progress: 0,
      name: opts.info.name,
      label: '',
      trackers: [opts.announce],
      eta: 0,
      remaining: 0,
      size: _.reduce(opts.info.files, 0,
                     function(a, v) { return a + v.length }),
      download_limit: 0,
      upload_limit: 0,
      status: 0,
      availability: 1,
      remaining: _.reduce(opts.info.files, 0,
                          function(a, v) { return a + v.length }),
      progress: 0,
      downloaded: 0,
      uploaded: 0,
      ratio: 0,
      upload_speed: 0,
      download_speed: 0,
      eta: 0,
      peers_connected: 0,
      peers_in_swarm: 0,
      seeds_connected: 1,
      seeds_in_swarm: 1
    }, opts), function(v, k) {
      self.properties.set(k, v);
    });
  },
  _sha: function() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";
    var len = 40;
    var hash = '';
    for (var i=0; i < len; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  },
  file: {
    all: function() { return this._files; },
    keys: function() { return _.keys(this._files); },
    get: function(k) {
      var v = this._files[k];
      if (v == undefined)
        throw Error('Unknown property ' + k);
      return v;
    },
    set: function(k, v) { this._files[k] = v; }
  },
  peer: {
    all: function() { throw Error('Not Implemented') },
    keys: function() { throw Error('Not Implemented') },
    get: function(k) { throw Error('Not Implemented') },
    set: function(k, v) { throw Error('Not Implemented') }
  },
  start: function(force) { throw Error('Not Implemented') },
  stop: function() { throw Error('Not Implemented') },
  pause: function() { throw Error('Not Implemented') },
  unpause: function() { throw Error('Not Implemented') },
  recheck: function() { throw Error('Not Implemented') },
  remove: function() { delete stub._torrents[this.hash]; }
})});

_.extend(bt._objs, { File: Class.extend({
  init: function(obj, parent) {
    this.index = obj.path[0];
    this.torrent = parent;
    this.properties = new bt._objs.Properties();
    this._set_props(obj);
  },
  _set_props: function(props) {
    var defaults = {
      index: props.path[0],
      name: props.path[0],
      size: props.length,
      downloaded: 0,
      priority: 4
    };
    for (var i in defaults) {
      this.properties.set(i, defaults[i]);
    }
  },
  open: function() {
    console.log("Opening file ...");
    return false;
  }
})});
