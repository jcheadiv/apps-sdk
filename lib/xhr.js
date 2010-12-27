/*
 * Conveniently forward all jquery xhr requests through the dev server when in
 * develop mode.
 *
 * Copyright(c) 2010 BitTorrent Inc.
 *
 */

$(document).ready(function() {
  // Taken directly from jquery's ajax.js
  var rurl = /^(\w+:)?\/\/([^\/?#]+)/;


  if (window.develop || window.falcon) {
    $.ajax = _.wrap($.ajax, function(fn) {

      var pre_url;

      function swap_location(xhr, settings) {
        params = settings.url.split('?').length > 1 ?
          settings.url.split('?').slice(-1)[0] : '';
        if (params.length > 0) {
          // don't add a ? if there are no parameters to begin with
          pre_url += (/\?/.test(pre_url) ? '&' : '?') + params;
        }
        xhr.setRequestHeader('x-location', pre_url);
      };

      var args = _.rest(arguments);
      var settings = args[0];
      var parts = rurl.exec( settings.url );
      var remote = parts && (parts[1] && parts[1] !== location.protocol ||
                             parts[2] !== location.host)
      if (remote) {
        pre_url = settings.url;
        settings.url = settings.url.replace(parts[2], location.host);
        // settings.url = sprintf(
        //   '%s/', (window.falcon ? window.falcon.get_xhr_prefix() : ''));
        // XXX - beforeSend should be saved.
        settings.beforeSend = swap_location;
        settings.cache = false;
      }
      return fn.apply(this, args);
    });
  }
});
