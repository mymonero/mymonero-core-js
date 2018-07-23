#!/bin/sh

mkdir -p build && 
cd build && 
emconfigure cmake  .. && 
emmake cmake --build . && 
emmake make .