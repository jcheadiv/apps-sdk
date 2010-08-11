var utils = {
  testProperties: function(testobject, bl, ro){
      var testValue, messages = { set: undefined, reset: undefined };

      // Do not test set() on blacklisted properties.
      var setBlacklist = bl || [];

      // Test that read-only properties are not settable and throw the right error
      var readOnly = ro || [];

      _.each(testobject.all(), function(value, key) {

        equals(testobject.get(key), value, sprintf('get() correctly ' +
          'matches value provided by all() for %s.', key));

        ok(-1 !== _.indexOf(['boolean','number','string'], typeof(value)),
          sprintf('setting %s is an expected datatype.', key))

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
              messages.set = sprintf('set() can set %s to %s.', key, testValue);
              messages.reset = sprintf('set() can set %s back to %s.', key, value);
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

          } else {

            try {
              testobject.set(key, testValue);
              if(testobject.get(key) == testValue)
                ok(false, sprintf('Successfully set read-only property %s', key));
            }
            catch(error) {
              ok(true, sprintf('Could not set read-only property %s: %s', key, error.message));
            }

          }

        }
      });
  }
};