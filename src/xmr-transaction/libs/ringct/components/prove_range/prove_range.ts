import { BigInt } from "biginteger";
import { genBorromean, verifyBorromean } from "./borromean";
import { CommitMask, RangeSignature } from "./types";
import { identity, H2, Z, I } from "xmr-crypto-ops/constants";
import {
	ge_sub,
	ge_add,
	sc_add,
	ge_scalarmult_base,
} from "xmr-crypto-ops/primitive_ops";
import { random_scalar } from "xmr-rand";
import { d2b } from "xmr-str-utils/integer-strings";

//proveRange
//proveRange gives C, and mask such that \sumCi = C
//	 c.f. http://eprint.iacr.org/2015/1098 section 5.1
//	 and Ci is a commitment to either 0 or s^i, i=0,...,n
//	 thus this proves that "amount" is in [0, s^n] (we assume s to be 4) (2 for now with v2 txes)
//	 mask is a such that C = aG + bH, and b = amount
//commitMaskObj = {C: commit, mask: mask}

export function proveRange(
	commitMaskObj: CommitMask,
	amount: string | BigInt,
	nrings: number,
) {
	const size = 2;
	let C = I; //identity
	let mask = Z; //zero scalar
	const indices = d2b(amount); //base 2 for now
	const Ci: string[] = [];

	const ai: string[] = [];
	const PM: string[][] = [];
	for (let i = 0; i < size; i++) {
		PM[i] = [];
	}
	let j;
	//start at index and fill PM left and right -- PM[0] holds Ci
	for (let i = 0; i < nrings; i++) {
		ai[i] = random_scalar();

		j = +indices[i];
		PM[j][i] = ge_scalarmult_base(ai[i]);
		while (j > 0) {
			j--;
			PM[j][i] = ge_add(PM[j + 1][i], H2[i]); //will need to use i*2 for base 4 (or different object)
		}

		j = +indices[i];
		while (j < size - 1) {
			j++;
			PM[j][i] = ge_sub(PM[j - 1][i], H2[i]); //will need to use i*2 for base 4 (or different object)
		}
		mask = sc_add(mask, ai[i]);
	}
	/*
		* some more payload stuff here
		*/
	//copy commitments to sig and sum them to commitment
	for (let i = 0; i < nrings; i++) {
		//if (i < nrings - 1) //for later version
		Ci[i] = PM[0][i];
		C = ge_add(C, PM[0][i]);
	}

	const sig: RangeSignature = {
		Ci,
		bsig: genBorromean(ai, PM, indices, size, nrings),
	};
	//exp: exponent //doesn't exist for now

	commitMaskObj.C = C;
	commitMaskObj.mask = mask;
	return sig;
}

//proveRange and verRange
//proveRange gives C, and mask such that \sumCi = C
//   c.f. http://eprint.iacr.org/2015/1098 section 5.1
//   and Ci is a commitment to either 0 or 2^i, i=0,...,63
//   thus this proves that "amount" is in [0, 2^64]
//   mask is a such that C = aG + bH, and b = amount
//verRange verifies that \sum Ci = C and that each Ci is a commitment to 0 or 2^i

export function verRange(C: string, as: RangeSignature, nrings = 64) {
	try {
		let CiH = []; // len 64
		let asCi = []; // len 64
		let Ctmp = identity();
		for (let i = 0; i < nrings; i++) {
			CiH[i] = ge_sub(as.Ci[i], H2[i]);
			asCi[i] = as.Ci[i];
			Ctmp = ge_add(Ctmp, as.Ci[i]);
		}
		const equalKeys = Ctmp === C;
		console.log(`[verRange] Equal keys? ${equalKeys} 
			C: ${C}
			Ctmp: ${Ctmp}`);
		if (!equalKeys) {
			return false;
		}

		if (!verifyBorromean(as.bsig, asCi, CiH)) {
			return false;
		}

		return true;
	} catch (e) {
		console.error(`[verRange]`, e);
		return false;
	}
}
