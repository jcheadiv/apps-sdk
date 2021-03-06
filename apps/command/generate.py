#
# Copyright (c) 2010 BitTorrent Inc.
#

import json
import logging
import mako.template
import os
import pkg_resources
import re
import scss
import shlex
import subprocess
import urlparse

import apps.command.base

# Exception classes used by this module.
class CalledProcessError(subprocess.CalledProcessError):
    """This exception is raised when a process run by check_call() returns
    a non-zero exit status.  The exit status will be stored in the
    returncode attribute."""
    def __init__(self, returncode=None, cmd=None, output=None):
        self.returncode = returncode
        self.cmd = cmd
        self.output = output
    def __str__(self):
        return "Command '%s' returned non-zero exit status %d\n\n%s" % (
            self.cmd, self.returncode, self.output)

# Cut and paste from python2.7 because I don't want to upgrade.
def check_output(*popenargs, **kwargs):
    """Run command with arguments and return its output as a byte string.

    If the exit code was non-zero it raises a CalledProcessError.  The
    CalledProcessError object will have the return code in the returncode
    attribute and output in the output attribute.

    The arguments are the same as for the Popen constructor.  Example:

    >>> check_output(["ls", "-l", "/dev/null"])
    'crw-rw-rw- 1 root root 1, 3 Oct 18  2007 /dev/null\n'

    The stdout argument is not allowed as it is used internally.
    To capture standard error in the result, use stderr=subprocess.STDOUT.

    >>> check_output(["/bin/sh", "-c",
                      "ls -l non_existant_file ; exit 0"],
                     stderr=subprocess.STDOUT)
    'ls: non_existant_file: No such file or directory\n'
    """
    if 'stdout' in kwargs:
        raise ValueError('stdout argument not allowed, it will be overridden.')
    process = subprocess.Popen(*popenargs, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, **kwargs)
    output, unused_err = process.communicate()
    retcode = process.poll()
    if retcode:
        cmd = kwargs.get("args")
        if cmd is None:
            cmd = popenargs[0]
        raise CalledProcessError(retcode, cmd, output=output)
    return output

class generate(apps.command.base.Command):

    help = 'Generate `index.html` for the project.'
    user_options = [
        ('update=', None, 'Auto-update url to use in package.json', None),
        ('local', 'l', 'Use a local auto-update url.', None),
        ('host=', None, 'Host to use for local. Defaults to localhost', None),
        ('falcon', None, 'Build app for falcon (scripts load dynamically)',
         None),
        ('compileresources', None,
         'Template files are compiled into resources.js ' \
             '(intended for use with falcon)',
         None),
        ('compile', None, 'Compile/minify the javascript', None),
        ('remote', None, 'Use a remote utorrent client for all api calls.',
         None),
        ('config=', None, 'Configuration to use', None),
        ]
    excludes = [ os.path.join('packages', 'firebug-lite.js'),
                 os.path.join('packages', 'firebug.js'),
                 os.path.join('lib', 'index.js') ]
    template = 'index.html'

    def run(self):
        update_json = True
        self.falcon = self.options.get('falcon')
        self.compileresources = self.options.get('compileresources')

        if self.options.get('update', False):
            self.project.metadata['bt:update_url'] = self.options['update']
            update_json = False

        if self.options.get('local', False):
            # XXX - This should dynamically pick up the port from serve
            host = self.options.get('host', 'localhost:8080')
            self.project.metadata['bt:update_url'] = 'http://%s/%s' % (
                host, self._output_file().replace('\\', '/'))
            update_json = False
        self.write_metadata(update_json)

        # There's no reason to check packages into an SCM. This makes the
        # initial checkout a little painful, fix that pain by just pulling
        # everything down if the directory doesn't exist.
        if not os.path.exists('packages/'):
            self.update_deps()
        if self.project.metadata.get('bt:package', False):
            return

        # pre-compile the scss sheets.
        self._generate_scss()

        logging.info('\tcreating index.html')
        # Remove the ./ from the beginning of these paths for use in filter
        self.flist = [x[2:] for x in self.file_list()]

        template = mako.template.Template(
            filename=pkg_resources.resource_filename(
                'apps.data', self.template), cache_enabled=False)
        if not os.path.exists(os.path.join(self.project.path, 'build')):
            os.mkdir(os.path.join(self.project.path, 'build'))
        index = open(os.path.join(self.project.path, 'build', 'index.html'),
                     'wb')
        tmpl_vals = self._template()
        tmpl_vals['json'] = json
        if self.options.get('compile', False):
            self.compile(tmpl_vals)
            self.project.compiled = True
        index.write(template.render(**tmpl_vals))
        index.close()

    def _template(self):
        return {
            'scripts': json.dumps(self._scripts_list(self.project.metadata)) \
                if self.falcon else self._scripts_list(self.project.metadata),
            'styles': self._styles_list(),
            'title': self.project.metadata['name'],
            'debug': self.vanguard.options.debug,
            'falcon': self.falcon,
            'firebug': self.vanguard.options.firebug,
            'resources': json.dumps(self._resources(), indent=2,
                                    sort_keys=True) \
                if self.compileresources else None,
            'remote': self.options.get('remote', False),
            'body': open('html/main.html').read() if os.path.exists('html/main.html') else ''
            }

    def _styles_list(self):
        styles = []
        for lib in self.project.metadata.get('bt:libs', []):
            # XXX - This isn't going to handle being run anywhere else.
            path = os.path.join('packages', lib['name'], 'css')
            if os.path.exists(path) and not "disable-css" in lib:
                pkg_styles = self._dir_styles(path)
                scss_path = os.path.join('build', path)
                if os.path.exists(scss_path):
                    pkg_styles += self._dir_styles(os.path.join('build', path),
                                                   path)
                styles += sorted(pkg_styles)

        # XXX - This isn't going to handle being run anywhere but in the root
        # dir.
        path = 'css'

        local_styles = []
        if os.path.exists(path):
            local_styles += self._dir_styles(path)

        local_styles += self._dir_styles('build/css')

        local_styles.sort()
        styles += local_styles
        return styles

    def filter(self, existing, lst):
        return filter(lambda x: not x in existing and not x in self.excludes \
                          and x in self.flist,
                      lst)

    def _resources(self):
        resources = { 'package.json': open(os.path.join(
                    self.project.path, 'package.json')).read() }
        for root, dirs, files in os.walk(os.path.join(self.project.path,
                                                      'html')):
            for name in files:
                if name.endswith('.html'):
                    parts = root.split(os.sep)
                    key = os.path.join( '/'.join(parts[parts.index('html'):]),
                                        name)
                    filepath = os.path.join(root,name)
                    resources[ key ] = open(filepath).read()

        return resources

    def _scripts_list(self, metadata):
        handlers = { '.js': self._list_lib,
                     '.pkg': self._list_pkg,
                     '.git': self._list_pkg,
                     '': self._list_pkg
                     }
        scripts = []

        # Config gets included first.
        if os.path.exists('config'):
            path = os.path.join('config', '%s.js' % (
                    self.options.get('config', 'default'),))
            if os.path.exists(path):
                scripts.append(path)

        for lib in metadata.get('bt:libs', []):
            ext = os.path.splitext(urlparse.urlsplit(lib['url']).path)[-1]
            scripts += self.filter(scripts,
                [x.replace('/', os.path.sep) for x in
                 handlers[ext](lib)])
        if metadata == self.project.metadata:
            scripts += self.filter(scripts,
                [os.path.join('lib', x) for x in
                 sorted(filter(lambda x: os.path.splitext(x)[1] == '.js',
                        os.listdir(os.path.join(self.project.path, 'lib'))))])
            scripts.append(os.path.join('lib', 'index.js'))
        scripts = [x.replace('\\', '/') for x in scripts]

        return scripts

    def _list_lib(self, lib):
        name = os.path.split(urlparse.urlsplit(lib['url']).path)[-1]
        return [os.path.join('packages', name)]

    def _list_pkg(self, pkg):
        pkg_scripts = self._scripts_list(
            json.load(open(os.path.join(self.project.path,
                                        'packages', pkg['name'],
                                        'package.json'))))
        pkg_scripts += sorted([
            os.path.join('packages', pkg['name'], 'lib', x) for x in
            filter(lambda x: x != 'package.json', os.listdir(os.path.join(
                        self.project.path, 'packages',
                        pkg['name'], 'lib')))])
        return pkg_scripts

    def _dir_styles(self, basedir, subdir=None):
        if not subdir:
            subdir = basedir

        styles = []
        for base, dirs, files in os.walk(basedir):
            files = [x for x in files if os.path.splitext(x)[1] == '.css']
            for f in files:
                pth = re.sub('^build', '',
                             os.path.join(base, f).replace(
                        '\\', '/'))
                if pth[0] == '/': pth = pth[1:]
                styles.append((pth, self._media_query(
                            os.path.join(base, f))))
        return styles

    def _media_query(self, fpath):
        css_content = open(fpath, 'rb').read()
        result = re.search('@media (.*?)\s*\{', css_content)
        if result:
            return result.group(1)
        return None

    def _generate_scss(self):
        generator = scss.Scss()

        for base, dirs, files in os.walk('.', followlinks=True):
            files = [x for x in files
                     if os.path.splitext(x)[1] == '.scss' and not x[0] == '_']
            for f in files:
                compiled = generator.compile(
                    open(os.path.join(base, f), 'rb').read())
                # Try and create the build dirs, ignore if they're already
                # there.
                try:
                    os.makedirs(os.path.join('build', base))
                except:
                    pass
                dest = os.path.splitext(f)[0] + '.css'
                open(os.path.join('build', base, dest), 'wb').write(compiled)

    def compile(self, vals):
        command = shlex.split('java -jar compiler/compiler.jar ' \
                                  '--js_output_file build/compiled.cjs')
        for fname in vals['scripts']:
            command += ['--js', fname]
        logging.info('\tcompiling and compressing javascript')
        check_output(command)
        vals['scripts'] = ['compiled.cjs']
