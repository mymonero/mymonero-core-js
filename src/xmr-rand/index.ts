import { randomBytes } from "crypto";
import { sc_reduce32 } from "xmr-crypto-ops/primitive_ops";

// Generate a 256-bit / 64-char / 32-byte crypto random
export function rand_32() {
	return randomBytes(32).toString("hex");
}

// Generate a 64-bit / 16-char / 8-byte crypto random
export function rand_8() {
	return randomBytes(8).toString("hex");
}

// Random 32-byte ec scalar
export function random_scalar() {
	return sc_reduce32(rand_32());
}
