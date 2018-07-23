import {
	ge_double_scalarmult_base_vartime,
	sc_sub,
	sc_add,
} from "./primitive_ops";
import { H, I } from "./constants";
import { valid_hex } from "xmr-str-utils/hex-strings";
import { hash_to_scalar } from "./hash_ops";
import { Commit } from "xmr-types";

//creates a Pedersen commitment from an amount (in scalar form) and a mask
//C = bG + aH where b = mask, a = amount
export function commit(amount: string, mask: string) {
	if (
		!valid_hex(mask) ||
		mask.length !== 64 ||
		!valid_hex(amount) ||
		amount.length !== 64
	) {
		throw Error("invalid amount or mask!");
	}
	const C = ge_double_scalarmult_base_vartime(amount, H, mask);
	return C;
}

export function zeroCommit(amount: string) {
	return commit(amount, I);
}

export function decode_ecdh(ecdh: Commit, key: string): Commit {
	const first = hash_to_scalar(key);
	const second = hash_to_scalar(first);
	return {
		mask: sc_sub(ecdh.mask, first),
		amount: sc_sub(ecdh.amount, second),
	};
}

export function encode_ecdh(ecdh: Commit, key: string): Commit {
	const first = hash_to_scalar(key);
	const second = hash_to_scalar(first);
	return {
		mask: sc_add(ecdh.mask, first),
		amount: sc_add(ecdh.amount, second),
	};
}
