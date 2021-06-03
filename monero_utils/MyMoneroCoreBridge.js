// Copyright (c) 2014-2019, MyMonero.com
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
//
const MyMoneroCoreBridgeClass = require('./MyMoneroCoreBridgeClass')
const MyMoneroBridge_utils = require('./MyMoneroBridge_utils')
//
module.exports = function(options)
{
	options = options || {}

	MyMoneroBridge_utils.update_options_for_fallback_to_asmjs(options)

	const platform_info = MyMoneroBridge_utils.detect_platform();
	const ENVIRONMENT_IS_WEB = platform_info.ENVIRONMENT_IS_WEB;
	const ENVIRONMENT_IS_WORKER = platform_info.ENVIRONMENT_IS_WORKER;
	const ENVIRONMENT_IS_NODE = platform_info.ENVIRONMENT_IS_NODE;
	const ENVIRONMENT_IS_SHELL = platform_info.ENVIRONMENT_IS_SHELL;
	//
	function locateFile(filename, scriptDirectory)
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
				console.warn(`MyMoneroCoreBridge/locateFile() on node.js didn't find "monero_utils" (or possibly MyMoneroCoreBridge.js) itself in the expected location in the following path. The function may need to be expanded but it might in normal situations be likely to be another bug. ${pathTo_cryptonoteUtilsDir}`)
			}
		} else if (ENVIRONMENT_IS_WEB) {
			var pathTo_cryptonoteUtilsDir;
			if (typeof __dirname !== undefined && __dirname !== "/") { // looks like node running in browser.. (but not going to assume it's electron-renderer since that should be taken care of by monero_utils.js itself)
				// but just in case it is... here's an attempt to support it
				// have to check != "/" b/c webpack (I think) replaces __dirname
				pathTo_cryptonoteUtilsDir = "file://" + __dirname + "/" // prepending "file://" because it's going to try to stream it
			} else { // actual web browser
				pathTo_cryptonoteUtilsDir = this_scriptDirectory + `/mymonero_core_js/monero_utils/` // this works for the MyMonero browser build, and is quite general, at least
			}
			fullPath = pathTo_cryptonoteUtilsDir + filename
		}
		if (fullPath == null) {
			throw "Unable to derive fullPath. Please pass locateFile() to bridge obj init."
		}
		//
		return fullPath
	}
	return new Promise(function(resolve, reject) {
		var Module_template = {}
		if (options.asmjs != true || options.wasm == true) { // wasm
			console.log("Using wasm: ", true)
			//
			Module_template["locateFile"] = locateFile
			//
			// NOTE: This requires src/module-post.js to be included as post-js in CMakeLists.txt under a wasm build
			require(`./MyMoneroCoreCpp_WASM`)(Module_template).ready.then(function(thisModule) 
			{
				const instance = new MyMoneroCoreBridgeClass(thisModule);
				resolve(instance);
			}).catch(function(e) {
				console.error("Error loading WASM_MyMoneroCoreCpp:", e);
				reject(e);
			});
		} else { // this is synchronous so we can resolve immediately
			console.log("Using wasm: ", false)
			//
			var scriptDirectory=""; // this was extracted from emscripten - it could get factored if anything else would ever need it
			if (ENVIRONMENT_IS_NODE) {
				scriptDirectory=__dirname+"/";
			} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
				if (ENVIRONMENT_IS_WORKER) {
					scriptDirectory = self.location.href
				} else if (document.currentScript) {
					scriptDirectory = document.currentScript.src
				}
				var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
				if(_scriptDir){
					scriptDirectory = _scriptDir
				}
				if (scriptDirectory.indexOf("blob:") !== 0) {
					scriptDirectory = scriptDirectory.substr(0,scriptDirectory.lastIndexOf("/")+1)
				} else {
					scriptDirectory = ""
				}
			}
			var read_fn;
			if (ENVIRONMENT_IS_NODE) {
				read_fn = function(filepath)
				{
					return require("fs").readFileSync(require("path").normalize(filepath)).toString()
				};
			} else if (ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER) {
				read_fn = function(url)
				{ // it's an option to move this over to fetch, but, fetch requires a polyfill for these older browsers anyway - making fetch an automatic dep just for asmjs fallback - and the github/fetch polyfill does not appear to actually support mode (for 'same-origin' policy) anyway - probably not worth it yet 
					var xhr = new XMLHttpRequest()
					xhr.open("GET", url, false)
					xhr.send(null)
					//
					return xhr.responseText
				};
			} else {
				throw "Unsupported environment - please implement file reading for asmjs fallback case"
			}
			const filepath = locateFile("MyMoneroCoreCpp_ASMJS.asm.js", scriptDirectory)
			const content = read_fn(filepath)
			// TODO: verify content - for now, relying on same-origin and tls/ssl
			var Module = {}
			try {
				eval(content) // I do not believe this is a safety concern, because content is server-controlled; https://humanwhocodes.com/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
			} catch (e) {
				reject(e)
				return
			}
			setTimeout(function()
			{ // "delaying even 1ms is enough to allow compilation memory to be reclaimed"
				Module_template['asm'] = Module['asm']
				Module = null
				resolve(new MyMoneroCoreBridgeClass(require("./MyMoneroCoreCpp_ASMJS")(Module_template)))
			}, 1) 
		}
	});
};