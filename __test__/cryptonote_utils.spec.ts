import { valid_hex } from "xmr-str-utils/hex-strings";
import { NetType } from "xmr-types";
import { cn_fast_hash } from "xmr-fast-hash";
import {
	generate_key_derivation,
	derivation_to_scalar,
	derive_public_key,
	derive_subaddress_public_key,
} from "xmr-crypto-ops/derivation";
import { decode_address } from "xmr-address-utils";
import { hash_to_scalar } from "xmr-crypto-ops/hash_ops";

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

const public_key =
	"904e49462268d771cc1649084c35aa1296bfb214880fe2e7f373620a3e2ba597";
const private_key =
	"52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d";

const nettype = NetType.MAINNET;

describe("cryptonote_utils tests", function() {
	it("is valid hex", function() {
		const valid = valid_hex(private_key);
		expect(valid).toEqual(true);
	});

	it("fast hash / keccak-256", function() {
		const hash = cn_fast_hash(private_key);
		expect(hash).toEqual(
			"64997ff54f0d82ee87d51e971a0329d4315481eaeb4ad2403c65d5843480c414",
		);
	});

	it("generate key derivation", function() {
		const derivation = generate_key_derivation(public_key, private_key);
		expect(derivation).toEqual(
			"591c749f1868c58f37ec3d2a9d2f08e7f98417ac4f8131e3a57c1fd71273ad00",
		);
	});

	it("decode mainnet primary address", function() {
		const decoded = decode_address(
			"49qwWM9y7j1fvaBK684Y5sMbN8MZ3XwDLcSaqcKwjh5W9kn9qFigPBNBwzdq6TCAm2gKxQWrdZuEZQBMjQodi9cNRHuCbTr",
			nettype,
		);
		const expected = {
			spend:
				"d8f1e81ecbe25ce8b596d426fb02fe7b1d4bb8d14c06b3d3e371a60eeea99534",
			view:
				"576f0e61e250d941746ed147f602b5eb1ea250ca385b028a935e166e18f74bd7",
		};
		expect(decoded).toEqual(expected);
	});

	it("decode mainnet integrated address", function() {
		const decoded = decode_address(
			"4KYcX9yTizXfvaBK684Y5sMbN8MZ3XwDLcSaqcKwjh5W9kn9qFigPBNBwzdq6TCAm2gKxQWrdZuEZQBMjQodi9cNd3mZpgrjXBKMx9ee7c",
			nettype,
		);
		const expected = {
			spend:
				"d8f1e81ecbe25ce8b596d426fb02fe7b1d4bb8d14c06b3d3e371a60eeea99534",
			view:
				"576f0e61e250d941746ed147f602b5eb1ea250ca385b028a935e166e18f74bd7",
			intPaymentId: "83eab71fbee84eb9",
		};
		expect(decoded).toEqual(expected);
	});

	it("hash_to_scalar", function() {
		const scalar = hash_to_scalar(private_key);
		expect(scalar).toEqual(
			"77c5899835aa6f96b13827f43b094abf315481eaeb4ad2403c65d5843480c404",
		);
	});

	it("derivation_to_scalar", function() {
		const derivation = generate_key_derivation(public_key, private_key);
		const scalar = derivation_to_scalar(derivation, 1);
		expect(scalar).toEqual(
			"201ce3c258e09eeb6132ec266d24ee1ca957828f384ce052d5bc217c2c55160d",
		);
	});

	it("derive public key", function() {
		const derivation = generate_key_derivation(public_key, private_key);
		const output_key = derive_public_key(derivation, 1, public_key);
		expect(output_key).toEqual(
			"da26518ddb54cde24ccfc59f36df13bbe9bdfcb4ef1b223d9ab7bef0a50c8be3",
		);
	});

	it("derive subaddress public key", function() {
		const derivation = generate_key_derivation(public_key, private_key);
		const subaddress_public_key = derive_subaddress_public_key(
			public_key,
			derivation,
			1,
		);
		expect(subaddress_public_key).toEqual(
			"dfc9e4a0039e913204c1c0f78e954a7ec7ce291d8ffe88265632f0da9d8de1be",
		);
	});
});
