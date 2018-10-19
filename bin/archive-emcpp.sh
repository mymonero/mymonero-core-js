#!/bin/sh

bin/build-emcpp.sh &&
cp build/MyMoneroCoreCpp.js monero_utils/;
cp build/MyMoneroCoreCpp.wasm monero_utils/;
cp build/MyMoneroCoreCpp.wast monero_utils/;
cp build/MyMoneroCoreCpp.js.mem monero_utils/ 