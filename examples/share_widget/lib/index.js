$("document").ready(function(){
    _.delay(function(){
      var typeContainer = new bt.Widget.Share({
        url: "http://www.utorrent.com",
        title: "uTorrent: A Lightweight Bittorrent Client",
        elem: $("#type-container"),
        via: "skyebt",
        text: "Check out this awesome software!",
        types: ["facebook", "twitter", "email"]
      });
    
      var noTypeContainer = new bt.Widget.Share({
        url: "http://www.utorrent.com",
        title: "uTorrent: A Lightweight Bittorrent Client",
        elem: $("#notype-container"),
        via: "skyebt",
        text: "Check out this awesome software!"
      });
    
      var typeArray = new bt.Widget.Share({
        url: "http://www.utorrent.com",
        title: "uTorrent: A Lightweight Bittorrent Client",
        elem: $("#type-array a"),
        types: ["facebook", "twitter"]});
    
      var noTypeArray = new bt.Widget.Share({
        elem: $("#notype-array a"),
        url: "http://www.utorrent.com",
        title: "uTorrent: A Lightweight Bittorrent Client"});
    
      var nothing = new bt.Widget.Share({});
    }, 1);
});
