---
layout: default
title: Media Downloader
---

This is a tutorial that will introduce consumption of remote resources from
within an application as well as how to make the application feel a little more
like a native application than a web page. The focus is on media and
specialized feeds that are not RSS.

A complete version of the app from this tutorial can be found at:
[Media Downloader Example][example].

Setup
-----

First, let's get some tools installed. For Windows, there is a convenient
installer. Download and run [the tools installer][installer]. For other operating
systems, follow the instructions in the [install howto][installHowTo].

To see all the commands that the tools provide, run:

    % apps --help-commands

For any command, you can get specific help by running:

    % apps setup --help

Now that the tools have been installed and setup, create your project directory:

    % apps setup --name media_downloader
    % cd media_downloader

Inside the new `media_downloader` directory, there will be the basic structure
of an application. Two of the files in this directory are particularly
important:

- package.json

  This is a file that describes your app. Take a look and edit
  the values to something that makes a little more sense. Pay attention to
  `bt:update_url`. This is the location that will be checked for updates once
  your client has been installed. Make sure that this is a valid location so
  that you can update your app.

- icon.bmp

  The icon used to display your app inside the client. It is an icon
  that is 16x16 pixels and must be a BMP file.

Several of the directories are important too:

- package

  Local copies of all your external dependencies reside here.

- build

  Auto-generated files that are required.

- dist

  This is where built versions of your client end up.

- html

  Put the html that comes with your app here.

- lib

  The JavaScript that actually runs your app should go here.

- css

  Put the css that comes with your app here.

Take a look at `package.json` now. Pay special attention to a`bt:libs`. It
should look like:

    {% highlight js %}
    "bt:libs": [
        {
            "url": "http://staging.apps.bittorrent.com/pkgs/apps-sdk.pkg",
            "name": "apps-sdk"
        }
    ]
    {% endhighlight %}

`bt:libs` specifies the third party dependencies for your application. To
update these to the latest versions at any time, run:

    % apps update

Now, let's add a couple new external dependencies:

    % apps add --file=http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.1/jquery-ui.js
    % apps add --file=http://staging.apps.bittorrent.com/pkgs/widgets.pkg

Take a look at `package.json` again. `bt:libs` will look a little different:

    {% highlight js %}
    "bt:libs": [
        {
            "url": "http://staging.apps.bittorrent.com/pkgs/apps-sdk.pkg",
            "name": "apps-sdk"
        },
        {
            "url": "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.1/jquery-ui.js",
            "name": "jquery-ui"
        },
        {
            "url": "http://staging.apps.bittorrent.com/pkgs/widgets.pkg",
            "name": "widgets"
        }
    ]
    {% endhighlight %}

As you can see, there are 2 new dependencies that have been added to your
project under the `packages` directory and can be updated via.
`apps update`. To help with packaging and remote linking, when you run
`apps add`, the file is downloaded in saved in `packages/`.

The second dependency is the SDK Widgets package. We'll use the Download Widget
to conveniently make links to a set of torrents, which will automatically
download the torrent at the URL we provide, and display a progress bar while the
torrent is downloading. When the torrent is complete a "play" button will
appear. The Download Widget is extensible and customizable, but we'll be using
it without too much customization.

Accessing & Displaying A Feed
-----------------------------

Since this is all about downloading media, let's get the main page to
present list of content. Open `html/main.html` in the `media_downloader`
directory and replace what's there with:

    <ul id="items"></ul>

You'll notice that there isn't any `<script/>`, `<html/>` or `<body/>` tags in
this file. These are all auto-generated for you based on the dependencies,
JavaScript and css in your project. If you'd like to see what gets generated,
take a look at `build/index.html`.

The `lib` directory is where all your JavaScript should go. `index.js` inside
this directory is a little special: it will always be the last script loaded
and should be where all the main loading logic for your program should go. Now,
open `lib/index.js` so that we can add some JavaScript to populate that list
using the Download Widget.

    {% highlight js %}
    $(document).ready(function() {
      var JSONP_URL = 'http://vodo.net/jsonp/releases/all?callback=?';
      var loading = $('<p>Loading\u2026</p>').appendTo('body');

      $.getJSON(JSONP_URL, function(items) {
        _.each(items, function(value, key) {
          var elem = $(sprintf('<li id="%s">', value.title.replace(/\W+/g, '_')));
          elem.appendTo('#items');
          new bt.Widget.Download({
            name      : value.title,
            url       : value.torrents[0].url,
            elem      : $(elem).empty()[0],
            buttons   : {
              download  : ['Get %s',  'Loading\u2026'],
              play      : ['Play %s', 'Replay %s']
            }
          });
        });
        loading.remove();
      });
    });
    {% endhighlight %}

The Download Widget gets a settings object that can specify the above values in
addition to callbacks. The buttons object defined above specifies the button
values on their pre-click and post-click states. In our
[Media Downloader Example][example], the CSS makes these buttons appear as
hyperlinks.

Run your application in local mode via. `apps serve` and open in a [local
browser](http://localhost:8080) (http://localhost:8080). You will see a list
of links with the torrent title.

Using `apps serve` again will let you see how this looks in your browser. Now,
let's test the app in your client. Run:

    % apps --debug package

Double-click on the newly created file: `dist/media_downloader.btapp`. This
will open with your &micro;Torrent client, and appear in the left sidebar under
"Apps". Take a look at the application and try to add some torrents.

Looking at the app so far in your client, you'll notice that there's a debug
console on the bottom of the window. The `--debug` option can be used for any
`apps` command and usually enables some extra debugging information. When
packaging your project, this includes a debug console. It works like a normal
debug console letting you log to it via `console.log()` and navigate the
current DOM from the `HTML` tab. Unlike other apps flags, `--debug` affects the
commands that follow it rather than the one that precedes it.

A quick note about sprintf: This function is part of the app-sdk's
dependencies and provides full C/C++ sprintf functionality.

Take a little time to play with this in your browser. You'll notice that while
torrents get added, they don't actually have their progress updated. Since
there isn't any downloading occurring in your browser, the status event comes
back successfully (and adds a progress bar) but the progress isn't updated
automatically. To get something added to your progress bars, add any torrent on
the page by clicking on it and then type this into your debugging console
(Firebug for example):

    {% highlight js %}>>> bt.torrent.all()[bt.torrent.keys()[0]].properties.set('progress', 500){% endhighlight %}

If everything is working correctly, you will see the progress bar of that
torrent jump to half completion almost at once.

And, now let's package the app up. Make sure you're in the `media_downloader`
directory and once again:

    % apps package

Open up your client and double click on `media_downloader.btapp`. The app
will be added into your client. Take some time adding torrents to get a feel
of the user interactions that are going on here.

Stashing & Reusing Data
-----------------------

After playing around with this app, you'll notice a rough spot: every time you
leave the app and then return to it, it takes a long time to load the list. The
user experience is poor: your users will end up twiddling their thumbs while
they wait.

To fix the first problem, let's make the app use something called the stash,
a local data store. Our new JavaScript will package the original code into
a function that will be run twice: first immediately using the stashed copy of
items (if any), and then once a fresh set of results have been received.

    {% highlight js %}
    $(document).ready(function() {
      var JSONP_URL = 'http://vodo.net/jsonp/releases/all?callback=?';
      var loading = $('<p>Loading\u2026</p>').appendTo('body');

      var itemsToDlWidgets = (function(items) {
        _.each(items, function(value, key) {
          var elemId = value.title.replace(/\W+/g, '_');
          var elem = $(sprintf('#items #%s', elemId));
          var newElem = 0 === elem.length;
          if (newElem) elem = $(sprintf('<li id="%s">', elemId)).appendTo('#items');
          new bt.Widget.Download({
            name      : value.title,
            url       : value.torrents[0].url,
            elem      : $(elem).empty()[0],
            buttons   : {
              download    : ['Get %s',  'Loading\u2026'],
              play        : ['Play %s', 'Replay %s']
            },
            callbacks : {
              addTorrent  : newElem ? undefined : new Function
            }
          });
        });
        if (0 < items.length) loading.remove();
        return arguments.callee;
      })(bt.stash.get('items', []));

      $.getJSON(JSONP_URL, function(items) {
        bt.stash.set('items', items);
        itemsToDlWidgets(items);
      });
    });
    {% endhighlight %}

There are a few of changes that have been made here to accommodate loading
both stashed items and fetched ones:
* We eliminate the "Loading&hellip;" indicator if there are stashed items.
* The element for each list item is reused if it has already been created.
* The addTorrent callback is defined conditionally upon whether its torrent has
  already been given a Download Widget. If we leave the callback undefined, its
  default behavior will be set, which is to display the progress bar once the
  torrent has been added. Since we are reusing our elements, we want to override
  the default callback the second time around with a new function that does
  nothing more than prevent the default from being set.

Any elements that aren't in the stash will get appended to the end of the
list. There are also some edge cases in this exact implementation. When using
this for your own app, make sure you think about what constitutes a new/old
item.

Once the torrent(s) you have downloaded are complete, the Download Widget will
present a "Play" button. For multiple-file torrents, the biggest file in the 
torrent is the file that will play.

Since you won't be able to see this new feature in action from a web browser, 
give this a try in your client. You can play content from right inside the 
app, instead of having to hunt around on the file system for it.

Auto-Updating The App
---------------------

As you've been developing your app, you might notice that you've been 
alternating between using the serve command, for doing development in a 
browser, and the package command, to zip up all the source files and view the 
app in the client. It would be nice to not have to stop the server, run 
the package command and double-click the .btapp file every time you want to 
refresh the app in the client, right?

To start, run:

    % apps --debug generate --update http://localhost:8080/dist/media_downloader.btapp package
    % apps --debug generate --update http://localhost:8080/dist/media_downloader.btapp serve

Go to http://localhost:8080/dist/media_downloader.btapp; download and install 
the app right from your browser. In the server log, you should see the GET 
request you just made to the server; above that, notice that the server 
actually ran the package command before delivering the btapp file to you.

The upshot of this is that you can now make changes to the source files, view 
them live in a browser, then tell the client to go fetch the latest version of 
the app from the server. The server will package up your changes so you can see 
them in the client without running any commands at all.

With the server running, make some change to the app and check that the change 
appears in the browser. Then switch to your client and select 
Help > Check for Updates in the menu bar. When you refresh the app, you 
should see your new change in the client.

If this trick isn't working (you should see the package commands running in 
the server log), check your Advanced preferences for the 
btapps.auto_update_apps setting and make sure it's set to true.

[example]:      http://github.com/bittorrent/apps-sdk/tree/master/examples/media_downloader
[installer]:    http://github.com/downloads/bittorrent/apps-sdk/apps-sdk-installer.msi
[installHowTo]: ../install-howto.html

