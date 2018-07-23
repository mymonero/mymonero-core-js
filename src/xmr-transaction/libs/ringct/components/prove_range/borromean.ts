import { BorromeanSignature } from "./types";
import { random_scalar } from "xmr-rand";
import {
	ge_scalarmult_base,
	ge_double_scalarmult_base_vartime,
	sc_mulsub,
} from "xmr-crypto-ops/primitive_ops";
import { hash_to_scalar, array_hash_to_scalar } from "xmr-crypto-ops/hash_ops";

//xv: vector of secret keys, 1 per ring (nrings)
//pm: matrix of pubkeys, indexed by size first
//iv: vector of indexes, 1 per ring (nrings), can be a string
//size: ring size, default 2
//nrings: number of rings, default 64
//extensible borromean signatures

export function genBorromean(
	xv: string[],
	pm: string[][],
	iv: string[] | string,
	nrings: number,
) {
	if (xv.length !== nrings) {
		throw Error("wrong xv length " + xv.length);
	}
	if (pm.length !== 2) {
		throw Error("wrong pm size " + pm.length);
	}
	for (let i = 0; i < pm.length; i++) {
		if (pm[i].length !== nrings) {
			throw Error("wrong pm[" + i + "] length " + pm[i].length);
		}
	}
	if (iv.length !== nrings) {
		throw Error("wrong iv length " + iv.length);
	}
	for (let i = 0; i < iv.length; i++) {
		if (+iv[i] >= 2) {
			throw Error("bad indices value at: " + i + ": " + iv[i]);
		}
	}
	//signature struct
	// in the case of size 2 and nrings 64
	// bb.s = [[64], [64]]

	const bb: BorromeanSignature = {
		s: [[], []],
		ee: "",
	};
	//signature pubkey matrix
	const L: string[][] = [[], []];

	//compute starting at the secret index to the last row
	let index;
	const alpha = [];
	for (let i = 0; i < nrings; i++) {
		index = parseInt(iv[i]);
		alpha[i] = random_scalar();
		L[index][i] = ge_scalarmult_base(alpha[i]);
		if (index === 0) {
			bb.s[1][i] = random_scalar();
			const c = hash_to_scalar(L[index][i]);
			L[1][i] = ge_double_scalarmult_base_vartime(
				c,
				pm[1][i],
				bb.s[1][i],
			);
		}
	}

	//hash last row to create ee
	let ltemp = "";
	for (let i = 0; i < nrings; i++) {
		ltemp += L[1][i];
	}
	bb.ee = hash_to_scalar(ltemp);
	//compute the rest from 0 to secret index

	for (let i = 0; i < nrings; i++) {
		let cc = bb.ee;
		if (+iv[i] === 1) {
			bb.s[0][i] = random_scalar();
			const LL = ge_double_scalarmult_base_vartime(
				cc,
				pm[0][i],
				bb.s[0][i],
			);
			cc = hash_to_scalar(LL);
			bb.s[1][i] = sc_mulsub(xv[i], cc, alpha[i]);
		} else {
			bb.s[0][i] = sc_mulsub(xv[i], cc, alpha[i]);
		}
	}
	return bb;
}

export function verifyBorromean(
	bb: BorromeanSignature,
	P1: string[],
	P2: string[],
) {
	let Lv1 = [];
	let chash;
	let LL;

	let p2 = "";
	for (let ii = 0; ii < 64; ii++) {
		p2 = ge_double_scalarmult_base_vartime(bb.ee, P1[ii], bb.s[0][ii]);
		LL = p2;
		chash = hash_to_scalar(LL);

		p2 = ge_double_scalarmult_base_vartime(chash, P2[ii], bb.s[1][ii]);
		Lv1[ii] = p2;
	}
	const eeComputed = array_hash_to_scalar(Lv1);
	const equalKeys = eeComputed === bb.ee;
	console.log(`[verifyBorromean] Keys equal? ${equalKeys}
		${eeComputed}
		${bb.ee}`);

	return equalKeys;
}
