/*
 * Copyright(c) 2010 BitTorrent Inc.
 */

(function($) {

  bt.mixpanel = new MixpanelLib("929fd923f3c813bb4e25f7bb4ac85105",
                                 "bt.mixpanel");

  var send_request = function(url, data) {
    url += '?';
    if (data) { url += bt.mixpanel.http_build_query(data) }
    if (bt.mixpanel.config.test) { url += '&test=1' }

    $.ajax({
      url: url,
      success: function(resp) {
        eval(bt.mixpanel.callback_fn + '("' + resp + '")');
      },
      beforeSend: function(xhr, settings) {
        xhr.setRequestHeader('X-ClientID', bt.settings.get('computer_id'));
      }
    });
  };

  bt.mixpanel.send_request = send_request;

  $(document).ready(function() {

    bt.mixpanel.api_host = 'http://yogi.apps.bittorrent.com';

    var appdata = JSON.parse(bt.resource('package.json'));

    var client = 'ut';
    try {
      bt.settings.get('show_menu');
      client = 'bt';
    } catch(e) { }

    bt.mixpanel.register({
      distinct_id: bt.settings.get('computer_id'),
      h: bt.settings.get('computer_id'),
      v: bt.settings.get('revision'),
      c: client,
      view: appdata.name == 'ui' ? 'v8' : 'ut',
      bucket: appdata.name == 'ui' ? 'v8' : appdata.name,
      appname: appdata.name,
      appversion: appdata.version
    });
  });

})(jQuery);
