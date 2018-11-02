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

"use strict";
const { initMonero } = require("../");
const net_service_utils = require('../hostAPI/net_service_utils')
const monero_config = require('../monero_utils/monero_config') 
const assert = require("assert");

let mymonero_core_js

class APIClient
{
	constructor(options)
	{
		const self = this
		self.options = options
		self.fetch = options.fetch
		if (self.fetch == null || typeof self.fetch == 'undefined') {
			throw "APIClient requires options.fetch"
		}
		self.hostBaseURL = options.hostBaseURL || "http://localhost:9100/" // must include trailing /
	}	
	//
	// Getting outputs for sending funds
	UnspentOuts(
		address, view_key__private,
		spend_key__public, spend_key__private,
		mixinNumber, sweeping,
		fn
	) { // -> RequestHandle
		const self = this
		mixinNumber = parseInt(mixinNumber) // jic
		//
		const parameters = net_service_utils.New_ParametersForWalletRequest(address, view_key__private)
		parameters.amount = '0'
		parameters.mixin = mixinNumber
		parameters.use_dust = true // Client now filters unmixable by dustthreshold amount (unless sweeping) + non-rct 
		parameters.dust_threshold = mymonero_core_js.monero_config.dustThreshold.toString()
		const endpointPath = 'get_unspent_outs'
		self.fetch.post(
			self.hostBaseURL + endpointPath, parameters
		).then(function(data) {
			__proceedTo_parseAndCallBack(data)
		}).catch(function(e) {
			fn(e && e.Error ? e.Error : ""+e);
		});
		function __proceedTo_parseAndCallBack(data)
		{
			mymonero_core_js.api_response_parser_utils.Parsed_UnspentOuts__keyImageManaged(
				data,
				address,
				view_key__private,
				spend_key__public,
				spend_key__private,
				mymonero_core_js.monero_utils,
				function(err, returnValuesByKey)
				{
					if (err) {
						fn(err)
						return
					}
					const per_byte_fee__string = returnValuesByKey.per_byte_fee__string
					if (per_byte_fee__string == null || per_byte_fee__string == "" || typeof per_byte_fee__string === 'undefined') {
						throw "Unexpected / missing per_byte_fee__string"
					}
					fn(
						err, // no error
						returnValuesByKey.unspentOutputs,
						returnValuesByKey.per_byte_fee__string
					)
				}
			)
		}
		const requestHandle = 
		{
			abort: function()
			{
				console.warn("TODO: abort!")
			}
		}
		return requestHandle
	}
	//
	RandomOuts(using_outs, mixinNumber, fn)
	{ // -> RequestHandle
		const self = this
		//
		mixinNumber = parseInt(mixinNumber)
		if (mixinNumber < 0 || isNaN(mixinNumber)) {
			const errStr = "Invalid mixin - must be >= 0"
			const err = new Error(errStr)
			fn(err)
			return
		}
		//
		var amounts = [];
		for (var l = 0; l < using_outs.length; l++) {
			amounts.push(using_outs[l].rct ? "0" : using_outs[l].amount.toString())
		}
		//
		var parameters =
		{
			amounts: amounts,
			count: mixinNumber + 1 // Add one to mixin so we can skip real output key if necessary
		}
		const endpointPath = 'get_random_outs'
		self.fetch.post(
			self.hostBaseURL + endpointPath, parameters
		).then(function(data) {
			__proceedTo_parseAndCallBack(data)
		}).catch(function(e) {
			fn(e && e.Error ? e.Error : ""+e);
		});
		function __proceedTo_parseAndCallBack(data)
		{
			console.log("debug: info: random outs: data", data)
			const amount_outs = data.amount_outs
			// yield
			fn(null, amount_outs)
		}
		const requestHandle = 
		{
			abort: function()
			{
				console.warn("TODO: abort!")
			}
		}
		return requestHandle
	}
	//
	// Runtime - Imperatives - Public - Sending funds
	SubmitSerializedSignedTransaction(
		address, view_key__private,
		serializedSignedTx,
		fn // (err?) -> RequestHandle
	) {
		const self = this
		//
		const parameters = net_service_utils.New_ParametersForWalletRequest(address, view_key__private)
		parameters.tx = serializedSignedTx
		const endpointPath = 'submit_raw_tx'
		self.fetch.post(
			self.hostBaseURL + endpointPath, parameters
		).then(function(data) {
			__proceedTo_parseAndCallBack(data)
		}).catch(function(e) {
			fn(e && e.Error ? e.Error : ""+e);
		});
		function __proceedTo_parseAndCallBack(data)
		{
			fn(null)
		}
		const requestHandle = 
		{
			abort: function()
			{
				console.warn("TODO: abort!")
			}
		}
		return requestHandle
	}
}
//
// This fetch API is of course not accurate
class Fetch
{
	constructor()
	{
	}
	post(url, params)
	{
		return new Promise(function(resolve, reject)
		{
			console.log("Mocked fetch url", url, params)
			if (url.indexOf("get_unspent_outs") !== -1) {
				resolve({
					outputs: [
						{
							"amount":"3000000000",
							"public_key":"41be1978f58cabf69a9bed5b6cb3c8d588621ef9b67602328da42a213ee42271",
							"index":1,
							"global_index":7611174,
							"rct":"86a2c9f1f8e66848cd99bfda7a14d4ac6c3525d06947e21e4e55fe42a368507eb5b234ccdd70beca8b1fc8de4f2ceb1374e0f1fd8810849e7f11316c2cc063060008ffa5ac9827b776993468df21af8c963d12148622354f950cbe1369a92a0c",
							"tx_id":5334971,
							"tx_hash":"9d37c7fdeab91abfd1e7e120f5c49eac17b7ac04a97a0c93b51c172115df21ea",
							"tx_pub_key":"bd703d7f37995cc7071fb4d2929594b5e2a4c27d2b7c68a9064500ca7bc638b8",
							"spend_key_images": [
								"3d92d42a105c231997b2fcb13b07ea1526fd4f709daaa8b9157608db387065f9"
							]
						} // NOTE: we'd have more in the real reply - and even the api response parser doesn't care about those values right now
					],
					per_byte_fee: "24658"
					/*deprecated*/// per_kb_fee: parseInt("24658"/*for str search*/) * 1024 // scale the per b we know up to per kib (so it can be scaled back down - interrim until all clients are ready for per b fee)
				})
			} else if (url.indexOf("get_random_outs") !== -1) {
				resolve({
					amount_outs: [
						{
							"amount":"0",
							"outputs":[
								{"global_index":"7453099","public_key":"31f3a7fec0f6f09067e826b6c2904fd4b1684d7893dcf08c5b5d22e317e148bb","rct":"ea6bcb193a25ce2787dd6abaaeef1ee0c924b323c6a5873db1406261e86145fc"},
								{"global_index":"7500097","public_key":"f9d923500671da05a1bf44b932b872f0c4a3c88e6b3d4bf774c8be915e25f42b","rct":"dcae4267a6c382bcd71fd1af4d2cbceb3749d576d7a3acc473dd579ea9231a52"},
								{"global_index":"7548483","public_key":"839cbbb73685654b93e824c4843e745e8d5f7742e83494932307bf300641c480","rct":"aa99d492f1d6f1b20dcd95b8fff8f67a219043d0d94b4551759016b4888573e7"},
								{"global_index":"7554755","public_key":"b8860f0697988c8cefd7b4285fbb8bec463f136c2b9a9cadb3e57cebee10717f","rct":"327f9b07bee9c4c25b5a990123cd2444228e5704ebe32016cd632866710279b5"},
								{"global_index":"7561477","public_key":"561d734cb90bc4a64d49d37f85ea85575243e2ed749a3d6dcb4d27aa6bec6e88","rct":"b5393e038df95b94bfda62b44a29141cac9e356127270af97193460d51949841"},
								{"global_index":"7567062","public_key":"db1024ef67e7e73608ef8afab62f49e2402c8da3dc3197008e3ba720ad3c94a8","rct":"1fedf95621881b77f823a70aa83ece26aef62974976d2b8cd87ed4862a4ec92c"},
								{"global_index":"7567508","public_key":"6283f3cd2f050bba90276443fe04f6076ad2ad46a515bf07b84d424a3ba43d27","rct":"10e16bb8a8b7b0c8a4b193467b010976b962809c9f3e6c047335dba09daa351f"},
								{"global_index":"7568716","public_key":"7a7deb4eef81c1f5ce9cbd0552891cb19f1014a03a5863d549630824c7c7c0d3","rct":"735d059dc3526334ac705ddc44c4316bb8805d2426dcea9544cde50cf6c7a850"},
								{"global_index":"7571196","public_key":"535208e354cae530ed7ce752935e555d630cf2edd7f91525024ed9c332b2a347","rct":"c3cf838faa14e993536c5581ca582fb0d96b70f713cf88f7f15c89336e5853ec"},
								{"global_index":"7571333","public_key":"e73f27b7eb001aa7eac13df82814cda65b42ceeb6ef36227c25d5cbf82f6a5e4","rct":"5f45f33c6800cdae202b37abe6d87b53d6873e7b30f3527161f44fa8db3104b6"},
								{"global_index":"7571335","public_key":"fce982db8e7a6b71a1e632c7de8c5cbf54e8bacdfbf250f1ffc2a8d2f7055ce3","rct":"407bdcc48e70eb3ef2cc22cefee6c6b5a3c59fd17bde12fda5f1a44a0fb39d14"}
							]
						}
					]
				})
			} else if (url.indexOf("submit_raw_tx") !== -1) {
				resolve({}) // mocking tx submission success
			} else {
				reject("Fetch implementation doesn't know how to get url: " + url);
			}
		})
	}
}

describe("sendingFunds tests", function()
{
	before('initMonero', async () => {
		const result = await initMonero()
		mymonero_core_js = result.mymonero_core_js
	})
	it("can send", async function()
	{
		mymonero_core_js.monero_sendingFunds_utils.SendFunds(
			"4L6Gcy9TAHqPVPMnqa5cPtJK25tr7maE7LrJe67vzumiCtWwjDBvYnHZr18wFexJpih71Mxsjv8b7EpQftpB9NjPaRYYBm62jmF59EWcj6", // target_address,
			mymonero_core_js.nettype_utils.network_type.MAINNET,
			"0.0002",// amount_orZeroWhenSweep,
			false,// isSweep_orZeroWhenAmount, 
			"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg",// wallet__public_address,
			{view:"7bea1907940afdd480eff7c4bcadb478a0fbb626df9e3ed74ae801e18f53e104",spend:"4e6d43cd03812b803c6f3206689f5fcc910005fc7e91d50d79b0776dbefcd803"},// wallet__private_keys,
			{view:"080a6e9b17de47ec62c8a1efe0640b554a2cde7204b9b07bdf9bd225eeeb1c47",spend:"3eb884d3440d71326e27cc07a861b873e72abd339feb654660c36a008a0028b3"},// wallet__public_keys,
			new APIClient({ fetch: new Fetch() }), 
			null,// payment_id,
			1,// simple_priority,
			function(code)
			{
				console.log("Send funds step " + code + ": " + mymonero_core_js.monero_sendingFunds_utils.SendFunds_ProcessStep_MessageSuffix[code])
			},
			function(to_addr, sentAmount, final__payment_id, tx_hash, tx_fee, tx_key, mixin)
			{
				assert.equal(mixin, 10);
				assert.equal(sentAmount.toString(), "266009466")
				assert.equal(final__payment_id, "d2f602b240fbe624")
				console.log("Sendfunds success")
				console.log("sentAmount", sentAmount.toString())
				console.log("final__payment_id", final__payment_id)
				console.log("tx_hash", tx_hash)
				console.log("tx_fee", tx_fee.toString())
				console.log("tx_key", tx_key)
			},
			function(err)
			{
				throw "SendFunds err:" + err // TODO: how to assert err msg not nil? didn't works
			}
		)
	});
});
