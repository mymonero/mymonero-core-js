import { skGen } from "xmr-key-utils";
import {
	ge_scalarmult_base,
	ge_scalarmult,
} from "xmr-crypto-ops/primitive_ops";
import { identity } from "xmr-crypto-ops/constants";
import { hashToPoint } from "xmr-crypto-ops/hash_ops";
import {
	MLSAG_Gen,
	MLSAG_ver,
} from "xmr-transaction/libs/ringct/components/prove_ringct_mg";

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

it("MG_sigs", () => {
	function skvGen(len: number) {
		const skVec: string[] = [];
		for (let i = 0; i < len; i++) {
			skVec.push(skGen());
		}
		return skVec;
	}
	//initializes a key matrix;
	//first parameter is rows,
	//second is columns
	function keyMInit(cols: number) {
		let rv: string[][] = [];
		for (let i = 0; i < cols; i++) {
			rv.push([]);
		}
		return rv;
	}
	let j = 0;

	//Tests for MG Sigs
	//#MG sig: true one
	let N = 3; // cols
	let R = 2; // rows

	let xm = keyMInit(N); // = [[None]*N] #just used to generate test public keys
	let sk = skvGen(R);

	// [
	// [pubkey1, commitment1],
	// [pubkey2, commitment2],
	// ...
	// [pubkeyn, commitmentn]]
	// // Gen creates a signature which proves that for some column in the keymatrix "pk"
	//  the signer knows a secret key for each row in that column
	let P = keyMInit(N); // = keyM[[None]*N] #stores the public keys;

	let ind = 2;
	let i = 0;

	for (j = 0; j < R; j++) {
		for (i = 0; i < N; i++) {
			xm[i][j] = skGen();
			P[i][j] = ge_scalarmult_base(xm[i][j]); // generate fake [pubkey, commit]
		}
	}

	for (j = 0; j < R; j++) {
		// our secret vector of [onetimesec, z]
		sk[j] = xm[ind][j];
	}

	let message = identity();
	let kimg = ge_scalarmult(hashToPoint(P[ind][0]), sk[0]);
	let rv = MLSAG_Gen(message, P, sk, kimg, ind);
	let c = MLSAG_ver(message, P, rv, kimg);

	expect(c).toEqual(true);

	xm = keyMInit(N); // = [[None]*N] #just used to generate test public keys
	sk = skvGen(R);

	for (j = 0; j < R; j++) {
		for (i = 0; i < N; i++) {
			xm[i][j] = skGen();
			P[i][j] = ge_scalarmult_base(xm[i][j]); // generate fake [pubkey, commit]
		}
	}

	sk[1] = skGen(); //assume we don't know one of the private keys..
	kimg = ge_scalarmult(hashToPoint(P[ind][0]), sk[0]);
	rv = MLSAG_Gen(message, P, sk, kimg, ind);
	c = MLSAG_ver(message, P, rv, kimg);

	expect(c).toEqual(false);
});
