#!/bin/sh -xe

rm -rf contrib build monero_utils/MyMoneroCoreCpp_*
mkdir -p contrib/boost-sdk build

tar zxf /opt/boost.tar.gz -C contrib/boost-sdk --strip-components=1

./bin/build-boost-emscripten.sh
./bin/archive-emcpp.sh
