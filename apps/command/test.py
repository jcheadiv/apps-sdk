#
# Copyright (c) 2011 BitTorrent Inc.
#

import json
import logging
import mako.template
import os
import pkg_resources
import urlparse

import apps.command.generate

class test(apps.command.generate.generate):

    help = 'Run the steps needed to do testing on an app'
    template = 'test.html'

    def _template(self):
        opts = apps.command.generate.generate._template(self)
        opts.update({
                'tests': [os.path.join('test', x) for x in
                          sorted(filter(
                            lambda x: os.path.splitext(x)[1] == '.js',
                            os.listdir(os.path.join(
                                    self.project.path, 'test'))))]
                })
        return opts
