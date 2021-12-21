#!/bin/sh -xe

rm -rf build monero_utils/MyMoneroCoreCpp_*
mkdir -p build

./bin/build-boost-emscripten.sh
./bin/archive-emcpp.sh
