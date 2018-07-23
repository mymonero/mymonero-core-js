import { RingMember, SecretCommitment } from "xmr-types";
import { ge_sub, ge_add, sc_sub } from "xmr-crypto-ops/primitive_ops";
import { identity } from "xmr-crypto-ops/constants";

import { MGSig } from "./types";
import { MLSAG_Gen, MLSAG_ver } from "./mlsag";

//Ring-ct MG sigs
//Prove:
//   c.f. http://eprint.iacr.org/2015/1098 section 4. definition 10.
//   This does the MG sig on the "dest" part of the given key matrix, and
//   the last row is the sum of input commitments from that column - sum output commitments
//   this shows that sum inputs = sum outputs
//Ver:
//   verifies the above sig is created corretly
export function proveRctMG(
	message: string,
	pubs: RingMember[],
	inSk: SecretCommitment,
	kimg: string,
	mask: string,
	Cout: string,
	index: number,
) {
	const cols = pubs.length;
	if (cols < 3) {
		throw Error("cols must be > 2 (mixin)");
	}

	const PK: string[][] = [];
	//fill pubkey matrix (copy destination, subtract commitments)
	for (let i = 0; i < cols; i++) {
		PK[i] = [];
		PK[i][0] = pubs[i].dest;
		PK[i][1] = ge_sub(pubs[i].mask, Cout);
	}

	const xx = [inSk.x, sc_sub(inSk.a, mask)];
	return MLSAG_Gen(message, PK, xx, kimg, index);
}

//Ring-ct MG sigs
//Prove:
//   c.f. http://eprint.iacr.org/2015/1098 section 4. definition 10.
//   This does the MG sig on the "dest" part of the given key matrix, and
//   the last row is the sum of input commitments from that column - sum output commitments
//   this shows that sum inputs = sum outputs
//Ver:
//   verifies the above sig is created corretly

export function verRctMG(
	mg: MGSig,
	pubs: RingMember[][],
	outPk: string[],
	txnFeeKey: string,
	message: string,
	kimg: string,
) {
	const cols = pubs.length;
	if (cols < 1) {
		throw Error("Empty pubs");
	}
	const rows = pubs[0].length;

	if (rows < 1) {
		throw Error("Empty pubs");
	}

	for (let i = 0; i < cols; ++i) {
		if (pubs[i].length !== rows) {
			throw Error("Pubs is not rectangular");
		}
	}

	// key matrix of (cols, tmp)

	let M: string[][] = [];
	console.log(pubs);
	//create the matrix to mg sig
	for (let i = 0; i < rows; i++) {
		M[i] = [];
		M[i][0] = pubs[0][i].dest;
		M[i][1] = ge_add(M[i][1] || identity(), pubs[0][i].mask); // start with input commitment
		for (let j = 0; j < outPk.length; j++) {
			M[i][1] = ge_sub(M[i][1], outPk[j]); // subtract all output commitments
		}
		M[i][1] = ge_sub(M[i][1], txnFeeKey); // subtract txnfee
	}

	console.log(
		`[MLSAG_ver input]`,
		JSON.stringify({ message, M, mg, kimg }, null, 1),
	);
	return MLSAG_ver(message, M, mg, kimg);
}

// simple version, assuming only post Rct

export function verRctMGSimple(
	message: string,
	mg: MGSig,
	pubs: RingMember[],
	C: string,
	kimg: string,
) {
	try {
		const M: string[][] = pubs.map(pub => [pub.dest, ge_sub(pub.mask, C)]);

		return MLSAG_ver(message, M, mg, kimg);
	} catch (error) {
		console.error("[verRctSimple]", error);
		return false;
	}
}
