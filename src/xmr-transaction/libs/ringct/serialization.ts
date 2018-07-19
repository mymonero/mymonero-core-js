import { encode_varint } from "xmr-varint";
import { serializeTxHeader } from "../utils";
import { cn_fast_hash } from "xmr-fast-hash";
import { serialize_range_proofs } from "./components/prove_range";
import { RCTSignatures } from "./types";
import { SignedTransaction } from "xmr-types";

export function serialize_rct_tx_with_hash(tx: SignedTransaction) {
	if (!tx.rct_signatures) {
		throw Error("This transaction does not contain rct_signatures");
	}

	let hashes = "";
	let buf = "";
	buf += serializeTxHeader(tx);
	hashes += cn_fast_hash(buf);
	const buf2 = serialize_rct_base(tx.rct_signatures);
	hashes += cn_fast_hash(buf2);
	buf += buf2;
	let buf3 = serialize_range_proofs(tx.rct_signatures);
	//add MGs
	for (let i = 0; i < tx.rct_signatures.p.MGs.length; i++) {
		for (let j = 0; j < tx.rct_signatures.p.MGs[i].ss.length; j++) {
			buf3 += tx.rct_signatures.p.MGs[i].ss[j][0];
			buf3 += tx.rct_signatures.p.MGs[i].ss[j][1];
		}
		buf3 += tx.rct_signatures.p.MGs[i].cc;
	}
	hashes += cn_fast_hash(buf3);
	buf += buf3;
	const hash = cn_fast_hash(hashes);
	return {
		raw: buf,
		hash: hash,
	};
}

export function serialize_rct_base(rv: RCTSignatures) {
	let buf = "";
	buf += encode_varint(rv.type);
	buf += encode_varint(rv.txnFee);
	if (rv.type === 2) {
		for (let i = 0; i < rv.pseudoOuts.length; i++) {
			buf += rv.pseudoOuts[i];
		}
	}
	if (rv.ecdhInfo.length !== rv.outPk.length) {
		throw Error("mismatched outPk/ecdhInfo!");
	}
	for (let i = 0; i < rv.ecdhInfo.length; i++) {
		buf += rv.ecdhInfo[i].mask;
		buf += rv.ecdhInfo[i].amount;
	}
	for (let i = 0; i < rv.outPk.length; i++) {
		buf += rv.outPk[i];
	}
	return buf;
}
