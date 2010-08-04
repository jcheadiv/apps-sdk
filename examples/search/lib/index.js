//
// Search Example using XML output from ClearBits
//
// Copyright (c) 2010 BitTorrent Inc.
// License: ************
//
// Date: %date%
// Version: %version%
//

//------------------------------------------------------------------------------
// Define template delimiters that allow a DOM-based view template.
  _.templateSettings = {
    start       : '==',
    end         : '==',
    interpolate : /==(.+?)==/g
  };

$(document).ready(function() {
  //----------------------------------------------------------------------------
  // Submit the search form via XHR.
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

  //----------------------------------------------------------------------------
  // Remove any previous results
    var removeResults = function() {
      $("ul#items").empty();
      $("#search .summary").empty();
    }

  //----------------------------------------------------------------------------
  // Parse the ClearBits search XML using the HTML view template.
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

      //------------------------------------------------------------------------
      // Add a progress bar for each added torrent.
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

  //----------------------------------------------------------------------------
  // Give the bt object a progress manager to handle progress bars.
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
});
