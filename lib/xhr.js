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

  function swap_location(xhr, settings) {
    var parts = rurl.exec( settings.url );
    var remote = parts && (parts[1] && parts[1] !== location.protocol ||
                           parts[2] !== location.host)
    if (remote) {
      xhr.open(settings.type, sprintf('/%s#%s', (new Date()).getTime(),
                                      settings.url), settings.async);
      xhr.setRequestHeader('x-location', settings.url);
    }
  };

  if (window.develop) {
    $.ajaxSetup({ beforeSend: swap_location });
  }
});
