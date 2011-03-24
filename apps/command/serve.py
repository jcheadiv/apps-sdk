#
# Copyright (c) 2010 BitTorrent Inc.
#

import logging
import mimetypes
import os
import pkg_resources
import posixpath
import tornado.httpserver
import tornado.options
from tornado.options import define, options
import tornado.web

import apps.command.base
import apps.vanguard

class FileHandler(tornado.web.RequestHandler):

    def build_path(self):
        pth = self.request.path[1:]
        if os.path.exists(os.path.join(options.root, 'build', pth)):
            pth = os.path.join('build', pth)
        pth = os.path.join(options.root, pth)
        return pth

    def get(self):
        fs_pth = self.build_path()
        if not os.path.exists(fs_pth):
            raise tornado.web.HTTPError(404)

        self.set_header("Content-Type", self.guess_type(fs_pth))
        self.write(open(fs_pth).read())

    # Cut and paste from simplehttpserver
    def guess_type(self, path):
        base, ext = posixpath.splitext(path)
        if ext in self.extensions_map:
            return self.extensions_map[ext]
        ext = ext.lower()
        if ext in self.extensions_map:
            return self.extensions_map[ext]
        else:
            return self.extensions_map['']

    if not mimetypes.inited:
        mimetypes.init() # try to read system mime.types
    extensions_map = mimetypes.types_map.copy()
    extensions_map.update({
        '': 'application/octet-stream', # Default
        '.py': 'text/plain',
        '.c': 'text/plain',
        '.h': 'text/plain',
        })

class serve(apps.command.base.Command):

    help = 'Run a development server to debug the project.'
    user_options = [ ('port=', 'p', 'Port to listen on.', None) ]
    option_defaults = { 'port': '8080' }
    pre_commands = [ 'generate|test' ]

    def setup_config(self):
        define('debug', default=False, type=bool,
               help='Start the server in debug mode')
        define('root', default=self.project.path)

    def run(self):
        logging.info('\tStarting server. Access it at http://localhost:%s/' %
                (self.options['port'],))

        self.setup_config()
        tornado.options.parse_config_file(pkg_resources.resource_filename(
                'apps.data', 'serve.conf'))

        logging.getLogger().handlers = []
        tornado.options.enable_pretty_logging()
        logging.getLogger().setLevel(logging.INFO)

        application = tornado.web.Application([
                (r"/.*", FileHandler),
                ], **{ "debug": options.debug })
        http_server = tornado.httpserver.HTTPServer(application)
        http_server.listen(int(self.options['port']))
        tornado.ioloop.IOLoop.instance().start()
