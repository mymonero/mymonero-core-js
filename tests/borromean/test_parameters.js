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
const { randomBytes } = require("crypto");

function randomBit() {
	// get random 8 bits in hex
	const rand8bits = randomBytes(1).toString("hex");
	// take 4 bits "nibble" and convert to binary
	// then take last index
	return monero_utils.padLeft(
		parseInt(rand8bits[0], 16).toString(2),
		4,
		0,
	)[3];
}

//Tests for Borromean signatures
//#boro true one, false one, C != sum Ci, and one out of the range..
const N = 64;
let xv = [], // vector of secret keys, 1 per ring (nrings)
	P1v = [], //key64, arr of commitments Ci
	P2v = [], //key64
	indi = []; // vector of secret indexes, 1 per ring (nrings), can be a string

let indi_2 = [];
let indi_3 = [];
let indi_4 = [];

let generated = false;

function generate_parameters() {
	if (generated) {
		const indiCopy = [...indi];

		return { xv, P1v, P2v, indi: indiCopy, N };
	} else {
		for (let j = 0; j < N; j++) {
			indi[j] = randomBit(); /*?.*/

			xv[j] = monero_utils.skGen(); /*?.*/

			if (+indi[j] === 0) {
				P1v[j] = monero_utils.ge_scalarmult_base(xv[j]); /*?.*/
			} else {
				P1v[j] = monero_utils.ge_scalarmult_base(xv[j]); // calculate aG = xv[j].G /*?.*/
				P1v[j] = monero_utils.ge_add(P1v[j], monero_utils.H2[j]); // calculate aG + H2 /*?.*/
			}

			P2v[j] = monero_utils.ge_sub(P1v[j], monero_utils.H2[j]); /*?.*/
		}
		generated = true;
		return { xv, P1v, P2v, indi, N };
	}
}

module.exports = { generate_parameters };
