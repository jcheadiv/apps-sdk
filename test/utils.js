var utils = {
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
  // testProperties()
  //
  testProperties: function(testobject, bl, ro){
      var testValue, messages = { set: undefined, reset: undefined };

      // Do not test set() on blacklisted properties.
      var setBlacklist = bl || [];

      // Test that read-only properties are not settable and throw the right error
      var readOnly = ro || [];

      _.each(testobject.all(), function(value, key) {

        equals(testobject.get(key), value, sprintf('get() correctly ' +
          'matches value provided by all() for %s', key));

        ok(-1 !== _.indexOf(['boolean','number','string'], typeof(value)),
          sprintf('setting %s is an expected datatype.', key))

        utils.assertionCounter.increment(2);

        if (-1 === _.indexOf(setBlacklist, key)) {

          // Set testvalue and assert messages according to datatype.
          switch(typeof(value)) {

            case 'boolean':
              testValue = !value;
              messages.set =
                sprintf('set() can set %s to %s.', key, (testValue).toString());
              messages.reset =
                sprintf('set() can set %s back to %s.', key, (value).toString());
              break;

            case 'number':
              testValue = 1 === value ? 0 : 1;
              messages.set = sprintf('set() can set %s to %d.', key, testValue);
              messages.reset = sprintf('set() can set %s back to %f.', key, value);
              break;

            case 'string':
              testValue = "x";
              messages.set = sprintf('set() can set %s to "%s".', key, testValue);
              messages.reset = sprintf('set() can set %s back to "%s".', key, value);
              break;
          }

          if (-1 === _.indexOf(readOnly, key)) {

            // Set testValue.
            try {
              testobject.set(key, testValue);
              equals(testobject.get(key), testValue, messages.set);
            }
            catch(error) {
              ok(false, sprintf('%s %s', messages.set, error.message));
            }

            // Reset value.
            try {
              testobject.set(key, value);
              equals(testobject.get(key), value, messages.reset);
            }
            catch(error) {
              ok(false, sprintf('%s %s', messages.reset, error.message));
            }

            utils.assertionCounter.increment(2);

          } else {

            try {
              testobject.set(key, testValue);
              if(testobject.get(key) == testValue)
                ok(false, sprintf('Successfully set read-only property %s', key));
            }
            catch(error) {
              ok(true, sprintf('Could not set read-only property %s: %s', key, error.message));
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
  // Parameter: an object with the following properties:
  //
  //    Required property:
  //
  //      fn (Object): Object asserted to be a function.
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
  }

};
