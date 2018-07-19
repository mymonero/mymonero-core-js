import { serialize_rct_base } from "./serialization";
import { cn_fast_hash } from "xmr-fast-hash";
import { serialize_range_proofs } from "./components/prove_range";
import { RCTSignatures } from "./types";

export function get_pre_mlsag_hash(rv: RCTSignatures) {
	let hashes = "";
	hashes += rv.message;
	hashes += cn_fast_hash(serialize_rct_base(rv));
	const buf = serialize_range_proofs(rv);
	hashes += cn_fast_hash(buf);
	return cn_fast_hash(hashes);
}

export function estimateRctSize(
	inputs: number,
	mixin: number,
	outputs: number,
) {
	let size = 0;
	// tx prefix
	// first few bytes
	size += 1 + 6;
	size += inputs * (1 + 6 + (mixin + 1) * 3 + 32); // original C implementation is *2+32 but author advised to change 2 to 3 as key offsets are variable size and this constitutes a best guess
	// vout
	size += outputs * (6 + 32);
	// extra
	size += 40;
	// rct signatures
	// type
	size += 1;
	// rangeSigs
	size += (2 * 64 * 32 + 32 + 64 * 32) * outputs;
	// MGs
	size += inputs * (32 * (mixin + 1) + 32);
	// mixRing - not serialized, can be reconstructed
	/* size += 2 * 32 * (mixin+1) * inputs; */
	// pseudoOuts
	size += 32 * inputs;
	// ecdhInfo
	size += 2 * 32 * outputs;
	// outPk - only commitment is saved
	size += 32 * outputs;
	// txnFee
	size += 4;
	// const logStr = `estimated rct tx size for ${inputs} at mixin ${mixin} and ${outputs} : ${size}  (${((32 * inputs/*+1*/) + 2 * 32 * (mixin+1) * inputs + 32 * outputs)}) saved)`
	// console.log(logStr)

	return size;
}
