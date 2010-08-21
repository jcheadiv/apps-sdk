var utils = {
  //----------------------------------------------------------------------------
  // utils.sampleResources
  //    Provides URLs for sample resources used in various unit tests.
  //
  sampleResources: {
    torrents: [
      'http://vodo.net/media/torrents/The.Yes.Men.Fix.The.World.P2P.Edition.' +
        '2010.Xvid-VODO.torrent'
    ],
    rssFeeds: [
      'http://vodo.net/feeds/public',
      'http://clearbits.net/rss.xml'
    ]
  },

  //----------------------------------------------------------------------------
  // utils.assertionCounter
  //    Track count of expected assertions.
  //
  // Methods:
  //
  //    increment()
  //      Increment the count of expected assertions.
  //      Parameter:
  //        amount (Number): Amount to increment (optional; default is 1).
  //
  //    reset()
  //      Reset the count of expected assertions to 0.
  //      Returns:
  //        Number assertion total count prior to reset (for expect()).
  //
  assertionCounter: (function() {
    var count = 0;
    return {
      increment: function(amount) {
        count += 'number' === typeof amount ? amount : 1;
      },
      reset: function() {
        var total = count;
        count = 0;
        return total;
      }
    };
  })(),

  //----------------------------------------------------------------------------
  // testPropertiesSet()
  //    Test an object's set() method for each of its properties.
  //
  // settings (Object): An object with the following properties:
  //
  //    Required property:
  //
  //      testObject (Object): An object to set-test that is asserted to have
  //        all(), get(), and set() methods.
  //
  //    Optional properties:
  //
  //      blacklist (Array): A list of properties to avoid set-testing. These
  //        are typically cases that will do very bad things, like crash the
  //        client or destroy the unit test.
  //
  //      readOnly (Array): A list of known read-only properties that are
  //        asserted to be non-settable.
  //
  testPropertiesSet: function(settings) {
    var testValue,
      messages = {
        set:   undefined,
        reset: undefined
      },
      defaults = {
        testObject: {
          all: function() { return {};   },
          get: function() { return null; },
          set: function() {}
        },
        blacklist: [],
        readOnly:  []
      };

    // Set defaults where settings are unspecified.
    settings = settings || defaults;
    settings.blacklist = settings.blacklist || [];
    settings.readOnly  = settings.readOnly  || [];

    // Ensure that settings.testObject has the expected methods.
    _.each(['all', 'get', 'set'], function(method, index) {
      var fn;
      try { fn = settings.testObject[method]; } catch(e) { fn = {}; }
      utils.testFunction({
        fn:   fn,
        name: method,
        argc: index
      });
    });

    // Set testvalue and assert messages according to datatype.
    var testDatum = {
      'boolean': function(key, value) {
        testValue = !value;
        messages.set =
          sprintf('set() can set %s to %s.', key, (testValue).toString());
        messages.reset =
          sprintf('set() can set %s back to %s.', key, (value).toString());
      },

      'number': function(key, value) {
        testValue = 1 === value ? 0 : 1;
        messages.set = sprintf('set() can set %s to %d.', key, testValue);
        messages.reset = sprintf('set() can set %s back to %f.', key, value);
      },

      'string': function(key, value) {
        testValue = "x";
        messages.set = sprintf('set() can set %s to "%s".', key, testValue);
        messages.reset = sprintf('set() can set %s back to "%s".', key, value);
      }
    };

    // Check whether a value has been blacklisted
    var isBlacklisted = function(value) {
      return -1 < _.indexOf(settings.blacklist, value);
    }

    // Check whether a value has been specified as read-only
    var isReadOnly = function(value) {
      return -1 < _.indexOf(settings.readOnly, value);
    }

    _.each(settings.testObject.all(), function(value, key) {

      equals(settings.testObject.get(key), value, sprintf('get() correctly ' +
        'matches value provided by all() for %s', key));

      ok(-1 !== _.indexOf(_.keys(testDatum), typeof(value)),
        sprintf('setting %s is an expected datatype.', key))

      utils.assertionCounter.increment(2);

      if (! isBlacklisted(key)) {

        testDatum[typeof value](key, value);
        _.each(messages, function(message, index) {
          messages[index] = 'testPropertiesSet: ' + message;
        });

        if (! isReadOnly(key)) {

          // Set testValue.
          try {
            settings.testObject.set(key, testValue);
            equals(settings.testObject.get(key), testValue, messages.set);
          }
          catch(error) {
            ok(false, sprintf('%s %s', messages.set, error.message));
          }

          // Reset value.
          try {
            settings.testObject.set(key, value);
            equals(settings.testObject.get(key), value, messages.reset);
          }
          catch(error) {
            ok(false, sprintf('%s %s', messages.reset, error.message));
          }

          utils.assertionCounter.increment(2);

        } else {

          try {
            settings.testObject.set(key, testValue);
            if (settings.testObject.get(key) === testValue)
              ok(false, sprintf('Successfully set read-only property %s', key));
          }
          catch(error) {
            ok(true, sprintf('Could not set read-only property %s: %s', key,
              error.message));
          }

          utils.assertionCounter.increment();
        }
      }
    });
  },

  //----------------------------------------------------------------------------
  // testFunction()
  //    Generic test for any function or method.
  //
  // Parameter (Object): an object with the following properties:
  //
  //    Required property:
  //
  //      fn (Function): Object asserted to be a function.
  //
  //    Optional properties:
  //
  //      name (String): The specified function's name. If not specified, this
  //        defaults to the function's name if available or else its toString()
  //        value. IE does not provide a name property for functions.
  //
  //      argc (Number): The expected argument count for the specified
  //        function. Defaults to 0.
  //
  testFunction: function() {
    var argument = arguments[0] || {},
      fn = argument.fn,
      name = argument.name || fn.name || fn.toString(),
      argc = argument.argc || 0,
      isFunction = "function" === typeof fn,
      arg = 1 === argc ? "argument" : "arguments";
    ok(isFunction, sprintf('testFunction: %s() is a function.', name));
    if (isFunction) {
      ok(argc === fn.length,
        sprintf('testFunction: %s() expects %d %s.', name, argc, arg));
    }
    else {
      ok(false,
        sprintf('testFunction: Can test argc on nonfunction %s.', name));
    }
    utils.assertionCounter.increment(2);
  },

  //----------------------------------------------------------------------------
  // testKeysAgainstAllKeys()
  //    Take an object that has both all() and keys() methods, and check the
  //    values returned by keys() against those used in all().
  //
  // Parameter:
  //    object (Object): Object asserted to have corresponding all() and keys()
  //      methods.
  //
  testKeysAgainstAllKeys: function(object) {
    _.each(['all', 'keys'], function(method) {
      utils.testFunction({
        fn: object[method],
        name: method,
        argc: 0
      });
    });
    same(_.keys(object.all()), object.keys(),
      'testKeysAgainstAllKeys: keys() matches keys in all()');
    utils.assertionCounter.increment();
  },

  //----------------------------------------------------------------------------
  // testProperties()
  //    Generic test for any set of properties
  //
  // Parameter: settings (Object): an object with the following properties:
  //
  //    object (Object): An object asserted to have the specified properties.
  //    properties (Array): A list of properties to test.
  //    name (String): Name of the object to report.
  //
  testProperties: function(settings) {
    var settings   = settings            || {};
    var object     = settings.object     || {};
    var properties = settings.properties || [];
    var name       = settings.name       || object.name;
    _.each(properties, function(property) {
      ok('undefined' !== typeof object[property],
        sprintf('testProperties: %s has property "%s"', name, property));
    });
    utils.assertionCounter.increment(properties.length);
  }

};
