#
# Copyright (c) 2010 BitTorrent Inc.
#

import logging
import math
import os
import sys
import tempfile
import urllib2

import apps.command.base
import apps.pe

class bundle(apps.command.base.Command):

    user_options = [ ('exe=', None, 'Exe to bundle', None) ]
    pre_commands = [ 'package' ]
    option_defaults = { 'exe': 'http://download.utorrent.com/2.2/utorrent.exe' }
    help = 'Bundle your app with a uTorrent client.'

    def round(self, x, n):
        return (x + n - 1) & ~( n - 1 )

    def run(self):
        fp = tempfile.TemporaryFile()
        fp.write(urllib2.urlopen(self.options['exe']).read())
        fp.flush()
        p = apps.pe.pecoff(fp)
        add = open(self._output_file(), 'rb').read()
        while len(add) % p.filealign:
            add += '\0'
        p.sections.append(apps.pe.pesect(
                { 'name': '.options',
                  'paddr': p.sections[-1].paddr + p.sections[-1].psize,
                  'psize': len(add),
                  'vaddr': self.round(p.sections[-1].vaddr + \
                                          p.sections[-1].vsize, 4096),
                  'vsize': self.round(len(add), 4096),
                  'characteristics': 0x12000000,
                  'data': add }))
        outfile = open('utorrent.exe', 'wb')
        p.write(outfile)
        outfile.close()
