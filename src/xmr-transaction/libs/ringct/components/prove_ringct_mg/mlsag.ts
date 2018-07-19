import { array_hash_to_scalar } from "xmr-crypto-ops/hash_ops";
import {
	ge_double_scalarmult_base_vartime,
	ge_double_scalarmult_postcomp_vartime,
	sc_sub,
	sc_mulsub,
	ge_scalarmult_base,
} from "xmr-crypto-ops/primitive_ops";
import { random_scalar } from "xmr-rand";
import { generate_key_image_2 } from "xmr-crypto-ops/key_image";
import { MGSig } from "./types";

// Gen creates a signature which proves that for some column in the keymatrix "pk"
//	 the signer knows a secret key for each row in that column
// we presently only support matrices of 2 rows (pubkey, commitment)
// this is a simplied MLSAG_Gen function to reflect that
// because we don't want to force same secret column for all inputs

export function MLSAG_Gen(
	message: string,
	pk: string[][],
	xx: string[],
	kimg: string,
	index: number,
) {
	const cols = pk.length; //ring size
	let i;

	// secret index
	if (index >= cols) {
		throw Error("index out of range");
	}
	const rows = pk[0].length; //number of signature rows (always 2)
	// [pub, com] = 2
	if (rows !== 2) {
		throw Error("wrong row count");
	}
	// check all are len 2
	for (i = 0; i < cols; i++) {
		if (pk[i].length !== rows) {
			throw Error("pk is not rectangular");
		}
	}
	if (xx.length !== rows) {
		throw Error("bad xx size");
	}

	let c_old = "";
	const alpha = [];

	const rv: MGSig = {
		ss: [],
		cc: "",
	};
	for (i = 0; i < cols; i++) {
		rv.ss[i] = [];
	}
	const toHash = []; //holds 6 elements: message, pubkey, dsRow L, dsRow R, commitment, ndsRow L
	toHash[0] = message;

	//secret index (pubkey section)

	alpha[0] = random_scalar(); //need to save alphas for later
	toHash[1] = pk[index][0]; //secret index pubkey

	// this is the keyimg anyway  const H1 = hashToPoint(pk[index][0]) // Hp(K_in)
	//  rv.II[0] = ge_scalarmult(H1, xx[0]) // k_in.Hp(K_in)

	toHash[2] = ge_scalarmult_base(alpha[0]); //dsRow L, a.G
	toHash[3] = generate_key_image_2(pk[index][0], alpha[0]); //dsRow R (key image check)
	//secret index (commitment section)
	alpha[1] = random_scalar();
	toHash[4] = pk[index][1]; //secret index commitment
	toHash[5] = ge_scalarmult_base(alpha[1]); //ndsRow L

	c_old = array_hash_to_scalar(toHash);

	i = (index + 1) % cols;
	if (i === 0) {
		rv.cc = c_old;
	}
	while (i != index) {
		rv.ss[i][0] = random_scalar(); //dsRow ss
		rv.ss[i][1] = random_scalar(); //ndsRow ss

		//!secret index (pubkey section)
		toHash[1] = pk[i][0];
		toHash[2] = ge_double_scalarmult_base_vartime(
			c_old,
			pk[i][0],
			rv.ss[i][0],
		);
		toHash[3] = ge_double_scalarmult_postcomp_vartime(
			rv.ss[i][0],
			pk[i][0],
			c_old,
			kimg,
		);
		//!secret index (commitment section)
		toHash[4] = pk[i][1];
		toHash[5] = ge_double_scalarmult_base_vartime(
			c_old,
			pk[i][1],
			rv.ss[i][1],
		);
		c_old = array_hash_to_scalar(toHash); //hash to get next column c
		i = (i + 1) % cols;
		if (i === 0) {
			rv.cc = c_old;
		}
	}
	for (i = 0; i < rows; i++) {
		rv.ss[index][i] = sc_mulsub(c_old, xx[i], alpha[i]);
	}
	return rv;
}

export function MLSAG_ver(
	message: string,
	pk: string[][],
	rv: MGSig,
	kimg: string,
) {
	// we assume that col, row, rectangular checks are already done correctly
	// in MLSAG_gen
	const cols = pk.length;
	let c_old = rv.cc;
	let i = 0;
	let toHash = [];
	toHash[0] = message;
	while (i < cols) {
		//!secret index (pubkey section)
		toHash[1] = pk[i][0];
		toHash[2] = ge_double_scalarmult_base_vartime(
			c_old,
			pk[i][0],
			rv.ss[i][0],
		);
		toHash[3] = ge_double_scalarmult_postcomp_vartime(
			rv.ss[i][0],
			pk[i][0],
			c_old,
			kimg,
		);

		//!secret index (commitment section)
		toHash[4] = pk[i][1];
		toHash[5] = ge_double_scalarmult_base_vartime(
			c_old,
			pk[i][1],
			rv.ss[i][1],
		);

		c_old = array_hash_to_scalar(toHash);

		i = i + 1;
	}

	const c = sc_sub(c_old, rv.cc);
	console.log(`[MLSAG_ver]
		c_old: ${c_old} 
		rc.cc: ${rv.cc}
		c: ${c}`);

	return Number(c) === 0;
}
