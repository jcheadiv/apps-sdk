#
# Copyright (c) 2010 BitTorrent Inc.
#

import httplib2
import logging
import os

import apps.command.base

class submit(apps.command.base.Command):

    user_options = [ ('url=', None, 'URL to submit to', None) ]
    pre_commands = [ 'package' ]
    option_defaults = { 'url': 'http://10.20.30.79:5000/submit' }
    help = 'Submit a package or app for inclusion in the app store.'

    def run(self):
        http = httplib2.Http()
        btapp = open(os.path.join('dist', '%s.btapp' % (
                    self.project.metadata['name'],)), 'rb').read()
        try:
            resp, content = http.request(self.options.get('url'), 'POST',
                                         btapp)
        except AttributeError:
            logging.error('The remote server is down. Please try again later.')
            return
        logging.info('%s\n%s' % (resp, content))
