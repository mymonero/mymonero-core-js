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
// const asmModule = require('./MyMoneroCoreCpp_ASMJS.asm')
// const MyMoneroCoreCpp_ASMJS = require("./MyMoneroCoreCpp_ASMJS")

function locateFile(filename, scriptDirectory)
{
	var this_scriptDirectory = scriptDirectory
	const lastChar = this_scriptDirectory.charAt(this_scriptDirectory.length - 1)
	if (lastChar == "/" || lastChar == "\\") {
		// ^-- this is not a '\\' on Windows because emscripten actually appends a '/'
		this_scriptDirectory = this_scriptDirectory.substring(0, this_scriptDirectory.length - 1) // remove trailing "/"
	}
	var fullPath = null; // add trailing slash to this
	const path = require('path')
	const lastPathComponent = path.basename(this_scriptDirectory)
	fullPath = path.format({
		dir: this_scriptDirectory,
		base: filename
	})
	if (fullPath == null) {
		throw "Unable to derive fullPath. Please pass locateFile() to bridge obj init."
	}
	//
	return fullPath
}

module.exports = function(options)
{
	options = options || {}

	MyMoneroBridge_utils.update_options_for_fallback_to_asmjs(options)
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
			})
		} else {
			console.log("Using wasm: ", false)

			var scriptDirectory = ""; // this was extracted from emscripten - it could get factored if anything else would ever need it
			var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;

			if(_scriptDir){
				scriptDirectory = _scriptDir
			}
			if (scriptDirectory.indexOf("blob:") !== 0) {
				scriptDirectory = scriptDirectory.substr(0,scriptDirectory.lastIndexOf("/")+1)
			} else {
				scriptDirectory = ""
			}

			var read_fn = function(url)
			{ // it's an option to move this over to fetch, but, fetch requires a polyfill for these older browsers anyway - making fetch an automatic dep just for asmjs fallback - and the github/fetch polyfill does not appear to actually support mode (for 'same-origin' policy) anyway - probably not worth it yet
				var xhr = new XMLHttpRequest()
				xhr.open("GET", url, false)
				xhr.send(null)
				//
				return xhr.responseText
			};

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


		// var Module_template = {
		// 	asm: asmModule,
		// }

		// setTimeout(function()
		// { // "delaying even 1ms is enough to allow compilation memory to be reclaimed"
		// 	resolve(new MyMoneroCoreBridgeClass(MyMoneroCoreCpp_ASMJS(Module_template)))
		// }, 1)

	});
};
