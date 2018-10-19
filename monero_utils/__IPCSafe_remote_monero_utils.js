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
// NOTE: You will never need to require this file directly. See / use monero_utils.js.
//
const ENVIRONMENT_IS_WEB = typeof window==="object";
const ENVIRONMENT_IS_WORKER = typeof importScripts==="function";
const ENVIRONMENT_IS_NODE = typeof process==="object" && process.browser !== true && typeof require==="function" && ENVIRONMENT_IS_WORKER == false; // we want this to be true for Electron but not for a WebView
if (!ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_WEB) {
	throw "Not expecting this module to be included in this environment: non-node or web"
}
var coreBridge_instance = null;
const local_fns = {};
const fn_names = require('./__bridged_fns_spec').bridgedFn_names;
for (const i in fn_names) {
	const name = fn_names[i]
	local_fns[name] = function()
	{
		if (coreBridge_instance === null) {
			throw "Expected coreBridge_instance to have been loaded by the time " + name + " was called"
		}
		//
		// Note how we're not getting ret.err_msg and using it to 'throw' 
		// here… we're just passing it back over from remote as JSON
		//
		return coreBridge_instance[name].apply(coreBridge_instance, arguments); // We are not intercepting the err_msg here -- because we will kill the remote fn call if we throw -- so we'll let the renderer-side throw
	}
}
//
// Cannot export a promise, though, because this must be safe for IPC to electron 'remote'...
local_fns.isReady = false;
//
module.exports = local_fns;
//
//
const coreBridgeLoading_promise = require("./MyMoneroCoreBridge")({asmjs: false});
coreBridgeLoading_promise.then(function(this__coreBridge_instance)
{
	coreBridge_instance = this__coreBridge_instance;
	//
	local_fns.isReady = true;
	//
});
coreBridgeLoading_promise.catch(function(e)
{
	console.log("Error: ", e);
	// this may be insufficient… being able to throw would be nice
});
