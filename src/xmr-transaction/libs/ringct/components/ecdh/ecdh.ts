import { Commit } from "./types";
import { hash_to_scalar } from "xmr-crypto-ops/hash_ops";
import { sc_add, sc_sub } from "xmr-crypto-ops/primitive_ops";

export function decode_rct_ecdh(ecdh: Commit, key: string): Commit {
	const first = hash_to_scalar(key);
	const second = hash_to_scalar(first);
	return {
		mask: sc_sub(ecdh.mask, first),
		amount: sc_sub(ecdh.amount, second),
	};
}

export function encode_rct_ecdh(ecdh: Commit, key: string): Commit {
	const first = hash_to_scalar(key);
	const second = hash_to_scalar(first);
	return {
		mask: sc_add(ecdh.mask, first),
		amount: sc_add(ecdh.amount, second),
	};
}
