#!/bin/sh

bin/build-emcpp.sh && 
cp build/MyMoneroCoreCpp.js cryptonote_utils/ && 
cp build/MyMoneroCoreCpp.js.mem cryptonote_utils/ 