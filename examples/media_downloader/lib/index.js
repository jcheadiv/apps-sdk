$(document).ready(function() {
  var JSONP_URL = 'http://vodo.net/jsonp/releases/all?callback=?';
  var loading = $('<p>Loading\u2026</p>').appendTo('body');

  // Turn items from the Vodo releases jsonp response into Download Widgets.
  // We run this function twice: first immediately using the stashed copy of
  // items (if any), and then once a fresh set of results have been received.
  var itemsToDlWidgets = (function(items) {
    _.each(items, function(value, key) {

      var elemId = value.title.replace(/\W+/g, '_');
      var elem = $(sprintf('#items #%s', elemId));
      var newElem = 0 === elem.length;
      if (newElem) elem = $(sprintf('<li id="%s">', elemId)).appendTo('#items');

      new bt.Widget.Download({
        name      : value.title,
        url       : value.torrents[0].url,
        elem      : $(elem).empty()[0],
        buttons   : {
          download    : ['Get %s',  'Loading\u2026'],
          play        : ['Play %s', 'Replay %s']
        },
        callbacks : {
          addTorrent  : newElem ? undefined : new Function
        }
      });
    });
    if (0 < items.length) loading.remove();
    return arguments.callee;
  })(bt.stash.get('items', []));

  $.getJSON(JSONP_URL, function(items) {
    bt.stash.set('items', items);
    itemsToDlWidgets(items);
  });
});
