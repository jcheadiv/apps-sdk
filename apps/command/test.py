#
# Copyright (c) 2011 BitTorrent Inc.
#

import logging
import os

import apps.command.generate

class test(apps.command.generate.generate):

    help = 'Run the steps needed to do testing on an app'
    template = 'test.html'

    def __init__(self, *args, **kwargs):
        apps.command.generate.generate.__init__(self, *args, **kwargs)
        self.project.ignore.remove('test/*')

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
