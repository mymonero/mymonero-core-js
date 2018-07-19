import { ge_double_scalarmult_base_vartime } from "./primitive_ops";
import { H, I } from "./constants";
import { valid_hex } from "xmr-str-utils/hex-strings";

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
	if (!valid_hex(amount) || amount.length !== 64) {
		throw Error("invalid amount!");
	}
	const C = ge_double_scalarmult_base_vartime(amount, H, I);
	return C;
}
