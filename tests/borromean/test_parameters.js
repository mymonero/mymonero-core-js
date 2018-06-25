const mnemonic = require("../../cryptonote_utils/mnemonic");
const monero_utils = require("../../").monero_utils;

function randomBit() {
	// get random 32 bits in hex
	const rand32bits = mnemonic.mn_random(32);
	// take 4 bits "nibble" and convert to binary
	// then take last index
	return monero_utils.padLeft(
		parseInt(rand32bits[0], 16).toString(2),
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
