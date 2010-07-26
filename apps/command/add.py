#
# Copyright (c) 2010 BitTorrent Inc.
#

import apps.command.base
import logging
import sys

class add(apps.command.base.Command):

    user_options = [ ('file=', 'f', 'file to add', None) ]
    post_commands = [ 'generate' ]
    help = 'Add an external dependency to the project.'

    def run(self):
        if self.options.has_key('file'):
          self.add(self.options['file'])
        else:
          logging.error('ERROR: Nothing to add. '
            'Specify a file to add using the --file flag.')
          sys.exit(1)
