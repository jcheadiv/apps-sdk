#
# Copyright (c) 2010 BitTorrent Inc.
#

import apps.command.base
import logging
import sys

class add(apps.command.base.Command):

    user_options = [ ('file=', 'f', 'file to add', None),
                     ('develop', 'd', 'Symlink local project', None)
                     ]
    post_commands = [ 'generate' ]
    help = 'Add an external dependency to the project.'

    def run(self):
        if not(self.options.has_key('file')):
          logging.error('ERROR: Nothing to add. '
            'Specify a file to add using the --file flag.')
          sys.exit(1)

        self.add(self.options['file'].rsplit('/', 1)[-1],
                 self.options['file'], develop=self.options.has_key('develop'))
