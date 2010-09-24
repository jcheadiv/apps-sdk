#!/bin/sh
pushd $(dirname $0)
if [ 0 -eq $(stat -c%F $(which python |\
  sed 's#python$#Lib/site-packages/setuptools*egg#') | grep -c 'directory') ]
then
  easy_install -UZ setuptools
fi
python setup.py develop
python setup.py bdist_egg
cd loader
rm -rf dist
python setup.py py2exe
mv dist/apps-sdk.exe dist/apps.exe
python lib.py
PYTHONPATH=dist easy_install-2.6 -d dist -zUax ../dist/*.egg
popd
