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
          // XXX - This is adding double-params for things if the url has
          // params in it already.
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
      if (remote && settings.url.slice(settings.url.length-10, settings.url.length) != 'callback=?') {
        // TODO: figure out exactly how jQuery determines when a
        // $.getJSON request will 'intelligently' decide to do JSONP
        pre_url = settings.url;
        if (window.falcon) {
          settings.url = window.falcon.get_xhr_prefix();
        } else {
          settings.url = settings.url.replace(parts[2], location.host);
        }
        var cur_before_send = settings.beforeSend;
        settings.beforeSend = function(xhr, settings) {
          swap_location(xhr, settings);
          if (cur_before_send) cur_before_send(xhr, settings);
        };
        settings.cache = false;
      }
      return fn.apply(this, args);
    });
  }
});
