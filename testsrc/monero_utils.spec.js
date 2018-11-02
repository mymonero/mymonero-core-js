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
const { mymonero_core_js } = require("../");
const mymonero = mymonero_core_js
const assert = require("assert");

var public_key =
	"904e49462268d771cc1649084c35aa1296bfb214880fe2e7f373620a3e2ba597";
var private_key =
	"52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d";

var nettype = mymonero.nettype_utils.network_type.MAINNET;

describe("cryptonote_utils tests", function() {

	it("create_address aka address_and_keys_from_seed", async function() {
		const monero_utils = await require("../monero_utils/monero_utils")
		var decoded = await monero_utils.address_and_keys_from_seed("9c973aa296b79bbf452781dd3d32ad7f", nettype);
		assert.equal(
			decoded.address_string,
			"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg",
		);
	});

	it("decode mainnet primary address", async function() {
		const monero_utils = await require("../monero_utils/monero_utils")
		var decoded = await monero_utils.decode_address(
			"49qwWM9y7j1fvaBK684Y5sMbN8MZ3XwDLcSaqcKwjh5W9kn9qFigPBNBwzdq6TCAm2gKxQWrdZuEZQBMjQodi9cNRHuCbTr",
			nettype,
		);
		var expected = {
			isSubaddress: false,
			intPaymentId: undefined,
			spend:
				"d8f1e81ecbe25ce8b596d426fb02fe7b1d4bb8d14c06b3d3e371a60eeea99534",
			view:
				"576f0e61e250d941746ed147f602b5eb1ea250ca385b028a935e166e18f74bd7",
		};
		assert.deepEqual(decoded, expected);
	});

	it("decode mainnet integrated address", async function() {
		const monero_utils = await require("../monero_utils/monero_utils")
		var decoded = await monero_utils.decode_address(
			"4KYcX9yTizXfvaBK684Y5sMbN8MZ3XwDLcSaqcKwjh5W9kn9qFigPBNBwzdq6TCAm2gKxQWrdZuEZQBMjQodi9cNd3mZpgrjXBKMx9ee7c",
			nettype,
		);
		var expected = {
			spend:
				"d8f1e81ecbe25ce8b596d426fb02fe7b1d4bb8d14c06b3d3e371a60eeea99534",
			view:
				"576f0e61e250d941746ed147f602b5eb1ea250ca385b028a935e166e18f74bd7",
			isSubaddress: false,
			intPaymentId: "83eab71fbee84eb9",
		};
		assert.deepEqual(decoded, expected);
	});

	it("create tx: non-sweep single-output", async function() {
		const monero_utils = await require("../monero_utils/monero_utils")
		const unspent_outputs = [
			{
				"amount":"3000000000",
				"public_key":"41be1978f58cabf69a9bed5b6cb3c8d588621ef9b67602328da42a213ee42271",
				"index":1,
				"global_index":7611174,
				"rct":"86a2c9f1f8e66848cd99bfda7a14d4ac6c3525d06947e21e4e55fe42a368507eb5b234ccdd70beca8b1fc8de4f2ceb1374e0f1fd8810849e7f11316c2cc063060008ffa5ac9827b776993468df21af8c963d12148622354f950cbe1369a92a0c",
				"tx_id":5334971,
				"tx_hash":"9d37c7fdeab91abfd1e7e120f5c49eac17b7ac04a97a0c93b51c172115df21ea",
				"tx_pub_key":"bd703d7f37995cc7071fb4d2929594b5e2a4c27d2b7c68a9064500ca7bc638b8"
			}
		]
		const fee_per_b = "24658"
		const step1_retVals = await monero_utils.send_step1__prepare_params_for_get_decoys(
			false, // sweeping
			"200000000", // sending_amount
			fee_per_b, // fee_per_b,
			1, // priority,
			unspent_outputs,
			null,// optl__payment_id_string, // this may be nil
			null // optl__passedIn_attemptAt_fee
		)
		assert.equal(
			step1_retVals.mixin,
			10,
		);
		assert.equal(
			step1_retVals.using_outs.length,
			1,
		);
		assert.equal(
			step1_retVals.change_amount,
			"2733990534",
		);
		assert.equal(
			step1_retVals.final_total_wo_fee,
			"200000000",
		);
		assert.equal(
			step1_retVals.using_fee,
			"66009466",
		);
		const mix_outs = [
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
		assert.equal(
			mix_outs.length, 
			step1_retVals.using_outs.length
		)
		assert.equal(
			mix_outs[0].outputs.length, 
			step1_retVals.mixin + 1 
		)
		const step2_retVals = await monero_utils.send_step2__try_create_transaction(
			"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg", // from_address_string,
			{ // sec keys
				view: "7bea1907940afdd480eff7c4bcadb478a0fbb626df9e3ed74ae801e18f53e104", 
				spend: "4e6d43cd03812b803c6f3206689f5fcc910005fc7e91d50d79b0776dbefcd803" 
			},
			"4APbcAKxZ2KPVPMnqa5cPtJK25tr7maE7LrJe67vzumiCtWwjDBvYnHZr18wFexJpih71Mxsjv8b7EpQftpB9NjPPXmZxHN", // to_address_string,
			step1_retVals.using_outs, // using_outs,
			mix_outs, // mix_outs,
			step1_retVals.mixin, // fake_outputs_count,
			step1_retVals.final_total_wo_fee, // final sending_amount
			step1_retVals.change_amount, // change_amount,
			step1_retVals.using_fee, // fee_amount,
			null, // payment_id,
			1, // priority,
			fee_per_b, // fee_per_b,
			0, // unlock_time,
			nettype // nettype
		)
		assert.equal(
			step2_retVals.tx_must_be_reconstructed,
			false
		);
		assert.notEqual(
			step2_retVals.signed_serialized_tx,
			null
		);
		assert.notEqual(
			step2_retVals.signed_serialized_tx,
			undefined
		);
	});

	// not implemented
	// it("hash_to_scalar", async function() {
	// 	const monero_utils = await require("../monero_utils/monero_utils")
	// 	var scalar = monero_utils.hash_to_scalar(private_key);
	// 	assert.equal(
	// 		scalar,
	// 		"77c5899835aa6f96b13827f43b094abf315481eaeb4ad2403c65d5843480c404",
	// 	);
	// });

	it("generate key derivation", async function() {
		const monero_utils = await require("../monero_utils/monero_utils")
		var derivation = await monero_utils.generate_key_derivation(
			public_key,
			private_key,
		);
		assert.equal(
			derivation,
			"591c749f1868c58f37ec3d2a9d2f08e7f98417ac4f8131e3a57c1fd71273ad00",
		);
	});

	it("derive public key", async function() {
		const monero_utils = await require("../monero_utils/monero_utils")
		var derivation = await monero_utils.generate_key_derivation(
			public_key,
			private_key,
		);
		var output_key = await monero_utils.derive_public_key(
			derivation,
			1,
			public_key,
		);
		assert.equal(
			output_key,
			"da26518ddb54cde24ccfc59f36df13bbe9bdfcb4ef1b223d9ab7bef0a50c8be3",
		);
	});

	it("derive subaddress public key", async function() {
		const monero_utils = await require("../monero_utils/monero_utils")
		var derivation = await monero_utils.generate_key_derivation(
			public_key,
			private_key,
		);
		var subaddress_public_key = await monero_utils.derive_subaddress_public_key(
			public_key,
			derivation,
			1,
		);
		assert.equal(
			subaddress_public_key,
			"dfc9e4a0039e913204c1c0f78e954a7ec7ce291d8ffe88265632f0da9d8de1be",
		);
	});

	it("decodeRct", async function() {
		const monero_utils = await require("../monero_utils/monero_utils")
		const i = 1;
		const sk = "9b1529acb638f497d05677d7505d354b4ba6bc95484008f6362f93160ef3e503";
		const rv = 
		{
			type: 1,
			ecdhInfo: [
				{
					mask: "3ad9d0b3398691b94558e0f750e07e5e0d7d12411cd70b3841159e6c6b10db02",
					amount: "b3189d8adb5a26568e497eb8e376a7d7d946ebb1daef4c2c87a2c30b65915506"
				},
				{
					mask: "97b00af8ecba3cb71b9660cc9e1ac110abd21a4c5e50a2c125f964caa96bef0c",
					amount:"60269d8adb5a26568e497eb8e376a7d7d946ebb1daef4c2c87a2c30b65915506"
				},
				{
					mask: "db67f5066d9455db404aeaf435ad948bc9f27344bc743e3a32583a9e6695cb08",
					amount: "b3189d8adb5a26568e497eb8e376a7d7d946ebb1daef4c2c87a2c30b65915506"
				}
			],
			outPk: [ // you can also pass an array of strings here but it's better to use the modern format
				{
					mask: "9adc531a9c79a49a4257f24e5e5ea49c2fc1fb4eef49e00d5e5aba6cb6963a7d"
				},
				{
					mask: "89f40499d6786a4027a24d6674d0940146fd12d8bc6007d338f19f05040e7a41"
				},
				{
					mask: "f413d28bd5ffdc020528bcb2c19919d7484fbc9c3dd30de34ecff5b8a904e7f6"
				}
			]
		};
		var ret = await monero_utils.decodeRct(rv, sk, i);
		assert.equal(
			ret.mask,
			"3f59c741c9ad560bfea92f42449a180bc8362f1b5ddd957e3b5772dbaf7f840e",
		);
		assert.equal(
			ret.amount,
			"4501", // TODO: is this correct? 
		);
	});

});
