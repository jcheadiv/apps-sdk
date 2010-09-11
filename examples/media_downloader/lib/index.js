$(document).ready(function() {
  var JSONP_URL = 'http://vodo.net/jsonp/releases/all?callback=?';

  var itemsToDlWidgets = function(items) {
    _.each(items, function(value, key) {

      var elemId = value.title.replace(/\W+/g, '_');
      var elem = $(sprintf('#items #%s', elemId));
      if (0 === elem.length) {
        elem = $(sprintf('<li id="%s">', elemId)).appendTo('#items');
      }

      new bt.Widget.Download({
        name : value.title,
        url  : value.torrents[0].url,
        elem      : elem.empty(),
        buttons   : {
          download  : ['Get %s',  'Loading\u2026'],
          play      : ['Play %s', 'Replay %s']
        }
      });

    });
    return arguments.callee;
  }(bt.stash.get('items', []));

  $.getJSON(JSONP_URL, function(items) {
    bt.stash.set('items', items);
    itemsToDlWidgets(items);
  });
});
