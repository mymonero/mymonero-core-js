#!/bin/sh

bin/build-emcpp.sh &&
cp build/MyMoneroCoreCpp_WASM.js monero_utils/; 
cp build/MyMoneroCoreCpp_WASM.wasm monero_utils/;
cp build/MyMoneroCoreCpp_ASMJS.js monero_utils/; 
cp build/MyMoneroCoreCpp_ASMJS.asm.js monero_utils/ 