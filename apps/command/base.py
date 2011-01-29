#
# Copyright (c) 2010 BitTorrent Inc.
#

import fnmatch
import json
import logging
import os
import pkg_resources
import re
import shutil
import tempfile
import urllib2
import urlparse
import zipfile
import sys

import apps.project

class Command(object):
    help = 'Uninteresting command.'
    user_options = []
    option_defaults = {}
    pre_commands = []
    post_commands = []
    # Most of the 'bt:' namespace goes into the btapp file. There are a couple
    # in that namespace that are used by commands which don't belong.
    btapp_excludes = ['libs']

    def __init__(self, vanguard):
        reload(sys)
        sys.setdefaultencoding('utf-8')

        self.vanguard = vanguard
        self.options = self.vanguard.command_options.get(
            self.__class__.__name__, {})
        for k,v in self.option_defaults.iteritems():
            if not self.options.get(k, None):
                self.options[k] = v
        self.project = vanguard.project
        # Keeps track of which dependencies have been added, if one has already
        # been added (via name), don't add it again.
        self.added = []

    def file_list(self):
        ignore = [os.path.join(self.project.path, x) for x in
                  self.project.ignore]

        def _filter(fname):
            for pat in ignore:
                if fnmatch.fnmatch(fname, pat):
                    return False
            return True

        file_list = []
        for p, dirs, files in os.walk(self.project.path, followlinks=True):
            for f in filter(_filter, [os.path.join(p, x) for x in files]):
                file_list.append(f)
        return file_list

    def run(self):
        logging.error('This command has not been implemented yet.')

    def update_libs(self, name, url, develop=False):
        if not name in [x['name'] for x in
                        self.project.metadata.get('bt:libs', [])]:
            self.project.metadata['bt:libs'].append(
                { "name": name, "url": url, "develop": develop})
        if not os.path.exists('package.json') or \
                self.project.metadata != json.load(open('package.json')):
            self.write_metadata()

    def write_metadata(self, refresh=True):
        logging.info('\tupdating project metadata')
        # Allow the optional overloading of certain values in package.json
        # without saving them (and write them to btapp).
        if refresh and (not os.path.exists('package.json') or \
                            self.project.metadata != json.load(
                open('package.json'))):
          json.dump(self.project.metadata,
                    open(os.path.join(self.project.path, 'package.json'), 'wb'),
                    indent=4)
        # Don't bother with btapp/index.html for packages
        if self.project.metadata.get('bt:package', False):
            return
        keys = [ 'name', 'version' ] + filter(
            lambda x: x[:3] == 'bt:' and not x[3:] in self.btapp_excludes,
            self.project.metadata.keys())
        try:
            os.makedirs(os.path.join(self.project.path, 'build'))
        except OSError:
            pass
        btapp = open(os.path.join(self.project.path, 'build', 'btapp'), 'wb')
        for i in keys:
            btapp.write('%s:%s\n' % (i.split(':')[-1],
                                     self.project.metadata[i]))
        btapp.close()

    def update_deps(self):
        logging.info('\tupdating project dependencies')
        pkg_dir = os.path.join(self.project.path, 'packages')
        try:
            shutil.rmtree(pkg_dir)
        except OSError:
            pass
        os.makedirs(pkg_dir)
        for pkg in self.project.metadata.get('bt:libs', []):
            self.add(pkg['name'], pkg['url'], develop=pkg.get('develop', False))

    def add(self, name, url, update=True, develop=False):
        if name in self.added:
            return
        self.added.append(name)
        handlers = { '.js': self._add_javascript,
                     '.pkg': self._add_pkg,
                     '': self._add_pkg
                     }
        url_handlers = { 'file': self._get_file,
                         }
        if develop:
            fname = url
        else:
            fobj = tempfile.NamedTemporaryFile('wb', delete=False)
            fname = fobj.name
            try:
                logging.info('\tfetching %s ...' % (url,))
                protocol = url.split('://', 1)[0]
                handler = url_handlers.get(protocol, self._get_url)
                fobj.write(handler(url))
                fobj.close()
            except urllib2.HTTPError:
                print 'The file at <%s> is missing.' % (url,)
                sys.exit(1)
            except urllib2.URLError, e:
                logging.error(e.reason)
                sys.exit(1)

        ext = os.path.splitext(urlparse.urlsplit(url).path)[-1]
        if not(handlers.has_key(ext)):
          logging.error('ERROR: Unsupported file type: %s' % (ext,))
          sys.exit(1)
        name = handlers[ext](fname,
                             os.path.split(urlparse.urlsplit(url).path)[-1],
                             develop)
        if not develop: os.remove(fname)
        if update:
            self.update_libs(name, url, develop)

    def _get_file(self, url):
        url = url.split('://', 1)[1]
        return open(os.path.realpath(url), 'rb').read()

    def _get_url(self, url):
        return urllib2.urlopen(url).read()

    def already_exists(self, name):
        logging.warn('%s already exists. You\'re probably adding ' \
                             'something that\'s already been included. ' \
                             'Just igoring.' % name)

    def _add_javascript(self, source, fname, develop=False):
        dest = os.path.join(self.project.path, 'packages', fname)
        # For anything that's already been added, warn the user and ignore.
        if os.path.exists(dest):
            self.already_exists(fname)
            return os.path.splitext(fname)[0]
        if develop:
            os.symlink(source, dest)
        else:
            shutil.copy(source, dest)
        return os.path.splitext(fname)[0]

    def _add_pkg(self, source, fname, develop=False):
        if develop:
            pkg_manifest = json.loads(
                open(os.path.join(source, 'package.json')).read())
        else:
            pkg = zipfile.ZipFile(source)
            pkg_manifest = json.loads(pkg.read('package.json'))
        pkg_root = os.path.join(self.project.path, 'packages',
                                pkg_manifest['name'])
        # For anything that's already been added, warn the user and ignore.
        if os.path.exists(pkg_root):
            self.already_exists(pkg_manifest['name'])
            return pkg_manifest['name']

        elif develop:
            os.symlink(source, pkg_root)
        else:
            tmpdir = tempfile.mkdtemp(dir=os.path.join(self.project.path,
                                                       'packages'))
            # Move over the package specific files
            pkg.extractall(tmpdir)
            # This is because I'm lazy ....
            shutil.rmtree(pkg_root, True)
            shutil.copytree(tmpdir, pkg_root,
                            ignore=shutil.ignore_patterns('packages*'))
            shutil.rmtree(tmpdir)
        # Handle the dependencies specifically
        logging.info('\tfetching %s dependencies ...' % (pkg_manifest['name'],))
        for pkg in pkg_manifest.get('bt:libs', []):
            self.add(pkg['name'], pkg['url'], False,
                     develop=pkg.get('develop', False))
        return pkg_manifest['name']

    def _output_file(self, path='dist'):
        extension = 'pkg' if self.project.metadata.get(
            'bt:package', False) else 'btapp'
        return os.path.join(path, '%s.%s' % (
                    self.project.metadata['name'], extension))
