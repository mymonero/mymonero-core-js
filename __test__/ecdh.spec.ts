import { BigInt } from "biginteger";
import { skGen } from "xmr-key-utils";
import { d2s } from "xmr-str-utils/integer-strings";
import {
	encode_rct_ecdh,
	decode_rct_ecdh,
} from "xmr-transaction/libs/ringct/components/ecdh";

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

it("ecdh_roundtrip", () => {
	const test_amounts = [
		new BigInt(1),
		new BigInt(1),
		new BigInt(2),
		new BigInt(3),
		new BigInt(4),
		new BigInt(5),
		new BigInt(10000),

		new BigInt("10000000000000000000"),
		new BigInt("10203040506070809000"),

		new BigInt("123456789123456789"),
	];

	for (const amount of test_amounts) {
		const k = skGen();
		const scalar = skGen(); /*?*/
		const amt = d2s(amount.toString());
		const t0 = {
			mask: scalar,
			amount: amt,
		};

		// both are strings so we can shallow copy
		let t1 = { ...t0 };

		t1 = encode_rct_ecdh(t1, k);

		t1 = decode_rct_ecdh(t1, k);
		expect(t1.mask).toEqual(t0.mask);
		expect(t1.amount).toEqual(t0.amount);
	}
});
