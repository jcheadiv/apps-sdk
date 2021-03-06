#!/usr/bin/env python
#
# Copyright (c) 2010 BitTorrent Inc.
#

"""
Full fledged build tool for Griffin applications.
"""

__author__ = 'Thomas Rampelberg'
__author_email__ = 'thomas@bittorrent.com'
__date__ = "%date%"
__version__ = "%version%"

from setuptools import setup, find_packages

setup(
    name = "apps-sdk",
    version = '0.5',
    packages = find_packages(),
    author = __author__,
    author_email = __author_email__,
    description = "Build tool to develop, build and package apps.",
    install_requires = [ 'mako', 'boto', 'pydns', 'httplib2', 'bencode',
                         'pyScss', 'PIL', 'GitPython', 'tornado', 'tornadio', ],
    include_package_data = True,
    package_data = {
        "": ['data/*', 'data/.*'],
        },
    entry_points = {
        'console_scripts': [
            'apps = apps.vanguard:run',
            ],
        }
    )
