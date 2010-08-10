/*
 * Enables the conditional running of specific modules or tests.
 *
 * For a discussion of what's valid, check out:
 *     http://docs.jquery.com/QUnit#URL_Parameters
 *
 * Copyright(c) 2010 BitTorrent Inc.
 *
 */

(function() {
  var tests = bt.resource('meta');
  if (!tests)
    return
  tests = tests.replace(/^\s+|\s+$/g, '');
  if (window.location.search != "?" + escape(tests))
    window.location.search = '?' + escape(tests);
})();
