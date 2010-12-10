jQuery(document).ajaxError(function(evt, req, opt, err) {
  if (window.debug && console) {
    console.log('jQuery ajaxError', {
      "event"       : evt,
      request       : req,
      options       : opt,
      error         : err,
      uriComponents : (function(uri) {
                        var parseUri = /^(?:([A-Za-z]+):)?\/{0,3}([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
                        var uriParts = parseUri.exec(uri) || { 5 : '' };
                        var result = {
                          scheme    : uriParts[1] || undefined,
                          host      : uriParts[2] || undefined,
                          port      : uriParts[3] || 80,
                          path      : uriParts[4],
                          query     : (function(query) {
                                        var result = {};
                                        _.each(query.split('&'), function(v) {
                                          var a = v.split('=');
                                          result[a[0]] = a[1];
                                        });
                                        return result;
                                      })(uriParts[5]),
                          fragment  : uriParts[6] || undefined
                        };
                        return result;
                      })(opt.url)
    });
  }
});
