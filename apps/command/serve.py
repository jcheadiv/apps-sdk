#
# Copyright (c) 2010 BitTorrent Inc.
#

import bencode
import cookielib
import functools
import hashlib
import json
import logging
import mimetypes
import os
import pkg_resources
import posixpath
try:
    import cStringIO as StringIO
except ImportError:
    import StringIO
import tempfile
import time
import tornado.httpclient
import tornado.httpserver
import tornado.options
from tornado.options import define, options
import tornado.simple_httpclient
import tornado.web
import urllib
import zipfile

import apps.command.base
import apps.vanguard

class HTTPRequest(tornado.httpclient.HTTPRequest):

    # This isn't hard coded by default ...
    max_redirects = 5

    def get_full_url(self):
        return self.url

    def is_unverifiable(self):
        return not HTTPRequest.max_redirects == self.max_redirects

    def has_header(self, header):
        return header in self.headers

    def add_unredirected_header(self, header, value):
        self.headers.add(header, value)

class HTTPResponse(tornado.httpclient.HTTPResponse):

    def info(self):
        return self

    def getheaders(self, header):
        return self.headers.get_list(header)

tornado.simple_httpclient.HTTPResponse = HTTPResponse

class FileHandler(tornado.web.RequestHandler):

    def build_path(self):
        pth = self.request.path[1:]
        if os.path.exists(os.path.join(options.root, 'build', pth)):
            pth = os.path.join('build', pth)
        pth = os.path.join(options.root, pth)
        return pth

    def get(self):
        if self.request.path == '/':
            self.request.path = '/index.html'
        fs_pth = self.build_path()
        if not os.path.exists(fs_pth) or os.path.isdir(fs_pth):
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
        '.json': 'application/json'
        })

class ProxyHandler(tornado.web.RequestHandler):

    remove = {
        'response': [ 'Transfer-Encoding', 'Status', 'Content-Encoding',
                      'Content-Location', 'Connection', 'Host' ],
        'request': [ 'Host', 'Cookie', 'X-Location', ],
        }
    content_type = {
        'application/x-bittorrent': 'torrent',
        'default': 'default'
        }
    file_type = {
        '.btapp': 'btapp'
        }

    def __init__(self, *args, **kwargs):
        tornado.web.RequestHandler.__init__(self, *args, **kwargs)
        self.cookie = self.application.settings.get('cookie')

    def alter_headers(self, headers, direction, set_method):
        for h,v in headers.iteritems():
            if h in self.remove[direction]: continue
            set_method(h, v)

    @tornado.web.asynchronous
    def get(self):
        loc = self.request.headers.get('x-location', None)
        if not loc:
            raise tornado.web.HTTPError(404)

        logging.info('PROXY ' + loc)
        client = tornado.simple_httpclient.SimpleAsyncHTTPClient()
        req = HTTPRequest(loc, method=self.request.method)
        self.alter_headers(self.request.headers, 'request', req.headers.add)

        if self.request.body:
            req.body = self.request.body

        self.cookie.add_cookie_header(req)
        client.fetch(req, functools.partial(self.handle_response, req))

    def handle_response(self, req, resp):
        self.cookie.extract_cookies(resp, req)
        self.cookie.save()
        self.alter_headers(resp.headers, 'response', self.set_header)

        self.set_status(resp.code)

        getattr(self, 'content_' + self.content_type.get(resp.headers.get(
                    'content-type'), ''), lambda x: x)(resp)

        getattr(self, 'file_' + self.file_type.get(
                os.path.splitext(urllib.splitquery(
                        resp.effective_url)[0])[-1], ''), lambda x: x)(resp)

        self.write(resp.body)
        self.finish()

    def content_torrent(self, resp):
        torrent = bencode.bdecode(resp.body)
        torrent['info']['pieces'] = ''
        resp._body = json.dumps(torrent)
        self.set_header('Content-Type', 'application/json')
        self.set_header('Content-Length', len(resp.body))

    def file_btapp(self, resp):
        root = os.path.join(options.root, 'tmp')
        if not os.path.exists(root):
            os.makedirs(root)

        zobj = zipfile.ZipFile(StringIO.StringIO(resp.body))
        pkg = json.loads(zobj.read('package.json'))
        dir_name = hashlib.sha1(pkg['bt:update_url']).hexdigest().upper()
        pkg['bt:id'] = dir_name

        zobj.extractall(os.path.join(root, dir_name))
        resp._body = json.dumps(pkg)

        self.set_header('Content-Type', 'application/json')
        self.set_header('Content-Length', len(resp.body))

    post = get

class serve(apps.command.base.Command):

    help = 'Run a development server to debug the project.'
    user_options = [ ('port=', 'p', 'Port to listen on.', None) ]
    option_defaults = { 'port': '8080' }
    pre_commands = [ 'generate|test' ]

    def setup_config(self):
        define('debug', default=False, type=bool,
               help='Start the server in debug mode')
        define('root', default=self.project.path)
        # Cookies get saved in the dist/ directory (as it never gets packaged
        # up).
        define('cookie_path', default=os.path.join(self.project.path, 'dist',
                                                   'cookies.txt'))

    def setup_cookie(self):
        cookie = cookielib.MozillaCookieJar(
            filename=options.cookie_path)
        if not os.path.exists(options.cookie_path):
            cookie.save()

        cookie.load()
        return cookie

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
                (r"/proxy", ProxyHandler),
                (r"/.*", FileHandler),
                ], **{ "debug": options.debug,
                       "cookie": self.setup_cookie() })
        http_server = tornado.httpserver.HTTPServer(application)
        http_server.listen(int(self.options['port']))
        tornado.ioloop.IOLoop.instance().start()
