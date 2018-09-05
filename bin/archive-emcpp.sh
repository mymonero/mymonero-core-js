#!/bin/sh

bin/build-emcpp.sh && 
cp build/MyMoneroCoreCpp.js monero_utils/ && 
cp build/MyMoneroCoreCpp.wasm monero_utils/ 