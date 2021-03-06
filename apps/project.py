#
# Copyright (c) 2010 BitTorrent Inc.
#

"""
An apps sdk project.
"""

import json
import os
import pkg_resources
import shutil

class Project(object):

    default_metadata =  {
        'name': '',
        'version': '0.1',
        'description': 'The default project.',
        'site': 'http://apps.bittorrent.com',
        'author': 'Default Author <default@example.com>',
        'keywords': [ 'example' ],
        'bt:publisher': 'Example Publisher',
        'bt:update_url': "http://localhost/example",
        'bt:release_date': '00/00/0000',
        'bt:description': 'This is the example app.',
        'bt:libs': [
            { 'name': 'apps-sdk',
              'url': 'http://staging.apps.bittorrent.com/pkgs/apps-sdk.pkg' }
            ],
        'bt:store': {
            'screenshots': [
                { "small": "example_small.png",
                  "large": "example_large.png",
                  "title": "Example title"
                  }
                ],
            "description": "Example store description",
            "links": [
                { "href": "http://btapps-sdk.bittorrent.com",
                  "name": "SDK"
                  }
                ],
            "ie_version": 1
            }
        }

    def __init__(self, path):
        self.path = path
        self.read_metadata()
        if not os.path.exists(os.path.join(self.path, '.ignore')):
            shutil.copy(pkg_resources.resource_filename('apps.data', '.ignore'),
                        os.path.join(self.path, '.ignore'))
        self.ignore = open(os.path.join(self.path, '.ignore')
                           ).read().split('\n')

    def read_metadata(self):
        try:
            self.metadata = json.load(open(os.path.join(self.path,
                                                        'package.json'), 'r'))
        except IOError, err:
            self.metadata = self.default_metadata
            self.metadata['name'] = self.path
