#!/bin/sh -xe

docker \
    run \
    --rm \
    -i \
    -v $(pwd):/app \
    -w /app \
    -e EMSCRIPTEN=/emsdk/upstream/emscripten \
    emscripten/emsdk:3.0.1 \
    ./bin/build-all.sh
