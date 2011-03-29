var gt = {};
$(document).ready(function() {
  gt = new bt.Gettext("jp");
  gt.include_raw(bt.resource("test/messages.po"));

  /*
  files = ["test.html", "torrent.html", "torrent_list.html", "publish_channel.html", "settings.html"];
  _.each(files, function(file){
    str = bt.resource("html/"+file)
    fn = Handlebars.compile(str);
  })
  */
});
