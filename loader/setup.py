from distutils.core import setup
from glob import glob
import py2exe

data_files = [ ('MICROSOFT.VC90.CRT', glob(r'..\..\apps\py2exe\MICROSOFT.VC90.CRT\*.*')) ]

setup(console = ['apps-sdk.py'],
      options = { 'py2exe': { "unbuffered": True,
                              "optimize": 2,
                              "includes": [ 'email' ],
                              "packages": ["mako.cache", "email"],
                              }
                },
      data_files = data_files
      )
