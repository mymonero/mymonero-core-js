import CNCrypto = require("xmr-vendor/cn_crypto");
import nacl = require("xmr-vendor/fast_cn");
import { bintohex, hextobin, valid_hex } from "xmr-str-utils/hex-strings";
import { STRUCT_SIZES, KEY_SIZE } from "./constants";
import { hash_to_ec_2 } from "./hash_ops";

//curve and scalar functions; split out to make their host functions cleaner and more readable
//inverts X coordinate -- this seems correct ^_^ -luigi1111
function ge_neg(point: string) {
	if (point.length !== 64) {
		throw Error("expected 64 char hex string");
	}
	return (
		point.slice(0, 62) +
		((parseInt(point.slice(62, 63), 16) + 8) % 16).toString(16) +
		point.slice(63, 64)
	);
}

export function ge_add(p1: string, p2: string) {
	if (p1.length !== 64 || p2.length !== 64) {
		throw Error("Invalid input length!");
	}
	return bintohex(nacl.ge_add(hextobin(p1), hextobin(p2)));
}

//order matters
export function ge_sub(point1: string, point2: string) {
	const point2n = ge_neg(point2);
	return ge_add(point1, point2n);
}

//adds two scalars together
export function sc_add(scalar1: string, scalar2: string) {
	if (scalar1.length !== 64 || scalar2.length !== 64) {
		throw Error("Invalid input length!");
	}
	const scalar1_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	const scalar2_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	CNCrypto.HEAPU8.set(hextobin(scalar1), scalar1_m);
	CNCrypto.HEAPU8.set(hextobin(scalar2), scalar2_m);
	const derived_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	CNCrypto.ccall(
		"sc_add",
		"void",
		["number", "number", "number"],
		[derived_m, scalar1_m, scalar2_m],
	);
	const res = CNCrypto.HEAPU8.subarray(
		derived_m,
		derived_m + STRUCT_SIZES.EC_SCALAR,
	);
	CNCrypto._free(scalar1_m);
	CNCrypto._free(scalar2_m);
	CNCrypto._free(derived_m);
	return bintohex(res);
}

//subtracts one scalar from another
export function sc_sub(scalar1: string, scalar2: string) {
	if (scalar1.length !== 64 || scalar2.length !== 64) {
		throw Error("Invalid input length!");
	}
	const scalar1_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	const scalar2_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	CNCrypto.HEAPU8.set(hextobin(scalar1), scalar1_m);
	CNCrypto.HEAPU8.set(hextobin(scalar2), scalar2_m);
	const derived_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	CNCrypto.ccall(
		"sc_sub",
		"void",
		["number", "number", "number"],
		[derived_m, scalar1_m, scalar2_m],
	);
	const res = CNCrypto.HEAPU8.subarray(
		derived_m,
		derived_m + STRUCT_SIZES.EC_SCALAR,
	);
	CNCrypto._free(scalar1_m);
	CNCrypto._free(scalar2_m);
	CNCrypto._free(derived_m);
	return bintohex(res);
}

//res = c - (ab) mod l; argument names copied from the signature implementation
export function sc_mulsub(sigc: string, sec: string, k: string) {
	if (
		k.length !== KEY_SIZE * 2 ||
		sigc.length !== KEY_SIZE * 2 ||
		sec.length !== KEY_SIZE * 2 ||
		!valid_hex(k) ||
		!valid_hex(sigc) ||
		!valid_hex(sec)
	) {
		throw Error("bad scalar");
	}
	const sec_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hextobin(sec), sec_m);
	const sigc_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hextobin(sigc), sigc_m);
	const k_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hextobin(k), k_m);
	const res_m = CNCrypto._malloc(KEY_SIZE);

	CNCrypto.ccall(
		"sc_mulsub",
		"void",
		["number", "number", "number", "number"],
		[res_m, sigc_m, sec_m, k_m],
	);
	const res = CNCrypto.HEAPU8.subarray(res_m, res_m + KEY_SIZE);
	CNCrypto._free(k_m);
	CNCrypto._free(sec_m);
	CNCrypto._free(sigc_m);
	CNCrypto._free(res_m);
	return bintohex(res);
}

export function ge_double_scalarmult_base_vartime(
	c: string,
	P: string,
	r: string,
) {
	if (c.length !== 64 || P.length !== 64 || r.length !== 64) {
		throw Error("Invalid input length!");
	}
	return bintohex(
		nacl.ge_double_scalarmult_base_vartime(
			hextobin(c),
			hextobin(P),
			hextobin(r),
		),
	);
}

export function ge_double_scalarmult_postcomp_vartime(
	r: string,
	P: string,
	c: string,
	I: string,
) {
	if (
		c.length !== 64 ||
		P.length !== 64 ||
		r.length !== 64 ||
		I.length !== 64
	) {
		throw Error("Invalid input length!");
	}
	const Pb = hash_to_ec_2(P);
	return bintohex(
		nacl.ge_double_scalarmult_postcomp_vartime(
			hextobin(r),
			hextobin(Pb),
			hextobin(c),
			hextobin(I),
		),
	);
}

export function ge_scalarmult_base(sec: string) {
	if (sec.length !== 64) {
		throw Error("Invalid sec length");
	}
	return bintohex(nacl.ge_scalarmult_base(hextobin(sec)));
}

export function ge_scalarmult(pub: string, sec: string) {
	if (pub.length !== 64 || sec.length !== 64) {
		throw Error("Invalid input length");
	}
	return bintohex(nacl.ge_scalarmult(hextobin(pub), hextobin(sec)));
}

export function sc_reduce32(hex: string) {
	const input = hextobin(hex);
	if (input.length !== 32) {
		throw Error("Invalid input length");
	}
	const mem = CNCrypto._malloc(32);
	CNCrypto.HEAPU8.set(input, mem);
	CNCrypto.ccall("sc_reduce32", "void", ["number"], [mem]);
	const output = CNCrypto.HEAPU8.subarray(mem, mem + 32);
	CNCrypto._free(mem);
	return bintohex(output);
}
