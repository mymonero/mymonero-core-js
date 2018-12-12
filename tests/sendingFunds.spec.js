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
const mymonero_core_js = require("../");
const JSBigInt = mymonero_core_js.JSBigInt;
const assert = require("assert");

class APIClient
{
	constructor(options)
	{
		const self = this
		self.options = options
		self.fetch = options.fetch
		if (self.fetch == null || typeof self.fetch == 'undefined') {
			throw new Error("APIClient requires options.fetch")
		}
		self.hostBaseURL = options.hostBaseURL || "http://localhost:9100/" // must include trailing /
	}	
	//
	// Getting outputs for sending funds
	UnspentOuts(parameters, fn)
	{ // -> RequestHandle
		const self = this
		const endpointPath = 'get_unspent_outs'
		self.fetch.post(
			self.hostBaseURL + endpointPath, parameters
		).then(function(data) {
			fn(null, data)
		}).catch(function(e) {
			fn(e && e.Error ? e.Error : ""+e);
		});
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
	RandomOuts(parameters, fn)
	{ // -> RequestHandle
		const self = this
		const endpointPath = 'get_random_outs'
		self.fetch.post(
			self.hostBaseURL + endpointPath, parameters
		).then(function(data) {
			fn(null, data)
		}).catch(function(e) {
			fn(e && e.Error ? e.Error : ""+e);
		});
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
	SubmitRawTx(parameters, fn)
	{
		const self = this
		const endpointPath = 'submit_raw_tx'
		self.fetch.post(
			self.hostBaseURL + endpointPath, parameters
		).then(function(data) {
			fn(null, data)
		}).catch(function(e) {
			fn(e && e.Error ? e.Error : ""+e);
		});
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
	it("can send", async function()
	{
		const apiClient = new APIClient({ fetch: new Fetch() });
		const target_address = "4L6Gcy9TAHqPVPMnqa5cPtJK25tr7maE7LrJe67vzumiCtWwjDBvYnHZr18wFexJpih71Mxsjv8b7EpQftpB9NjPaRYYBm62jmF59EWcj6"
		const is_sweeping = false;
		const entered_amount = "0.0002";
		var sending_amount; // possibly need this ; here for the JS parser
		if (is_sweeping) {
			sending_amount = "0"
		} else {
			try {
				sending_amount = (mymonero_core_js.monero_amount_format_utils.parseMoney(entered_amount)).toString();
			} catch (e) {
				throw new Error(`Couldn't parse amount ${amount}: ${e}`)
			}
		}
		const simple_priority = 1;
		const from_address = "43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg";
		const sec_viewKey_string = "7bea1907940afdd480eff7c4bcadb478a0fbb626df9e3ed74ae801e18f53e104";
		const sec_spendKey_string = "4e6d43cd03812b803c6f3206689f5fcc910005fc7e91d50d79b0776dbefcd803";
		const pub_spendKey_string = "3eb884d3440d71326e27cc07a861b873e72abd339feb654660c36a008a0028b3";
		const payment_id = null; 
		var coreBridge_instance;
		try {
			coreBridge_instance = await require('../monero_utils/MyMoneroCoreBridge')({ asmjs: undefined/*allow it to detect*/ });
		} catch (e) {
			console.error(e);
			return;
		}
		coreBridge_instance.async__send_funds({
			is_sweeping: is_sweeping, 
			payment_id_string: payment_id, // may be nil or undefined
			sending_amount: is_sweeping ? 0 : sending_amount, // sending amount
			from_address_string: from_address,
			sec_viewKey_string: sec_viewKey_string,
			sec_spendKey_string: sec_spendKey_string,
			pub_spendKey_string: pub_spendKey_string,
			to_address_string: target_address,
			priority: simple_priority,
			unlock_time: 0, // unlock_time 
			nettype: mymonero_core_js.nettype_utils.network_type.MAINNET,
			//
			get_unspent_outs_fn: function(req_params, cb)
			{
				apiClient.UnspentOuts(req_params, function(err_msg, res)
				{
					cb(err_msg, res);
				});
			},
			get_random_outs_fn: function(req_params, cb)
			{
				apiClient.RandomOuts(req_params, function(err_msg, res)
				{
					cb(err_msg, res);
				});
			},
			submit_raw_tx_fn: function(req_params, cb)
			{
				apiClient.SubmitRawTx(req_params, function(err_msg, res)
				{
					cb(err_msg, res);
				});
			},
			//
			status_update_fn: function(params)
			{
				console.log("> Send funds step " + params.code + ": " + mymonero_core_js.monero_sendingFunds_utils.SendFunds_ProcessStep_MessageSuffix[params.code])
			},
			error_fn: function(params)
			{
				console.log("Error occurred.... ", params.err_msg)
				throw new Error("SendFunds err:" + params.err_msg) 
				// TODO: how to assert err msg not nil? didn't work
				assert.equal(true, false)
			},
			success_fn: function(params)
			{
				assert.equal(params.mixin, 10);
				assert.equal(params.total_sent, "266009466")
				assert.equal(params.final_payment_id, "d2f602b240fbe624")
				console.log("Sendfunds success")
				console.log("sentAmount", params.total_sent)
				console.log("final__payment_id", params.final_payment_id)
				console.log("tx_hash", params.tx_hash)
				console.log("tx_fee", params.used_fee)
				console.log("tx_key", params.tx_key)
				console.log("tx_hash", params.tx_hash)
				console.log("tx_pub_key", params.tx_pub_key)
			}
		});
	});
});
