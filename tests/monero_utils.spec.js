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
// const assert = require("assert");

var public_key =
	"904e49462268d771cc1649084c35aa1296bfb214880fe2e7f373620a3e2ba597";
var private_key =
	"52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d";

var nettype = mymonero.nettype_utils.network_type.MAINNET;

describe("cryptonote_utils tests", function() {

	it("decode mainnet primary address", function() {
		async function test() {
			var decoded = (await mymonero.monero_utils_promise).decode_address(
				"49qwWM9y7j1fvaBK684Y5sMbN8MZ3XwDLcSaqcKwjh5W9kn9qFigPBNBwzdq6TCAm2gKxQWrdZuEZQBMjQodi9cNRHuCbTr",
				nettype,
			);
			var expected = {
				spend:
					"d8f1e81ecbe25ce8b596d426fb02fe7b1d4bb8d14c06b3d3e371a60eeea99534",
				view:
					"576f0e61e250d941746ed147f602b5eb1ea250ca385b028a935e166e18f74bd7",
			};
			assert.deepEqual(decoded, expected);
		}
		test()
	});

	it("decode mainnet integrated address", function() {
		async function test() {
			var decoded = (await mymonero.monero_utils_promise).decode_address(
				"4KYcX9yTizXfvaBK684Y5sMbN8MZ3XwDLcSaqcKwjh5W9kn9qFigPBNBwzdq6TCAm2gKxQWrdZuEZQBMjQodi9cNd3mZpgrjXBKMx9ee7c",
				nettype,
			);
			var expected = {
				spend:
					"d8f1e81ecbe25ce8b596d426fb02fe7b1d4bb8d14c06b3d3e371a60eeea99534",
				view:
					"576f0e61e250d941746ed147f602b5eb1ea250ca385b028a935e166e18f74bd7",
				intPaymentId: "83eab71fbee84eb9",
			};
			assert.deepEqual(decoded, expected);
		}
		test()
	});
});
