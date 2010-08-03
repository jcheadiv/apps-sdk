//
// Search Example using XML output from ClearBits
//
// Copyright (c) 2010 BitTorrent Inc.
// License: ************
//
// Date: %date%
// Version: %version%
//

//----------------------------------------------------------------------------
// Define template delimiters that allow a DOM-based view template.
  _.templateSettings = {
    start       : '==',
    end         : '==',
    interpolate : /==(.+?)==/g
  };

$(document).ready(function() {
  //--------------------------------------------------------------------------
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

  //--------------------------------------------------------------------------
  // Remove any previous results
    var removeResults = function() {
      $("ul#items").empty();
      $("#search .summary").empty();
    }

  //--------------------------------------------------------------------------
  // Parse the ClearBits search XML using the HTML view template.
    var parseXml = (function() {
      var node, values = {};

      // Compile the view template.
      var template = _.template($("ul#items").html());
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

      //----------------------------------------------------------------------
      // Add a progress bar for each added torrent.
        $("a[href$='torrent']").click(function() {
          var elem = $(this).closest("ul").next().prepend(
            "<tr><th>Progress</th><td class='progress'>" +
            "<div></div></td></tr>");
          $(elem).find("tr").first().effect("highlight", {}, 1000);
          bt.add.torrent(this.href, function(response) {
            if ("success" === response.message) {
              bt.torrent.get(response.hash).properties.set(
                "progressBar", $("div", elem).progressbar());
              _.extend(bt.torrent.get(response.hash), {
                updateProgressBar: function() {
                  this.properties.get('progressBar').progressbar({
                    value: this.properties.get('progress') / 10
                  });
                }
              });
            }
          });
          // Unhyperlink the clicked text.
          $(this).replaceWith($(this).text());
          return false;
        });

      }
    })();

  //--------------------------------------------------------------------------
  // Update the progress bar periodically.
    setInterval(function progressReport() {
      _.each(bt.torrent.all(), function(tor, k) {
        try {
          tor.updateProgressBar();
        }
        catch(err) {
          if (window.debug) {
            console.log('bt.add.torrent() may have failed.', tor, err.message);
          }
        }
      })
    }, 250);
});
