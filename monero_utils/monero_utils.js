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
//
"use strict";
//
const ENVIRONMENT_IS_WEB = typeof window==="object";
const ENVIRONMENT_IS_WORKER = typeof importScripts==="function";
const ENVIRONMENT_IS_NODE = typeof process==="object" && process.browser !== true && typeof require==="function" && ENVIRONMENT_IS_WORKER == false; // we want this to be true for Electron but not for a WebView
const wants_electronRemote = (ENVIRONMENT_IS_NODE&&ENVIRONMENT_IS_WEB)/*this may become insufficient*/
	|| (typeof window !== 'undefined' && window.IsElectronRendererProcess == true);
//
const fn_names = require('./__bridged_fns_spec').bridgedFn_names;

const moneroUtils_promise = function(resolve, reject)
{
	function _didLoad(coreBridge_instance)
	{
		if (coreBridge_instance == null) {
			throw "Unable to make coreBridge_instance"
		}
		const local_fns = {};
		for (const i in fn_names) {
			const name = fn_names[i]
			local_fns[name] = function()
			{
				const retVal = coreBridge_instance[name].apply(coreBridge_instance, arguments); // called on the cached value
				if (typeof retVal === "object") {
					const err_msg = retVal.err_msg
					if (typeof err_msg !== 'undefined' && err_msg) {
						throw err_msg; // because we can't throw from electron remote w/o killing fn call
						// ... and because parsing out this err_msg everywhere is sorta inefficient
					}
				}
				return retVal;
			}
		}
		local_fns.Module = coreBridge_instance.Module;
		resolve(local_fns);
	}
	if (wants_electronRemote) {
		// Require file again except on the main process ...
		// this avoids a host of issues running wasm on the renderer side, 
		// for right now until we can load such files raw w/o unsafe-eval
		// script-src CSP. makes calls synchronous. if that is a perf problem 
		// we can make API async.
		// 
		// Resolves relative to the entrypoint of the main process.
		const remoteModule = require('electron').remote.require(
			"../mymonero_core_js/monero_utils/__IPCSafe_remote_monero_utils"
		);
		// Oftentimes this will be ready right away.. somehow.. but just in case.. the readiness
		// state promise behavior should be preserved by the following codepath...
		var _try;
		function __retryAfter(attemptN)
		{
			console.warn("Checking remote module readiness again after a few ms...")
			setTimeout(function()
			{
				_try(attemptN + 1)
			}, 30)
		}
		_try = function(attemptN)
		{
			if (attemptN > 10000) {
				throw "Expected remote module to be ready"
			}
			if (remoteModule.isReady) {
				_didLoad(remoteModule);
			} else {
				__retryAfter(attemptN)
			}
		}
		_try(0)
	} else {
		const coreBridgeLoading_promise = require('./MyMoneroCoreBridgeNodeWeb.js')({ asmjs: false }); // this returns a promise
		coreBridgeLoading_promise.catch(function(e)
		{
			console.error("Error: ", e);
			// this may be insufficient… being able to throw would be nice
			reject(e);
		});
		coreBridgeLoading_promise.then(_didLoad);
	}
}
let _moneroUtils
const moneroUtilsFactory = async () => {
	if (!_moneroUtils) {
		_moneroUtils = new Promise(moneroUtils_promise)
	}
	return _moneroUtils
}

//
//
// Since we actually are constructing bridge functions we technically have the export ready 
// synchronously but that would lose the ability to wait until the core bridge is actually ready.
//
// TODO: in future, possibly return function which takes options instead to support better env.
//
module.exports = { moneroUtilsFactory };