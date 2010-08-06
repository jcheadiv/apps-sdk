/*
 * Copyright(c) 2010 BitTorrent Inc.
 *
 * Date: %date%
 * Version: %version%
 *
 */

bt.status = {
  'started': 1,
  'checking': 2,
  'start_after_check': 4,
  'checked': 8,
  'error': 16,
  'paused': 32,
  'queued': 64,
  'loaded': 128
}

var peer_torrent = 'http://vodo.net/media/torrents/The.Yes.Men.Fix.The.World.P2P.Edition.2010.Xvid-VODO.torrent';

module('bt');

test('bt.add.torrent', function() {
  expect(8);

  var url = 'http://vodo.net/media/torrents/Pioneer.One.S01E01.720p.x264-VODO.torrent';
  var url_nocb = 'http://vodo.net/media/torrents/Everything.Unspoken.2004.Xvid-VODO.torrent';
  var url_def = 'http://vodo.net/media/torrents/Smalltown.Boy.2007.Xvid-VODO.torrent';
  var url_cbdef = 'http://vodo.net/media/torrents/Warring.Factions.2010.Xvid-VODO.torrent';
  var defs = { label: 'foobar' };
  // Just in case.
  bt.events.set('torrentStatus', bt._handlers.torrent);
  stop();
  // For use in the torrent.peer tests
  bt.add.torrent(peer_torrent);
  bt.add.torrent(url_nocb);
  bt.add.torrent(url_def, defs);
  bt.add.torrent(url, function(resp) {
    equals(resp.url, url, 'Url\'s set right');
    equals(resp.status, 200, 'Status is okay');
    equals(resp.state, 1, 'State is okay');
    equals(resp.message, '', 'Message is okay');
    var download_urls = _.map(bt.torrent.all(), function(v) {
      return v.properties.get('download_url');
    });
    ok(_.indexOf(download_urls, url) >= 0,
       'Torrent added successfully');
    ok(_.indexOf(download_urls, url_nocb) >= 0,
       'No cb or defaults added okay');
    var tor = bt.torrent.get(url_def);
    if (tor)
      _.each(defs, function(v, k) {
        equals(tor.properties.get(k), v, 'Defaults are set');
      });
    bt.add.torrent(url_cbdef, defs, function(resp) {
      var tor = bt.torrent.get(url_cbdef);
      if (tor)
        _.each(defs, function(v, k) {
          equals(tor.properties.get(k), v, 'Callback + defaults works');
        });
      _.each(bt.torrent.all(), function(v) {
        if (v.properties.get('download_url') == peer_torrent)
          return
        v.remove();
      });
      start();
    });
  });
});

test('bt.add.rss_feed', function() {
  // Do we want to expand the functionality to include
  // a callback and default property setting?
  expect(3);
  var rss_bt = 'http://vodo.net/feeds/public';
  var rss_btapp = 'http://www.clearbits.net/rss.xml';

  // Looks like the way we add in the bt object is broken.
  // bt.js:46 btapp.add.rss_feed is null or not an object
  try{
    ok(bt.add.rss_feed(rss_bt), "Didn't explode while trying to add");
  }catch(err){
    ok(false, "bt.add.rss_feed error:" + err.message);
  }

  btapp.add.rss_feed(rss_btapp);
  btapp.add.rss_feed(rss_btapp);
  stop();

  setTimeout(function(){
    start();
    var rss_urls = _.map(bt.rss_feed.all(), function(v) {
      return v.properties.get('url');
    });
    ok(_.indexOf(rss_urls, rss_btapp) >= 0,
      'RSS feed added successfully');

    //A duplicate filter object isn't created, but the keys are duplicated
    equals(bt.rss_feed.keys().length, _.keys(bt.rss_feed.all()).length,
      "Number of keys and objects is consistent; good duplicate behavior")
  }, 2000);

});

test('bt.add.rss_filter', function() {
  // Do we want to expand the functionality to include
  // a callback and default property setting?
  expect(3);
  var filter_bt = "BTFilterName";
  var filter_btapp = "BTAppFilterName";

  // Looks like the way we add in the bt object is broken.
  // bt.js:49 btapp.add.rss_feed is null or not an object
  try{
    ok(bt.add.rss_filter(filter_bt), "Didn't explode while trying to add");
  }catch(err){
    ok(false, "bt.add.rss_filter error:" + err.message);
  }

  btapp.add.rss_filter(filter_btapp);
  btapp.add.rss_filter(filter_btapp);
  stop();

  setTimeout(function(){
    start();
    var filter_names = _.map(bt.rss_filter.all(), function(v) {
      return v.properties.get('name');
    });
    ok(_.indexOf(filter_names, filter_btapp) >= 0,
      'RSS filter added successfully');

    //A duplicate filter object isn't created, but the keys are duplicated
    equals(bt.rss_filter.keys().length, _.keys(bt.rss_filter.all()).length,
      "Number of keys and objects is consistent; good duplicate behavior")
  }, 2000);
});

test('bt.stash', function() {
  expect(18);

  if (btapp.stash._clear)
    btapp.stash._clear();
  var objs = { foo: 'bar',
               bar: [1, 2, '3'],
               baz: { a: 1 },
               btinstall_lastmodified: "",
               lastmodified: "",
               productcode: "",
               addcount: 4,
               productcode: "",
               path: ""
            };
  _.each(objs, function(v, k) {
    bt.stash.set(k, v);
    same(bt.stash.get(k), v, 'Parsing works');
    equals(stub.stash.get(k), JSON.stringify(v), 'Serialization works');
  });
  same(bt.stash.keys().sort(), _.keys(objs).sort(), 'keys() works');
  same(bt.stash.all(), objs, 'all() works');
});

test('bt.events', function() {
  expect(3);

  var fn = function() { };
  bt.events.set('torrentStatus', fn);
  same(bt.events.get('torrentStatus'), fn, 'Callback set correctly');
  ok(_.indexOf(bt.events.keys(), 'torrentStatus') >= 0,
     'Torrent shows up in the keys');
  same(bt.events.all()['torrentStatus'], fn, 'All is returning the right data');
});

test('bt.torrent', function() {
  expect(13);

  bt.events.set('torrentStatus', bt._handlers.torrent);
  var url = 'http://vodo.net/media/torrents/Pioneer.One.S01E01.720p.x264-VODO.torrent';
  bt.add.torrent(url, function(resp) {
    var magnet = 'magnet:?xt=urn:btih:07a9de9750158471c3302e4e95edb1107f980fa6&dn=Pioneer.One.S01E01.720p.x264-VODO&tr=http%3a%2F%2Ftracker.vodo.net%3A6970%2Fannounce';
    var tor = bt.torrent.get(url);
    equals(tor.properties.get('download_url'), url, 'Url: ' +
           tor.properties.get('download_url'));
    equals(bt.torrent.get(tor.hash).properties.get('hash'), tor.hash,
           'Hash: ' + tor.hash);
    ok(_.indexOf(bt.torrent.keys(), tor.hash) >= 0,
       'Keys has the right hashes');
    ok( tor.hash in bt.torrent.all(), 'all() has at least one right key');
    ok(bt.torrent.all()[tor.hash], "Client didn't crash");

    var status = tor.properties.get('status');
    ok(status & bt.status.loaded && status & bt.status.queued &&
       status & bt.status.checking, 'Status looks good.');
    // XXX - Currently freezes the client
    // tor.stop();
    // ok(tor.properties.get('status') & bt.status.loaded, 'Torrent stopped');
    // tor.start();
    // console.log(tor.properties.get('status'));
    // tor.pause();
    // ok(tor.properties.get('status') & bt.status.paused,
    //    'Torrent status (pause): ' + tor.properties.get('status'));
    // tor.unpause();
    // ok(!(tor.properties.get('status') & bt.status.paused),
    //      'Torrent status (unpause): ' + tor.properties.get('status'));
    // tor.recheck();
    // ok(tor.properties.get('status') & bt.status.checking,
    //    'Torrent status (recheck): ' + tor.properties.get('status'));
    _.each(bt.torrent.all(), function(v) {
      if (v.properties.get('download_url') == peer_torrent)
        return
      v.remove();
    });
    equals(bt.torrent.keys().length, 1,
           'Did not remove (' + bt.torrent.keys.length + ')');
    // XXX - Adding magnet links is broken.
    start();
    // bt.add.torrent(magnet, function(resp) {
    //   var tor = bt.torrent.get(magnet);
    //   equals(tor.properties.get('download_url'), magnet,
    //          'Got the right torrent');
    //   start();
    // });
  });
  stop();
});

test('bt.torrent.file', function() {
  expect(3);

  var url = 'http://vodo.net/media/torrents/Pioneer.One.S01E01.720p.x264-VODO.torrent';
  bt.add.torrent(url, function(resp) {
    var tor = bt.torrent.get(url);
    same(tor.file.keys(), _.keys(tor.file.all()),
         'Mismatch on keys: ' + tor.file.keys() + '\t' +
         _.keys(tor.file.all()));
    var file = _.values(tor.file.all())[0];
    try {
      ok(file.torrent, "Client didn't crash");
      equals(tor.properties.get('name'), file.torrent.properties.get('name'),
             'Parent is the right object');
    } catch(err) { console.log('Failed trying to get a file\'s torrent'); }
    tor.remove();
    start();
  });
  stop();
});

test('bt.torrent.peer', function() {
  var testValue, messages = { set: undefined, reset: undefined };
  var tor = bt.torrent.get(peer_torrent);
  if (tor.peer.keys().length == 0) {
    throw Error('Need to have the peer_torrent added to run these ' +
                'tests (since you\'ve gotta connect to some peers)');
    return;
  }
  var peer = tor.peer.get(tor.peer.keys()[0]);
  expect(2 * peer.properties.keys().length + 3);
  try{
    ok(peer.id, "Peer has an ID property");
  }catch(err){
    console.log(err);
  }
  ok(peer.torrent, "Peer has torrent association");
  equals(peer.torrent.properties.get("name"), tor.properties.get("name"), 
    "Parent torrent is correct");
    
  _.each(peer.properties.all(), function(value, key) {

    equals(peer.properties.get(key), value, sprintf('peer.properties.get() ' +
      'matches value provided by peer.properties.all() for %s.', key));

    ok(-1 !== _.indexOf(['boolean','number','string'], typeof(value)),
      sprintf('property %s is an expected datatype.', key))
      
      /* XXX - It appears that attempting to set read-only peer properties 
         crashes the client.
      
      // Set testvalue and assert messages according to datatype.
      switch(typeof(value)) {

        case 'boolean':
          testValue = !value;
          messages.set =
            sprintf('set() can set %s to %s.', key, (testValue).toString());
          messages.reset =
            sprintf('set() can set %s back to %s.', key, (value).toString());
          break;

        case 'number':
          testValue = 1 === value ? 0 : 1;
          messages.set = sprintf('set() can set %s to %d.', key, testValue);
          messages.reset = sprintf('set() can set %s back to %f.', key, value);
          break;

        case 'string':
          testValue = "x";
          messages.set = sprintf('set() can set %s to %s.', key, testValue);
          messages.reset = sprintf('set() can set %s back to %s.', key, value);
          break;
      }

      // set testValue
      try {
        peer.properties.set(key, testValue);
        equals(peer.properties.get(key), testValue, messages.set);
      }
      catch(error) {
        ok(false, sprintf('%s %s', messages.set, error.message));
      }

      // reset value
      try {
        peer.properties.set(key, value);
        equals(peer.properties.get(key), value, messages.reset);
      }
      catch(error) {
        ok(false, sprintf('%s %s', messages.reset, error.message));
      }
    */
  });
});

test('bt.rss_filter', function() {
  expect();
  var filtername = "FooBarBaz";
  var testValue, messages = { set: undefined, reset: undefined };
  // XXX Setting 'name' property throws an Error with empty message and no description
  var setBlacklist = ['name'];
  btapp.add.rss_filter(filtername);
  
  filterByName = btapp.rss_filter.get(filtername);
  ftkeys = btapp.rss_filter.keys();
  filterByKey = btapp.rss_filter.get(ftkeys[ftkeys.length-1]);
  equals( filterByName.properties.get("name"), 
          filterByKey.properties.get("name"), 
          "Filter can be accessed by name or key" );

  ok(filterByName.id, "Filter has an ID property");

    _.each(filterByName.properties.all(), function(value, key) {

    equals(filterByName.properties.get(key), value, sprintf('filter.properties.get() ' +
      'matches value provided by filter.properties.all() for %s.', key));
    
    
    ok(-1 !== _.indexOf(['boolean','number','string'], typeof(value)),
      sprintf('property %s is an expected datatype.', key))
    if (-1 === _.indexOf(setBlacklist, key)) {  
      // XXX - It appears that attempting to set read-only peer properties 
      // crashes the client.
      
      // Set testvalue and assert messages according to datatype.
      switch(typeof(value)) {

        case 'boolean':
          testValue = !value;
          messages.set =
            sprintf('set() can set %s to %s.', key, (testValue).toString());
          messages.reset =
            sprintf('set() can set %s back to %s.', key, (value).toString());
          break;

        case 'number':
          testValue = 1 === value ? 0 : 1;
          messages.set = sprintf('set() can set %s to %d.', key, testValue);
          messages.reset = sprintf('set() can set %s back to %f.', key, value);
          break;

        case 'string':
          testValue = "x";
          messages.set = sprintf('set() can set %s to %s.', key, testValue);
          messages.reset = sprintf('set() can set %s back to %s.', key, value);
          break;
      }

      // set testValue
      try {
        filterByName.properties.set(key, testValue);
        equals(filterByName.properties.get(key), testValue, messages.set);
      }
      catch(error) {
        ok(false, sprintf('%s %s', messages.set, error.message));
      }

      // reset value
      try {
        filterByName.properties.set(key, value);
        equals(filterByName.properties.get(key), value, messages.reset);
      }
      catch(error) {
        ok(false, sprintf('%s %s', messages.reset, error.message));
      }
      }
  });
});

test('bt.resource', function() {
  expect(1);

  var txt = 'test123\n';
  equal(bt.resource('data/foobar'), txt, 'Fetched the right data');
});

test('bt.settings', function() {
  var testValue, messages = { set: undefined, reset: undefined };

  // Do not test set() on blacklisted properties.
  // * Setting gui.show_btapps to false destroys the test environment.
  // * Property avwindow is a read-only window handle used by Bitdefender.
  var setBlacklist = ['gui.show_btapps', 'avwindow'];

  expect(4 * bt.settings.keys().length - 2 * setBlacklist.length + 2);

  ok(!_.isEmpty(bt.settings.all()), 'all() is nonempty.');

  same(_.keys(bt.settings.all()), bt.settings.keys(),
    'keys() matches keys in all().');

  _.each(bt.settings.all(), function(value, key) {

    equals(bt.settings.get(key), value, sprintf('bt.settings.get() correctly ' +
      'matches value provided by bt.settings.all() for %s.', key));

    ok(-1 !== _.indexOf(['boolean','number','string'], typeof(value)),
      sprintf('setting %s is an expected datatype.', key))

    if (-1 === _.indexOf(setBlacklist, key)) {

      // Set testvalue and assert messages according to datatype.
      switch(typeof(value)) {

        case 'boolean':
          testValue = !value;
          messages.set =
            sprintf('set() can set %s to %s.', key, (testValue).toString());
          messages.reset =
            sprintf('set() can set %s back to %s.', key, (value).toString());
          break;

        case 'number':
          testValue = 1 === value ? 0 : 1;
          messages.set = sprintf('set() can set %s to %d.', key, testValue);
          messages.reset = sprintf('set() can set %s back to %f.', key, value);
          break;

        case 'string':
          testValue = "x";
          messages.set = sprintf('set() can set %s to %s.', key, testValue);
          messages.reset = sprintf('set() can set %s back to %s.', key, value);
          break;
      }

      // Set testValue.
      try {
        bt.settings.set(key, testValue);
        equals(bt.settings.get(key), testValue, messages.set);
      }
      catch(error) {
        ok(false, sprintf('%s %s', messages.set, error.message));
      }

      // Reset value.
      try {
        bt.settings.set(key, value);
        equals(bt.settings.get(key), value, messages.reset);
      }
      catch(error) {
        ok(false, sprintf('%s %s', messages.reset, error.message));
      }
    }
  });
});

test('bt.log', function() {
  expect();

  // XXX - Fill out the unit tests
});
