#!/bin/sh -xe

docker build . -t emsdk-for-mymonero-core-js

docker \
    run \
    --rm \
    -i \
    -v $(pwd):/app \
    -w /app \
    -e EMSCRIPTEN=/emsdk/upstream/emscripten \
    emsdk-for-mymonero-core-js \
    ./bin/build-all.sh
