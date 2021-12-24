#!/bin/sh -xe

if [ -z "$EMSCRIPTEN" ]; then
  echo "EMSCRIPTEN MUST BE DEFINED!"
  exit -1
fi

cd $EMSCRIPTEN

./embuilder.py build zlib
./embuilder.py build boost_headers
