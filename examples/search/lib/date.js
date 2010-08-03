//
// Date prototype extensions for the ClearBits search example
//
// Copyright (c) 2010 BitTorrent Inc.
// License: ************
//
// Date: %date%
// Version: %version%
//

//------------------------------------------------------------------------------
// Add a method to the Date object to handle date strings formatted according to
// W3C DTF, a subset of ISO 8601. W3C-DTF is described in this note:
// http://www.w3.org/TR/NOTE-datetime The Date object will be able to handle
// ISO 8601 strings natively according to ECMAScript 5, but most UAs still do
// not support it. This code has been adapted from Mozilla Firefox 3.6.8 code,
// which it is licensed as MPL 1.1/GPL 2.0/LGPL 2.1

  Date.prototype.fromW3cDtf = function(aDateString) {

    var HOURS_TO_MINUTES = 60;
    var MINUTES_TO_SECONDS = 60;
    var SECONDS_TO_MILLISECONDS = 1000;
    var MINUTES_TO_MILLISECONDS = MINUTES_TO_SECONDS * SECONDS_TO_MILLISECONDS;
    var HOURS_TO_MILLISECONDS = HOURS_TO_MINUTES * MINUTES_TO_MILLISECONDS;

    var dateString = aDateString;
    if (!dateString.match('-')) {
      // Workaround for server sending
      // dates such as: 20030530T11:18:50-08:00
      // instead of: 2003-05-30T11:18:50-08:00
      var year = dateString.slice(0, 4);
      var month = dateString.slice(4, 6);
      var rest = dateString.slice(6, dateString.length);
      dateString = year + "-" + month + "-" + rest;
    }

    var parts = dateString.match(/(\d{4})(-(\d{2,3}))?(-(\d{2}))?(T(\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|([+-])(\d{2}):(\d{2}))?)?/);

    // Here's an example of a W3C-DTF date string and what .match returns for it.
    //
    // date: 2003-05-30T11:18:50.345-08:00
    // date.match returns array values:
    //
    //   0: 2003-05-30T11:18:50-08:00,
    //   1: 2003,
    //   2: -05,
    //   3: 05,
    //   4: -30,
    //   5: 30,
    //   6: T11:18:50-08:00,
    //   7: 11,
    //   8: 18,
    //   9: :50,
    //   10: 50,
    //   11: .345,
    //   12: 345,
    //   13: -08:00,
    //   14: -,
    //   15: 08,
    //   16: 00

    // Create a Date object from the date parts.  Note that the Date
    // object apparently can't deal with empty string parameters in lieu
    // of numbers, so optional values (like hours, minutes, seconds, and
    // milliseconds) must be forced to be numbers.
    var date = new Date(parts[1], parts[3] - 1, parts[5], parts[7] || 0,
      parts[8] || 0, parts[10] || 0, parts[12] || 0);

    // We now have a value that the Date object thinks is in the local
    // timezone but which actually represents the date/time in the
    // remote timezone (f.e. the value was "10:00 EST", and we have
    // converted it to "10:00 PST" instead of "07:00 PST").  We need to
    // correct that.  To do so, we're going to add the offset between
    // the remote timezone and UTC (to convert the value to UTC), then
    // add the offset between UTC and the local timezone //(to convert
    // the value to the local timezone).

    // Ironically, W3C-DTF gives us the offset between UTC and the
    // remote timezone rather than the other way around, while the
    // getTimezoneOffset() method of a Date object gives us the offset
    // between the local timezone and UTC rather than the other way
    // around.  Both of these are the additive inverse (i.e. -x for x)
    // of what we want, so we have to invert them to use them by
    // multipying by -1 (f.e. if "the offset between UTC and the remote
    // timezone" is -5 hours, then "the offset between the remote
    // timezone and UTC" is -5*-1 = 5 hours).

    // Note that if the timezone portion of the date/time string is
    // absent (which violates W3C-DTF, although ISO 8601 allows it), we
    // assume the value to be in UTC.

    // The offset between the remote timezone and UTC in milliseconds.
    var remoteToUTCOffset = 0;
    if (parts[13] && parts[13] != "Z") {
      var direction = (parts[14] == "+" ? 1 : -1);
      if (parts[15])
        remoteToUTCOffset += direction * parts[15] * HOURS_TO_MILLISECONDS;
      if (parts[16])
        remoteToUTCOffset += direction * parts[16] * MINUTES_TO_MILLISECONDS;
    }
    remoteToUTCOffset = remoteToUTCOffset * -1; // invert it

    // The offset between UTC and the local timezone in milliseconds.
    var UTCToLocalOffset = date.getTimezoneOffset() * MINUTES_TO_MILLISECONDS;
    UTCToLocalOffset = UTCToLocalOffset * -1; // invert it
    date.setTime(date.getTime() + remoteToUTCOffset + UTCToLocalOffset);

    return date;
  }

//------------------------------------------------------------------------------
// Add a method to the Date object to find out how long ago it represents.
// Adapted from John Resig's prettyDate() <http://ejohn.org/files/pretty.js>
// This method is derived from MIT licensed code.
  Date.prototype.howLongAgo = function() {
    if (isNaN(this.getTime()))
      return;

    var diff = (((new Date()).getTime() - this.getTime()) / 1000),
      day_diff = Math.floor(diff / 86400);

    return day_diff === 0 && (
        diff <    60 && "just now" ||
        diff <   120 && "1 minute ago" ||
        diff <  3600 && Math.floor( diff / 60 ) + " minutes ago" ||
        diff <  7200 && "1 hour ago" ||
        diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
      day_diff === 1 && "Yesterday" ||
      day_diff <  12 && day_diff + " days ago" ||
      day_diff <  57 && Math.round( day_diff / 7 ) + " weeks ago" ||
      day_diff < 548 && Math.round( day_diff / 30.436875 ) + " months ago" ||
      Math.round( day_diff / 365.2425 ) + " years ago";
  }
