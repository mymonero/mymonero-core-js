// Copyright (c) 2014-2018, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// Original Author: Lucas Jones
// Modified to remove jQuery dep and support modular inclusion of deps by Paul Shapiro (2016)
// Modified to add RingCT support by luigi1111 (2017)
//
// v--- These should maybe be injected into a context and supplied to currencyConfig for future platforms
const JSBigInt = require("../cryptonote_utils/biginteger").BigInteger;
const nettype_utils = require("../cryptonote_utils/nettype");
const monero_config = require('./monero_config');
const monero_amount_format_utils = require("../cryptonote_utils/money_format_utils")(monero_config);
const { MyMoneroCoreBridge } = require('./MyMoneroCoreBridge.js')

//
module.exports = function(options)
{
	options = options || {}
	//
	return new Promise(function(resolve) {
		const ENVIRONMENT_IS_WEB = typeof window==="object";
		const ENVIRONMENT_IS_WORKER = typeof importScripts==="function";
		const ENVIRONMENT_IS_NODE = typeof process==="object" && process.browser !== true && typeof require==="function" && ENVIRONMENT_IS_WORKER == false; // we want this to be true for Electron but not for a WebView
		const ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
		var Module_template = {}
		if (options.asmjs != true || options.wasm == true) { // wasm
			Module_template["locateFile"] = function(filename, scriptDirectory)
			{
				// if (options["locateFile"]) {
				// 	return options["locateFile"](filename, scriptDirectory)
				// }
				var this_scriptDirectory = scriptDirectory
				const lastChar = this_scriptDirectory.charAt(this_scriptDirectory.length - 1)
				if (lastChar == "/" || lastChar == "\\") { 
					// ^-- this is not a '\\' on Windows because emscripten actually appends a '/'
					this_scriptDirectory = this_scriptDirectory.substring(0, this_scriptDirectory.length - 1) // remove trailing "/"
				}
				var fullPath = null; // add trailing slash to this
				if (ENVIRONMENT_IS_NODE) {
					const path = require('path')
					const lastPathComponent = path.basename(this_scriptDirectory)
					if (lastPathComponent == "monero_utils") { // typical node or electron-main process
						fullPath = path.format({
							dir: this_scriptDirectory,
							base: filename
						})
					} else {
						console.warn("MyMoneroCoreBridge/locateFile() on node.js didn't find \"monero_utils\" (or possibly MyMoneroCoreBridge.js) itself in the expected location in the following path. The function may need to be expanded but it might in normal situations be likely to be another bug." ,  pathTo_cryptonoteUtilsDir)
					}
				} else if (ENVIRONMENT_IS_WEB) {
					var pathTo_cryptonoteUtilsDir;
					if (typeof __dirname !== undefined && __dirname !== "/") { // looks like node running in browser.. (but not going to assume it's electron-renderer since that should be taken care of by monero_utils.js itself)
						// but just in case it is... here's an attempt to support it
						// have to check != "/" b/c webpack (I think) replaces __dirname
						pathTo_cryptonoteUtilsDir = "file://" + __dirname + "/" // prepending "file://" because it's going to try to stream it
					} else { // actual web browser
						pathTo_cryptonoteUtilsDir = this_scriptDirectory + "/mymonero_core_js/monero_utils/" // this works for the MyMonero browser build, and is quite general, at least
					}
					fullPath = pathTo_cryptonoteUtilsDir + filename
				}
				if (fullPath == null) {
					throw "Unable to derive fullPath. Please pass locateFile() to cryptonote_utils init."
				}
				//
				return fullPath
			}
			//
			// NOTE: This requires src/module-post.js to be included as post-js in CMakeLists.txt under a wasm build
			require("./MyMoneroCoreCpp")(Module_template).ready.then(function(thisModule) 
			{
				const instance = new MyMoneroCoreBridge(thisModule);
				resolve(instance);
			}).catch(function(e) {
				console.error("Error loading MyMoneroCoreCpp:", e);
				reject(e);
			});
		} else { // this is synchronous so we can resolve immediately
			resolve(new MyMoneroCoreBridge(require("./MyMoneroCoreCpp")(Module_template)))
		}
	});
};