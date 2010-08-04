---
layout: default
title:  Search Tutorial
---

This tutorial covers the implementation of a torrent search interface in the
&micro;Torrent client using XML output and a view template.

If you haven't covered the [Media Downloader example](media_downloader.html)
yet, you should start there to cover some basic concepts that are used here.

This tutorial covers all of the important parts of a functional search, but
omits some of the HTML and CSS used to polish the provided [search
example][searchex].

First, let's create a new project and add the dependencies we'll use:

    % apps setup --name='search_example'
    % apps add --file='http://github.com/malsup/form/raw/master/jquery.form.js?v2.43'
    % apps add --file='http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.1/jquery-ui.js'
    % apps update

The Search for Torrents
=======================

We're going to build a frontend for a torrent search. The basic HTML form is
simple. It goes in html/main.html:

    <form id="search" action="http://www.clearbits.net/home/search/index.xml" method="get">
      <div>
        <label for="query">Search Content</label>
        <input class="field" id="query" name="query" size="30" type="text" />
        <input type="image" src="http://www.clearbits.net/images/btn/search.png" class="submit" />
        <span class="summary"><!--populated--></span>
      </div>
    </form>

We'll use the [jquery form plugin][jqform] to submit the search form via XHR.
The following goes in lib/index.js, inside your `$(document).ready` function:

    $('form#search').ajaxForm({
      type: 'GET',
      dataType: 'xml',
      beforeSubmit: function() {
        removeResults();
      },
      success: function(data) {
        parseXml(data);
      }
    });

It's followed by definitions of `removeResults()` and `parseXml()`. Before
presenting those, let's examine the template that they utilize.


The View Template
=================

Let's create a DOM-based view template to keep our code separate from our
markup. The [underscore.js][underscore] library provides a simple and effective
template engine. In order to define our template in our HTML source, we need to
define variable delimiters that play friendly with the parser. Enter the
following in lib/index.js:

    // Define template delimiters that allow a DOM-based view template.
    _.templateSettings = {
      start       : '==',
      end         : '==',
      interpolate : /==(.+?)==/g
    };

We can then define our template in html/main.html as follows. This makes use of
the values provided by the [ClearBits search results XML][cbxml].

    <ul id="items" class="template">
      <li>
          <h3><a href="==location==">==title==</a></h3>
          <ul class="inline">
            <li><a href="==torrent_url==">Torrent</a></li>
            <li><a href="==location==">More Info</a></li>
            <li><a href="==license_url==" class="license"><!--populated--></a></li>
          </ul>
          <table>
            <tr><th>Seed:Leech</th><td>==seeds==:==leechers==</td></tr>
            <tr><th>Size</th><td>==mb_size==MB</td></tr>
            <tr><th>Created</th><td><time datetime="==created_at=="></time></td></tr>
            <tr><th>Hash</th><td>==hashstr==</td></tr>
          </table>
      </li>
    </ul>

Note that this template is qualified via the classname of its parent. Elements
having the `template` class are hidden via the css in css/screen.css. When the
view template is parsed below, this class will be removed and the DOM element
emptied and reused for template-formatted markup.

    .template {
      display: none;
    }


Parsing the XML Result Set
==========================

Let's return to the functions used by the [jquery form plugin][jqform].
`removeResults()` allows multiple searches to be performed without preserving
the results of previous searches.

    var removeResults = function() {
      $("ul#items").empty();
      $("#search .summary").empty();
    }

`parseXml()` the meat of this app. It is responsible for receiving the search
results in XML form, and creating a UI to access them. It does a few things:

1. It compiles the view template that we defined above. This only happens once.
2. It populates the torrent list with formatted data received in the XML.
3. It enhances the populated list with formatted metadata received in the XML.

The following javaScript does this work:

    var parseXml = (function() {
      var node, values = {};

      // Account for ieframe's presumptuous treatment of template URLs.
      var templateSource = $("ul#items").html();
      if ("btresource:" === document.location.protocol) {
        templateSource = templateSource.replace(/btresource:\/\/btapp\//g, "");
      }

      // Compile the view template.
      var template = _.template(templateSource);
      $("ul#items").empty().toggleClass("template");

      return function(xml) {
        // Populate the list.
        $(xml).find("torrent").each(function() {
          $(this.childNodes).each(function() {
            var value = this.innerText || this.textContent;
            // Account for IE's nested node values.
            if (1 === this.nodeType && this.childNodes.length) {
              value = this.childNodes[0].nodeValue;
            }
            values[this.nodeName.replace(/\W/, "_")] = value;
          });
          $("ul#items").append(template(values));
        });

        // Display relative datetimes for when created.
        $("ul#items time").each(function() {
          var d = new Date($(this).attr("datetime"));
          if (isNaN(d))
            d = d.fromW3cDtf($(this).attr("datetime"));
          $(this).parent().html(d.howLongAgo());
        });

Note that we have extended the `Date` prototype with two methods: `fromW3cDtf()`
and `howLongAgo()`. The first allows us to parse [W3C DTF][w3cdtf]-formatted
dates (a subset of ISO 8601), and the second allows us to display a relative
date of how long ago a given torrent was added. The details of these methods are
not discussed in this tutorial, but you can view both of them in the search
example's [date.js][datejs].

Continuing with `parseXml()`, let's identify the Creative Commons license based
on its URL, and add a summary of the search results to the search form's
`span.summary` if we have any results.

        // Display the license name
        $("ul#items .license").each(function() {
          var licenses = $(this).attr("href").match(/by-\w+/);
          if (null !== licenses) {
            $(this).text(licenses[0].toUpperCase() + " License");
          }
          else { // Unknown license; remove the node.
            $(this).parent().remove();
          }
        });

        // Summarize the results.
        var keywords = $("#search input[name=query]")[0].value;
        $("#search .summary").text(keywords ?
          sprintf('%d results found for "%s"',
          $(xml).find("torrent").length, keywords) : "");

The remainder of `parseXml()` appears in the following code block. Here we'll
use bt.progressManager (described below) to add a progress bar to each added
torrent.

        $("a[href$='torrent']").click(function() {
          var elem = $(this).closest("ul").next().prepend(
            "<tr><th>Progress</th><td class='progress'>" +
            "<div></div></td></tr>");
          $(elem).find("tr").first().effect("highlight", {}, 1000);
          bt.add.torrent(this.href, function(response) {
            if (1 === response.state) { // Torrent added successfully
              var pb = bt.progressManager.createBar({
                id: response.url,
                elem: $("div", elem)
              });
            }
          });
          // Unhyperlink the clicked text.
          $(this).replaceWith($(this).text());
          return false;
        });
      }
    })();

Progress Manager
================

In order to manage each torrent's progress bars, let's give the bt object
a progress manager to handle progress bars. We'll use [jquery ui][jqui] to
handle the bars themselves, while he progressManager will keep them synchronized
with the torrent download progress.

    bt.progressManager = (function() {
      var bars = {};
      return {
        // createBar takes as its argument an object with id defined as torrent
        // identifier (hash or URL), elem as jQuery element for a progress bar.
        createBar: function(settings) {
          var bar;
          if (settings && settings.id) {
            bar = bars[settings.id] = settings.elem.progressbar();
            bt.progressManager.keepBarUpdated(settings.id);
          }
          return bar;
        },
        // updateBar takes argument of torrent identifier (hash or URL).
        updateBar: function(id) {
          bars[id].progressbar({
            value: bt.torrent.get(id).properties.get("progress") / 10
          });
        },
        keepBarUpdated: function(id) {
          if (1000 > bt.torrent.get(id).properties.get("progress")) {
            setTimeout(function() {
              bt.progressManager.keepBarUpdated(id);
            }, 250);
          }
          bt.progressManager.updateBar(id);
        }
      };
    })();


Cross-Origin Resource Sharing
=============================

Since apps are built and tested from a local server, your browser's
Single-Origin Policy will require one of several measures in order to access
data from any other server. While most widely supported solution is
[jsonp][jsonp],
[Cross-Origin Resource Sharing][cors] (aka HTTP
Access Control) provides a more nuanced apparatus for obtaining data in
arbitrary formats, where it is supported. Both of these measures require
server-side cooperation. In the case of this example, nginx has been configured
to allow CORS for search results requested from any localhost as follows:

    # Implement HTTP Access Control for search XML.
    location /home/search/index.xml {
     if ($http_origin ~* "(127\.0\.0\.1|localhost):?\d*") {
      add_header Access-Control-Allow-Origin $http_origin;
     }
    }


[cbxml]:      http://www.clearbits.net/home/search/index.xml?query=lessig
[cors]:       http://www.w3.org/TR/access-control/
[datejs]:     http://github.com/bittorrent/apps-sdk/tree/master/examples/search/lib/date.js
[jqform]:     http://jquery.malsup.com/form/
[jqui]:       http://jqueryui.com/
[jsonp]:      http://bob.pythonmac.org/archives/2005/12/05/remote-json-jsonp/
[prettydate]: http://ejohn.org/files/pretty.js
[underscore]: http://documentcloud.github.com/underscore/
[searchex]:   http://github.com/bittorrent/apps-sdk/tree/master/examples/search/
[w3cdtf]:     http://www.w3.org/TR/NOTE-datetime
