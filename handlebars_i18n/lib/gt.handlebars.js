(function() {
  var textNodes = /[^><]+?(?=<|$)/g

  Handlebars.AST.ContentNode = function(string){
    this.type = "content";
    var newstring = "", nsindex=0;
    while(e = textNodes.exec( string )){
      var m = e[0].replace(/^\s+|\s+$/g,"")
      if(m.length){ 
        newstring += string.slice(nsindex, e.index)+gt.gettext(e[0])
        nsindex = e.index+e[0].length       
      }
    }
    newstring += string.slice(nsindex)
    this.string = newstring;
  }
  
  var escape = {
    "<": "&lt;",
    ">": "&gt;"
  };
  var badChars = /&(?!\w+;)|[<>]/g;
  var possible = /[&<>]/
  
  var escapeChar = function(chr) {
    return escape[chr] || "&amp;"
  };
      
  Handlebars.Utils.escapeExpression = function(string) {
    // don't escape SafeStrings, since they're already safe
    if(_.isString(string)) string = gt.gettext(string);
    if (string instanceof Handlebars.SafeString) {
      return gt.gettext(string.toString());
    } else if (string == null || string === false) {
      return "";
    }
    
    if(!possible.test(string)) { return string; }
    return string.replace(badChars, escapeChar);
  }
  Handlebars.registerHelper = function(name, fn, inverse) {
    if(inverse) { fn.not = inverse; }
    Handlebars.helpers[name] = function(){
      var result = fn.apply(Handlebars, arguments);
      if (result instanceof Handlebars.SafeString) {
        result = result.toString();
      }
      return gt.gettext(result);
    }
  };
 })();