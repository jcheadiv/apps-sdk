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

module('bt', bt.testUtils.moduleLifecycle);

test('bt.add.torrent', function() {

  // XXX - Need to test adding via. https
  ok(false, 'Added HTTPS test');

  var peer_torrent = this.utils.sampleResources.torrents[0];
  var url          = this.utils.sampleResources.torrents[1];
  var url_nocb     = this.utils.sampleResources.torrents[2];
  var url_def      = this.utils.sampleResources.torrents[3];
  var url_cbdef    = this.utils.sampleResources.torrents[4];
  var defs = { label: 'foobar' };
  // Just in case.

  bt.events.set('torrentStatus', bt._handlers.torrent);
  stop();
  // For use in the torrent.peer tests
  // bt.add.torrent(this.utils.sampleResources.torrents[0]);
  bt.add.torrent(url_nocb);
  bt.add.torrent(url_def, defs);

  this.utils.assertionCounter.increment(7 + _.keys(defs).length * 2);
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
        if (v.properties.get('download_url') === peer_torrent)
          return
        v.remove();
      });

      start();
    });
  });
});

// XXX - Adding RSS feeds currently crashes the client
test('bt.add.rss_feed', function() {
  // Do we want to expand the functionality to include
  // a callback and default property setting?

  try{
    bt.add.rss_feed(this.utils.sampleResources.rssFeeds[0]);
    ok(true, "Didn't explode while trying to add");
  }catch(err){
    ok(false, "bt.add.rss_feed error:" + err.message);
  }
  this.utils.assertionCounter.increment();

  bt.add.rss_feed(this.utils.sampleResources.rssFeeds[1]);
  bt.add.rss_feed(this.utils.sampleResources.rssFeeds[1]);
  stop();

  // XXX - This should be transitioned into an event once the functionality is
  // there.
  var that = this;
  setTimeout(function(){
    start();
    var btappfeed = btapp.rss_feed.get(that.utils.sampleResources.rssFeeds[1]);
    var btfeed    = btapp.rss_feed.get(that.utils.sampleResources.rssFeeds[0]);
    var rss_urls = _.map(bt.rss_feed.all(), function(v) {
      return v.properties.get('url');
    });
    same(rss_urls, _.keys(bt.rss_feed.all()),
      'Keys in bt.rss_feed.all() are accurate: ' +  _.keys(bt.rss_feed.all()));
    ok(_.indexOf(rss_urls, that.utils.sampleResources.rssFeeds[1]) >= 0,
      'RSS feed added successfully');

    that.utils.testKeysAgainstAllKeys(bt.rss_feed);

    try{
      btappfeed.remove();
      ok(true, "Btapp RSS feed was removed");
    }catch(err){
      ok(false, "Btapp RSS feed was removed: " + err.message);
    }

    try{
      btfeed.remove();
      ok(true, "Bt RSS feed was removed");
    }catch(err){
      ok(false, "Bt RSS feed was removed: " + err.message);
    }

  }, 2000);
  this.utils.assertionCounter.increment(4);
});

test('bt.add.rss_filter', function() {
  // Do we want to expand the functionality to include
  // a callback and default property setting?
  this.utils.assertionCounter.increment(7);
  var filter_bt = "BTFilterName";
  var filter_btapp = "BTAppFilterName";

  try{
    bt.add.rss_filter(filter_bt)
    ok(true, "Didn't explode while trying to add");
  }catch(err){
    ok(false, "bt.add.rss_filter error:" + err.message);
  }

  btapp.add.rss_filter(filter_btapp);
  btapp.add.rss_filter(filter_btapp);
  stop();

  setTimeout(function(){
    start();
    var btappfilter = btapp.rss_filter.get(filter_btapp);
    var btfilter = bt.rss_filter.get(filter_bt);

    var filter_names = _.map(bt.rss_filter.all(), function(v) {
      return v.properties.get('name');
    });

    same(filter_names, _.keys(bt.rss_filter.all()),
         'Keys: ' + _.keys(bt.rss_filter.all()));

    ok(_.indexOf(filter_names, filter_btapp) >= 0,
      'Filter added with correct name property');

    ok(_.indexOf(bt.rss_filter.keys(), filter_btapp) >= 0,
      'Filter added with correct key');

    //XXX - A duplicate filter object isn't created, but the keys are duplicated
    equals(bt.rss_filter.keys().length, _.keys(bt.rss_filter.all()).length,
      "Number of keys and objects is consistent; good duplicate behavior");

    // XXX - Filter objects have no remove method
    try {
      btappfilter.remove();
      ok(true, "Btapp RSS filter was removed.");
    } catch(err) {
      ok(false, "Btapp RSS filter was removed. " + err.message);
    }

    try {
      btfilter.remove();
      ok(true, "Bt RSS filter was removed.");
    } catch(err) {
      ok(false, "Bt RSS filter was removed. " + err.message);
    }

  }, 1000);

});

test('bt.stash', function() {
  this.utils.assertionCounter.increment(33);

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
  _.reduce(_.range(5), objs, function(acc, i) {
    acc['client-' + i] = '';
    return acc;
  });
  _.each(objs, function(v, k) {
    bt.stash.set(k, v);
    same(bt.stash.get(k), v, 'Parsing works');
    equals(stub.stash.get(k), JSON.stringify(v), 'Serialization works');
  });
  same(bt.stash.keys().sort(), _.keys(objs).sort(), 'keys() works');
  same(bt.stash.all(), objs, 'all() works');
  // What happens when really big items are put into the stash more than once?
  $.get('http://twitter.com', function(resp) {
    _.each(_.range(5), function(i) {
      bt.stash.set('client-' + i, resp);
    });
    _.each(_.range(5), function(i) {
      ok(bt.stash.get('client-' + i, false), 'Can get data from the stash');
    });
    _.each(_.range(5), function(i) {
      bt.stash.set('client-' + i, '');
    });
    start();
  });
  stop();
});

test('bt.events', function() {
  this.utils.assertionCounter.increment(3);

  var fn = function() { };
  bt.events.set('torrentStatus', fn);
  same(bt.events.get('torrentStatus'), fn, 'Callback set correctly');
  ok(_.indexOf(bt.events.keys(), 'torrentStatus') >= 0,
     'Torrent shows up in the keys');
  same(bt.events.all()['torrentStatus'], fn, 'All is returning the right data');
});

test('bt.torrent', function() {
  this.utils.assertionCounter.increment(13);

  bt.events.set('torrentStatus', bt._handlers.torrent);
  var url = this.utils.sampleResources.torrents[0];
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
    ok(status & bt.status.loaded && status & bt.status.queued,
       'Status: ' + status);
    tor.stop();
    ok(tor.properties.get('status') && bt.status.loaded, 'Torrent stopped');
    tor.start();
    ok(tor.properties.get('status') && bt.status.started, 'Torrent Started');
    tor.pause();
    ok(tor.properties.get('status') && bt.status.paused,
       'Torrent status (pause): ' + tor.properties.get('status'));
    tor.unpause();
    ok(!(tor.properties.get('status') && bt.status.paused),
         'Torrent status (unpause): ' + tor.properties.get('status'));
    // tor.recheck();
    // ok(tor.properties.get('status') & bt.status.checking,
    //    'Torrent status (recheck): ' + tor.properties.get('status'));
    //
    // XXX - Currently freezes the client
    // XXX - I wonder if this is because remove() returns while removal is still
    // XXX - in progress.
    //_.each(bt.torrent.all(), function(v) {
    //  v.remove();
    //});
    //
    // XXX - Adding magnet links is broken.
    bt.add.torrent(magnet, function(resp) {
      var tor = bt.torrent.get(magnet);
      equals(tor.properties.get('download_url'), magnet,
             'Got the right torrent');
      start();
    });
  });
  stop();
});

test('torrent.file', function() {
  var url = this.utils.sampleResources.torrents[0];
  var that = this;
  bt.add.torrent(url, function(resp) {
    var tor = bt.torrent.get(url);
    that.utils.testKeysAgainstAllKeys(tor.file);
    var file = _.values(tor.file.all())[0];
    var testParentByNameMsg = 'Test parent by name succeeded';
    try {
      equals(tor.properties.get('name'), file.torrent.properties.get('name'),
             testParentByNameMsg);
    }
    catch(error) {
      ok(false, sprintf('%s %s', testParentByNameMsg, error.message));
    }
    that.utils.assertionCounter.increment();

    that.utils.testProperties({
      object:     file,
      properties: ['index', 'torrent'],
      name:       'torrent.file'
    });

    _.each(['open', 'get_data'], function(method) {
      try { fn = file[method]; } catch(error) { fn = {} }
      that.utils.testFunction({
        fn:   fn,
        name: sprintf('file.%s', method),
        argc: 0
      });
    });

    that.utils.testPropertiesSet({
      testObject: file.properties,
      readOnly:   ['name', 'size', 'downloaded', 'scanstate', 'infection']
    });

    // XXX remove() takes a while to work, and results in failure of the
    // XXX following test.
    //tor.remove();
    start();
  });
  stop();
});

test('torrent.peer', function() {
  var testValue;
  var tor = bt.torrent.get(this.utils.sampleResources.torrents[0]);
  // Ensure we're testing with at minimum one torrent.
  if (0 === bt.torrent.keys.length) {
    bt.add.torrent(this.utils.sampleResources.torrents[0]);
  }

  // XXX peer doesn't seem to exist anymore...
  try {
    var peer = tor.peer.get(tor.peer.keys()[0]);
    ok(peer, "tor.peer.get works.");
  } catch(error) {
    ok(false, error.message);
  }
  this.utils.assertionCounter.increment();

  // XXX - API doc indicates the existence of a peer.id property
  // which doesn't actually exist
  try{
    ok(peer.id, "Peer has an ID property");
  }catch(err){
    ok(false, err.message);
  }
  this.utils.assertionCounter.increment();

  ok(peer.torrent, "Peer has torrent association");
  equals(peer.torrent.properties.get("name"), tor.properties.get("name"),
    "Parent torrent is correct");
  this.utils.assertionCounter.increment(2);

  // XXX - It appears that trying to set read-only peer properties crashes the client
  // this.utils.testPropertiesSet({
  //  testObject: peer.properties,
  //  readOnly:   peer.properties.keys()
  // });
  this.utils.testPropertiesSet({
    testObject: peer.properties,
    blacklist:  peer.properties.keys()
  });

});

test('bt.rss_filter', function() {
  var filtername = "FooBarBaz";

  // XXX Setting 'name' property throws an Error with empty message and no description
  var setBlacklist = ['name'];
  var readOnly = ['episode_filter', 'smart_ep_filter', 'feed', 'last_match',
    'resolving_candidate'];
  bt.add.rss_filter(filtername);

  filterByName = bt.rss_filter.get(filtername);
  ftkeys = bt.rss_filter.keys();
  filterByKey = bt.rss_filter.get(ftkeys[ftkeys.length-1]);

  equals( filterByName.properties.get("name"),
          filterByKey.properties.get("name"),
          "Filter can be accessed by name or key" );
  this.utils.assertionCounter.increment();

  this.utils.testProperties({
    object:     filterByName,
    properties: ['id'],
    name:       'filter'
  });

  this.utils.testPropertiesSet({
    testObject: filterByName.properties,
    blacklist:  setBlacklist,
    readOnly:   readOnly
  });

  try{
    filterByName.remove();
    ok(true, "RSS filter was removed");
  }catch(err){
    ok(false, "RSS filter was removed: " + err.message);
  }
  this.utils.assertionCounter.increment();
});

test('bt.resource', function() {
  var txt = 'test123\n';
  equal(bt.resource('data/foobar'), txt, 'Fetched the right data');
  this.utils.assertionCounter.increment();

});

test('bt.settings', function() {

  ok(!_.isEmpty(bt.settings.all()), 'all() is nonempty.');
  this.utils.assertionCounter.increment();

  this.utils.testKeysAgainstAllKeys(bt.settings);

  // * Setting gui.show_btapps to false destroys the test environment.
  // * Property avwindow is a read-only window handle used by Bitdefender.
  this.utils.testPropertiesSet({
    testObject: bt.settings,
    blacklist:  ['gui.show_btapps'],
    readOnly:   ['avwindow']
  });
});

test('bt.rss_feed', function() {

  // Ensure we're testing with at minimum one feed.
  if (0 === bt.rss_feed.keys.length) {
    bt.add.rss_feed(this.utils.sampleResources.rssFeeds[0]);
  }

  this.utils.testKeysAgainstAllKeys(bt.rss_feed);

  this.utils.testFunction({
    fn: bt.rss_feed.get,
    name: 'get',
    argc: 1
  });

  try { // XXX What's wrong with this assertion?
    same(bt.rss_feed.all()[this.utils.sampleResources.rssFeeds[0]],
      bt.rss_feed.get(this.utils.sampleResources.rssFeeds[0]),
      "get(key) corresponds to all()[key].");
  }
  catch(e) {
    ok(false, sprintf("get(key) corresponds to all()[key]. %s", e.message));
  }
  this.utils.assertionCounter.increment();

  // Now that we've tested get() and keys(), we can use them.
  var testFeed = bt.rss_feed.get(bt.rss_feed.keys()[0]);

  this.utils.testProperties({
    object:     testFeed,
    properties: ['id', 'properties', 'item'],
    name:       'testFeed'
  });

  this.utils.testFunction({
    fn:   testFeed.force_update,
    name: 'force_update',
    argc: 0
  });

  this.utils.testPropertiesSet({
    testObject: testFeed.properties,
    readOnly:   ['url']
  });

  // XXX The following utils.testFunction of remove should not execute remove(),
  // XXX but it does.
  console.log( 'bt.rss_feed.keys().length', bt.rss_feed.keys().length );
  // XXX Remove the above debug statement once this has been fixed.
  this.utils.testFunction({
    fn: testFeed.remove,
    name: 'remove',
    argc: 0
  });
  // XXX Remove the below debug statement once this has been fixed.
  console.log( 'bt.rss_feed.keys().length', bt.rss_feed.keys().length );
  // XXX Once that's been fixed, test remove() execution.
  // var feedCount = bt.rss_feed.keys().length;
  // testFeed.remove();
  // ok(bt.rss_feed.keys().length === feedCount - 1,
  //  'remove() decrements keys().length by 1.');
});

test('bt.log', function() {
  // XXX - Fill out the unit tests
});
