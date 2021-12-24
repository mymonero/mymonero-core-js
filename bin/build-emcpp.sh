#!/bin/sh -xe

#EMCC_DEBUG=1

HOST_NCORES=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1)

mkdir -p build
cd build

emcmake cmake ..
emmake cmake --build .  -j$HOST_NCORES
emmake make -j$HOST_NCORES .
