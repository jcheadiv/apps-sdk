#!/bin/sh
pushd $(dirname $0)
python setup.py develop
python setup.py bdist_egg
cd loader
rm -rf dist
python setup.py py2exe
mv dist/apps-sdk.exe dist/apps.exe
python lib.py
PYTHONPATH=dist easy_install-2.6 -d dist -zUax ../dist/*.egg
cp -r "$VS90COMNTOOLS/../../VC/redist/x86/Microsoft.VC90.CRT/" dist
popd
