#!/bin/sh

bin/build-emcpp.sh &&
cp build/MyMoneroCoreCpp.js monero_utils/; 
# it's ok if certain combinations of the following error.
# e.g. under wasm builds, you wouldn't want cp .wasm to be erroring.
# under asmjs builds with .mem file enabled, you'd not want .mem to be erroring.
cp build/MyMoneroCoreCpp.wasm monero_utils/;
cp build/MyMoneroCoreCpp.wast monero_utils/;
cp build/MyMoneroCoreCpp.js.mem monero_utils/ 