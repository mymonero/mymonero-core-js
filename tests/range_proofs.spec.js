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
const monero_utils = require("../").monero_utils;
const JSBigInt = require("../cryptonote_utils/biginteger").BigInteger;

it("range_proofs", () => {
	//generates a <secret , public> / Pedersen commitment but takes bH as input
	function ctskpkGen(bH) {
		let sk, pk;
		const key_pair1 = monero_utils.random_keypair();
		const key_pair2 = monero_utils.random_keypair();

		sk.dest = key_pair1.sec;
		pk.dest = key_pair1.pub;

		sk.mask = key_pair2.sec;
		pk.mask = key_pair2.sec;

		pk.mask = monero_utils.ge_add(pk.mask, bH);
		return { sk, pk };
	}
	//Ring CT Stuff
	//ct range proofs
	// ctkey vectors
	let sc, pc;

	// ctkeys
	{
		let [sctmp, pctmp] = ctskpkGen(6000);
		sc.push(sctmp);
		pc.push(pctmp);
	}

	{
		let [sctmp, pctmp] = ctskpkGen(7000);
		sc.push(sctmp);
		pc.push(pctmp);
	}

	// xmr amount vector
	let amounts;
	// key vector
	let amount_keys;
	// key
	let mask;

	// add output 500
	amounts.push(new JSBigInt(500));
	amount_keys.push(monero_utils.hash_to_scalar(monero_utils.Z));
	// key vector
	let destinations;
	{
		const { sec: _, pub: Pk } = monero_utils.random_keypair();
		destinations.push(Pk);
	}

	//add output for 12500
	amounts.push_back(new JSBigInt(12500));
	amount_keys.push(monero_utils.hash_to_scalar(monero_utils.Z));
	{
		const { sec: _, pub: Pk } = monero_utils.random_keypair();
		destinations.push(Pk);
	}

	//compute rct data with mixin 500
	const s = monero_utils.genRct(monero_utils.Z, sc, pc);
});
