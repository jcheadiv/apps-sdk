/*
 * Copyright(c) 2011 BitTorrent Inc.
 */

(function($) {

  if (!$.browser.msie || parseInt($.browser.version) > 8) return

  var re_width = /-width:(\d+)/;

  var styles = _($("link[media]")).chain().map(function(elem) {
    return [parseInt($(elem).attr("media").match(re_width)[1]),
            $(elem).attr("href")];
  }).sortBy(function(a) {
    return -a[0];
  }).value();

  var win = $(window);

  var current_style = $("<link rel='stylesheet' type='text/css' />").appendTo(
    "head");

  var resizor = function() {
    var width = win.width();
    var set = false;

    _.each(styles, function(v) {
      if (v[0] < width) {
        if (!set) current_style.attr("href", "");
        throw '__break__';
      }

      set = true;
      if (current_style.attr("href") != v[1])
        current_style.attr("href", v[1]);
    });
  };

  win.resize(resizor);

  $(document).ready(function() {
    _.defer(resizor);
  });

})(jQuery);
