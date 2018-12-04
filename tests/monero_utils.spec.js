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
const mymonero = require("../");
const assert = require("assert");

var public_key =
	"904e49462268d771cc1649084c35aa1296bfb214880fe2e7f373620a3e2ba597";
var private_key =
	"52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d";

var nettype = mymonero.nettype_utils.network_type.MAINNET;

describe("cryptonote_utils tests", function() {

	it("create_address aka address_and_keys_from_seed", async function() {
		const monero_utils = await require("../monero_utils/MyMoneroCoreBridge")({})
		var decoded = monero_utils.address_and_keys_from_seed("9c973aa296b79bbf452781dd3d32ad7f", nettype);
		assert.equal(
			decoded.address_string,
			"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg",
		);
	});

	it("decode mainnet primary address", async function() {
		const monero_utils = await require("../monero_utils/MyMoneroCoreBridge")({})
		var decoded = monero_utils.decode_address(
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
		const monero_utils = await require("../monero_utils/MyMoneroCoreBridge")({})
		var decoded = monero_utils.decode_address(
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

	// not implemented
	// it("hash_to_scalar", async function() {
	// 	const monero_utils = await require("../monero_utils/MyMoneroCoreBridge")({})
	// 	var scalar = monero_utils.hash_to_scalar(private_key);
	// 	assert.equal(
	// 		scalar,
	// 		"77c5899835aa6f96b13827f43b094abf315481eaeb4ad2403c65d5843480c404",
	// 	);
	// });

	it("generate key derivation", async function() {
		const monero_utils = await require("../monero_utils/MyMoneroCoreBridge")({})
		var derivation = monero_utils.generate_key_derivation(
			public_key,
			private_key,
		);
		assert.equal(
			derivation,
			"591c749f1868c58f37ec3d2a9d2f08e7f98417ac4f8131e3a57c1fd71273ad00",
		);
	});

	it("derive public key", async function() {
		const monero_utils = await require("../monero_utils/MyMoneroCoreBridge")({})
		var derivation = monero_utils.generate_key_derivation(
			public_key,
			private_key,
		);
		var output_key = monero_utils.derive_public_key(
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
		const monero_utils = await require("../monero_utils/MyMoneroCoreBridge")({})
		var derivation = monero_utils.generate_key_derivation(
			public_key,
			private_key,
		);
		var subaddress_public_key = monero_utils.derive_subaddress_public_key(
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
		const monero_utils = await require("../monero_utils/MyMoneroCoreBridge")({})
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
		var ret = monero_utils.decodeRct(rv, sk, i);
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
