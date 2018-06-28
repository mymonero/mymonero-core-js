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
const monero_utils = require("../../").monero_utils;
const JSBigInt = require("../../cryptonote_utils/biginteger").BigInteger;
const { randomBytes } = require("crypto");

//generates a <secret , public> / Pedersen commitment to the amount
function ctskpkGen(amount) {
	let sk = {},
		pk = {};
	const key_pair1 = monero_utils.random_keypair();
	const key_pair2 = monero_utils.random_keypair();

	sk.x = key_pair1.sec;
	pk.dest = key_pair1.pub;

	sk.a = key_pair2.sec;
	pk.mask = key_pair2.pub;
	const am = monero_utils.d2s(amount.toString());
	const bH = monero_utils.ge_scalarmult(monero_utils.H, am);

	pk.mask = monero_utils.ge_add(pk.mask, bH);

	return [sk, pk];
}

function randomNum(upperLimit) {
	return parseInt(randomBytes(1).toString("hex"), 16) % upperLimit;
}

//These functions get keys from blockchain
//replace these when connecting blockchain
//getKeyFromBlockchain grabs a key from the blockchain at "reference_index" to mix with
function getKeyFromBlockchain(reference_index) {
	let a = {};
	a.dest = monero_utils.random_keypair().pub;
	a.mask = monero_utils.random_keypair().pub;
	return a;
}

//	populateFromBlockchain creates a keymatrix with "mixin" + 1 columns and one of the columns is inPk
//  the return values are the key matrix, and the index where inPk was put (random).
function populateFromBlockchain(inPk, mixin) {
	const rows = inPk.length;
	const inPkCpy = [...inPk];
	// ctkeyMatrix
	const mixRing = [];
	const index = randomNum(mixin);

	for (let i = 0; i < rows; i++) {
		mixRing[i] = [];
		for (let j = 0; j <= mixin; j++) {
			if (j !== index) {
				mixRing[i][j] = getKeyFromBlockchain(index); /*?*/
			} else {
				mixRing[i][j] = inPkCpy.pop();
			}
		}
	}

	return { mixRing, index };
}

function populateFromBlockchainSimple(inPk, mixin) {
	const index = randomNum(mixin);
	const mixRing = [];

	for (let i = 0; i <= mixin; i++) {
		if (i !== index) {
			mixRing[i] = getKeyFromBlockchain(index);
		} else {
			mixRing[i] = inPk;
		}
	}

	return { mixRing, index };
}

module.exports = {
	ctskpkGen,
	populateFromBlockchain,
	populateFromBlockchainSimple,
	getKeyFromBlockchain,
	monero_utils,
	JSBigInt,
};
