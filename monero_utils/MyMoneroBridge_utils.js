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
function ret_val_boolstring_to_bool(boolstring)
{
	if (typeof boolstring !== "string") {
		throw "ret_val_boolstring_to_bool expected string input"
	}
	if (boolstring === "true" || boolstring === "1") {
		return true
	} else if (boolstring === "false" || boolstring === "0") {
		return false
	}
	throw "ret_val_boolstring_to_bool given illegal input"
}
exports.ret_val_boolstring_to_bool = ret_val_boolstring_to_bool;
//
function api_safe_wordset_name(wordset_name)
{
	// convert all lowercase, legacy values to core-cpp compatible
	if (wordset_name == "english") {
		return "English"
	} else if (wordset_name == "spanish") {
		return "Español"
	} else if (wordset_name == "portuguese") {
		return "Português"
	} else if (wordset_name == "japanese") {
		return "日本語"
	}
	return wordset_name // must be a value returned by core-cpp
}
exports.api_safe_wordset_name = api_safe_wordset_name;
//
function detect_platform()
{
	const ENVIRONMENT_IS_WEB = typeof window==="object";
	const ENVIRONMENT_IS_WORKER = typeof importScripts==="function";
	const ENVIRONMENT_IS_NODE = typeof process==="object" && process.browser !== true && typeof require==="function" && ENVIRONMENT_IS_WORKER == false; // we want this to be true for Electron but not for a WebView
	const ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
	return {
		ENVIRONMENT_IS_WEB: ENVIRONMENT_IS_WEB,
		ENVIRONMENT_IS_WORKER: ENVIRONMENT_IS_WORKER,
		ENVIRONMENT_IS_NODE: ENVIRONMENT_IS_NODE,
		ENVIRONMENT_IS_SHELL: ENVIRONMENT_IS_SHELL
	}
}
exports.detect_platform = detect_platform;
//
function update_options_for_fallback_to_asmjs(options)
{
	const platform_info = detect_platform();
	const ENVIRONMENT_IS_WEB = platform_info.ENVIRONMENT_IS_WEB;
	if ((typeof options.asmjs === 'undefined' || options.asmjs === null) && (typeof options.wasm === 'undefined' || options.wasm === null)) {
		var use_asmjs = false;
		if (ENVIRONMENT_IS_WEB) {
			var hasWebAssembly = false
			try {
				if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
					const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
					if (module instanceof WebAssembly.Module) {
						var isInstance = new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
						if (isInstance) {
							// TODO: add ios 11 mobile safari bug check to hasWebAssembly
						}
						// until then…
						hasWebAssembly = isInstance
					}
				}
			} catch (e) {
				// avoiding empty block statement warning..
				hasWebAssembly = false // to be clear
			}
			use_asmjs = hasWebAssembly != true
		}
		options.asmjs = use_asmjs;
	}
}
exports.update_options_for_fallback_to_asmjs = update_options_for_fallback_to_asmjs;