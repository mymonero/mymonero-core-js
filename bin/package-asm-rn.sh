#!/usr/bin/env bash

DIR="./monero_utils";

ASM_FILE="$DIR/MyMoneroCoreCpp_ASMJS.asm.js"
ASM_FILE_OUT="$DIR/MyMoneroCoreCpp_ASMJS.asm.rn.js"

LOADER_FILE="$DIR/MyMoneroCoreCpp_ASMJS.js"
LOADER_FILE_OUT="$DIR/MyMoneroCoreCpp_ASMJS.rn.js"

echo "🔁  Creating Base64 module for ASMJS"
echo "module.exports = \"`base64 $ASM_FILE`\";" > $ASM_FILE_OUT

echo "🔁  Patching loader for React Native support"
sed 's/require("/requirexxx("/g' $LOADER_FILE > $LOADER_FILE_OUT
sed -i '.bak' 's/requirexxx("crypto")/require("crypto")/g' $LOADER_FILE_OUT

echo "🔁  Cleanup"
rm -rf $DIR/*.bak