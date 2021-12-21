#!/bin/sh -xe

bin/build-emcpp.sh
cp build/MyMoneroCoreCpp_WASM.js monero_utils/
cp build/MyMoneroCoreCpp_WASM.wasm monero_utils/
