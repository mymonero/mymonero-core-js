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
const {
	ctskpkGen,
	populateFromBlockchain,
	JSBigInt,
	monero_utils,
} = require("./test_utils");

it("range_proofs", () => {
	//Ring CT Stuff
	//ct range proofs
	// ctkey vectors
	let inSk = [],
		inPk = [];

	// ctkeys
	// we test only a single input here since the current impl of
	// MLSAG_gen of type full only supports single inputs
	{
		let [sctmp, pctmp] = ctskpkGen(6001);
		console.log(sctmp, pctmp);
		inSk.push(sctmp);
		inPk.push(pctmp);
		console.log("inPk", inPk);
	}

	// xmr amount vector
	let amounts = [];
	// key vector
	let amount_keys = [];

	amounts.push(new JSBigInt(1000));
	amount_keys.push(monero_utils.hash_to_scalar(monero_utils.Z));

	amounts.push(new JSBigInt(4000));
	amount_keys.push(monero_utils.hash_to_scalar(monero_utils.Z));

	amounts.push(new JSBigInt(1000));
	amount_keys.push(monero_utils.hash_to_scalar(monero_utils.Z));

	//compute rct data with mixin 500
	const { index, mixRing } = populateFromBlockchain(inPk, 2);

	// generate kimg
	const kimg = [monero_utils.generate_key_image_2(inPk[0].dest, inSk[0].x)];

	// add fee of 1 NOTE: fee is passed in with its endian not swapped, hence no usage of d2s
	const fee = "1";

	let s = monero_utils.genRct(
		monero_utils.Z,
		inSk,
		kimg,
		[[]],
		amounts,
		mixRing,
		amount_keys,
		[index],
		fee,
	);

	expect(monero_utils.verRct(s, true, mixRing, kimg[0])).toEqual(true);
	expect(monero_utils.verRct(s, false, mixRing, kimg[0])).toEqual(true);

	//decode received amount
	monero_utils.decodeRct(s, amount_keys[1], 1);

	// Ring CT with failing MG sig part should not verify!
	// Since sum of inputs != outputs

	amounts[1] = new JSBigInt(4501);

	s = monero_utils.genRct(
		monero_utils.Z,
		inSk,
		kimg,
		[[]],
		amounts,
		mixRing,
		amount_keys,
		[index],
		fee,
	);

	expect(monero_utils.verRct(s, true, mixRing, kimg[0])).toEqual(true);
	expect(monero_utils.verRct(s, false, mixRing, kimg[0])).toEqual(false);

	//decode received amount
	monero_utils.decodeRct(s, amount_keys[1], 1);
});
