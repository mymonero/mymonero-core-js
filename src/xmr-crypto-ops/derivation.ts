import CNCrypto = require("xmr-vendor/cn_crypto");
import nacl = require("xmr-vendor/fast_cn");
import { STRUCT_SIZES, KEY_SIZE } from "./constants";
import { encode_varint } from "xmr-varint";
import { hash_to_scalar } from "./hash_ops";
import { ge_scalarmult, ge_scalarmult_base, ge_sub } from "./primitive_ops";
import { d2s } from "xmr-str-utils/integer-strings";
import { hextobin, bintohex } from "xmr-str-utils/hex-strings";

export function generate_key_derivation(pub: string, sec: string) {
	if (pub.length !== 64 || sec.length !== 64) {
		throw Error("Invalid input length");
	}
	const P = ge_scalarmult(pub, sec);
	return ge_scalarmult(P, d2s("8")); //mul8 to ensure group
}

export function derivation_to_scalar(derivation: string, output_index: number) {
	let buf = "";
	if (derivation.length !== STRUCT_SIZES.EC_POINT * 2) {
		throw Error("Invalid derivation length!");
	}
	buf += derivation;
	const enc = encode_varint(output_index);
	if (enc.length > 10 * 2) {
		throw Error("output_index didn't fit in 64-bit varint");
	}
	buf += enc;
	return hash_to_scalar(buf);
}

export function derive_secret_key(
	derivation: string,
	out_index: number,
	sec: string,
) {
	if (derivation.length !== 64 || sec.length !== 64) {
		throw Error("Invalid input length!");
	}
	const scalar_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	const scalar_b = hextobin(derivation_to_scalar(derivation, out_index));
	CNCrypto.HEAPU8.set(scalar_b, scalar_m);
	const base_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hextobin(sec), base_m);
	const derived_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	CNCrypto.ccall(
		"sc_add",
		"void",
		["number", "number", "number"],
		[derived_m, base_m, scalar_m],
	);
	const res = CNCrypto.HEAPU8.subarray(
		derived_m,
		derived_m + STRUCT_SIZES.EC_SCALAR,
	);
	CNCrypto._free(scalar_m);
	CNCrypto._free(base_m);
	CNCrypto._free(derived_m);
	return bintohex(res);
}

export function derive_public_key(
	derivation: string,
	out_index: number,
	pub: string,
) {
	if (derivation.length !== 64 || pub.length !== 64) {
		throw Error("Invalid input length!");
	}
	const s = derivation_to_scalar(derivation, out_index);
	return bintohex(
		nacl.ge_add(hextobin(pub), hextobin(ge_scalarmult_base(s))),
	);
}

// D' = P - Hs(aR|i)G
export function derive_subaddress_public_key(
	output_key: string,
	derivation: string,
	out_index: number,
) {
	if (output_key.length !== 64 || derivation.length !== 64) {
		throw Error("Invalid input length!");
	}
	const scalar = derivation_to_scalar(derivation, out_index);
	const point = ge_scalarmult_base(scalar);
	return ge_sub(output_key, point);
}
