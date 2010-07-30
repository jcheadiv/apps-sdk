#
# Copyright (c) 2010 BitTorrent Inc.
#

import BaseHTTPServer
import httplib
import httplib2
import logging
import os
import re
import SimpleHTTPServer
import socket
import urllib

import apps.command.base

# XXX - This is bad and makes me cranky
cookies = {}

class GriffinRequests(SimpleHTTPServer.SimpleHTTPRequestHandler):

    def address_string(self):
        # Non-localhost calls get timeouts in getfqdn
        # (why does a "Basic" http server do this?)
        return self.client_address[0]

    def translate_path(self, path):
        # Firefox on windows (for some reason) sends /asdf\asdf instead of
        # /asdf/asdf
        path = urllib.unquote(path).replace('\\', '/')
        return SimpleHTTPServer.SimpleHTTPRequestHandler.translate_path(
            self, path)

    def send_head(self):
        # Special version of send_head that falls back to the build directory.
        path = self.translate_path(self.path)
        f = None
        if os.path.isdir(path):
            if not self.path.endswith('/'):
                # redirect browser - doing basically what apache does
                self.send_response(301)
                self.send_header("Location", self.path + "/")
                self.end_headers()
                return None
            for index in "index.html", "index.htm":
                # XXX - Modification
                if self.path == '/':
                    path = os.path.join(path, 'build')
                index = os.path.join(path, index)
                if os.path.exists(index):
                    path = index
                    break
            else:
                return self.list_directory(path)
        ctype = self.guess_type(path)
        try:
            # Always read in binary mode. Opening files in text mode may cause
            # newline translations, making the actual size of the content
            # transmitted *less* than the content-length!
            f = open(path, 'rb')
        except IOError:
            # XXX - Modification, don't send the error here.
            return None
        self.send_response(200)
        self.send_header("Content-type", ctype)
        fs = os.fstat(f.fileno())
        self.send_header("Content-Length", str(fs[6]))
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()
        return f

    def do_GET(self):
        if self.path == '/foo':
            self.send_response(302)
            self.send_header("Location", "http://www.google.com")
            return
        f = self.send_head()
        if not f:
            self.path = '/build' + self.path
            f = self.send_head()
        if not f:
            self.send_error(404, 'File not found')
        if f:
            self.copyfile(f, self.wfile)
            f.close()

    def do_POST(self):
        fp = open(os.path.join('test', self.path[1:]), 'wb')
        fp.write(self.rfile.read(int(self.headers['Content-Length'])))
        fp.close()
        self.send_response(200)

    def handle_one_request(self):
        # Couldn't figure a better way to do this, so cut and paste it is.
        self.raw_requestline = self.rfile.readline()
        if not self.raw_requestline:
            self.close_connection = 1
            return
        if not self.parse_request(): # An error code has been sent, just exit
            return
        # If there is an X-Location header, proxy the request to the header's
        # value with everything else in the request.
        if self.headers.has_key('X-Location'):
            return self.proxy_request()
        mname = 'do_' + self.command
        if not hasattr(self, mname):
            self.send_error(501, "Unsupported method (%r)" % self.command)
            return
        method = getattr(self, mname)
        method()

    def proxy_request(self):
        remove = [ 'transfer-encoding' ]
        http = httplib2.Http()
        body = ''
        self.requestline = '%s %s' % (self.command,
                                      self.headers.get('x-location'))
        # The host header appears to make google.com redirect infinitely
        self.headers.dict.pop('host')
        print self.get_cookies()
        self.headers.dict['cookie'] = self.get_cookies()
        if self.headers.has_key('Content-Length'):
            body = self.rfile.read(int(self.headers['Content-Length']))
        resp, content = http.request(
            self.headers.get('x-location'), self.command,
            headers=self.headers.dict, body=body)
        self.send_response(resp.status, headers=False)
        resp.pop('status')
        resp.pop('-content-encoding')
        for k, v in resp.iteritems():
            if k == 'content-location':
                continue
            if k in remove:
                continue
            self.send_header(k, v)
            if k == 'set-cookie':
                self.save_cookie(v)
        self.end_headers()
        self.wfile.write(content)

    def save_cookie(self, cookie):
        excludes = [ 'expires', 'domain', 'path' ]
        for ck in re.split('[;,] ', cookie):
            found = False
            for i in excludes:
                if ck.find(i) == 0:
                    found = True
                    continue
            if '=' not in ck or found:
                continue
            k, v = ck.split('=', 1)
            cookies[k] = v

    def get_cookies(self):
        return '; '.join([ '%s=%s' % (k, v) for k,v in
                           cookies.iteritems()])

    def send_response(self, code, message=None, headers=True):
        self.log_request(code)
        if message is None:
            if code in self.responses:
                message = self.responses[code][0]
            else:
                message = ''
        if self.request_version != 'HTTP/0.9':
            self.wfile.write("%s %d %s\r\n" %
                             (self.protocol_version, code, message))
            # print (self.protocol_version, code, message)
        # Don't send headers for proxy connections
        if headers:
            self.send_header('Server', self.version_string())
            self.send_header('Date', self.date_time_string())

class serve(apps.command.base.Command):

    help = 'Run a development server to debug the project.'
    user_options = [ ('port=', 'p', 'Port to listen on.', None) ]
    option_defaults = { 'port': '8080' }
    pre_commands = [ 'generate' ]

    def run(self):
        logging.info('\tstarting server, access it at http://localhost:%s' % (
                self.options['port'],))
        httpd = BaseHTTPServer.HTTPServer(
            ('', int(self.options['port'])), GriffinRequests)
        httpd.serve_forever()
