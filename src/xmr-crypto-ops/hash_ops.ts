import CNCrypto = require("xmr-vendor/cn_crypto");
import { cn_fast_hash } from "xmr-fast-hash";
import { STRUCT_SIZES, KEY_SIZE, HASH_SIZE } from "./constants";
import { bintohex, hextobin } from "xmr-str-utils/hex-strings";
import { sc_reduce32 } from "./primitive_ops";

export function hash_to_scalar(buf: string) {
	const hash = cn_fast_hash(buf);
	const scalar = sc_reduce32(hash);
	return scalar;
}

export function hash_to_ec(key: string) {
	if (key.length !== KEY_SIZE * 2) {
		throw Error("Invalid input length");
	}
	const h_m = CNCrypto._malloc(HASH_SIZE);
	const point_m = CNCrypto._malloc(STRUCT_SIZES.GE_P2);
	const point2_m = CNCrypto._malloc(STRUCT_SIZES.GE_P1P1);
	const res_m = CNCrypto._malloc(STRUCT_SIZES.GE_P3);
	const hash = hextobin(cn_fast_hash(key));
	CNCrypto.HEAPU8.set(hash, h_m);
	CNCrypto.ccall(
		"ge_fromfe_frombytes_vartime",
		"void",
		["number", "number"],
		[point_m, h_m],
	);
	CNCrypto.ccall(
		"ge_mul8",
		"void",
		["number", "number"],
		[point2_m, point_m],
	);
	CNCrypto.ccall(
		"ge_p1p1_to_p3",
		"void",
		["number", "number"],
		[res_m, point2_m],
	);
	const res = CNCrypto.HEAPU8.subarray(res_m, res_m + STRUCT_SIZES.GE_P3);
	CNCrypto._free(h_m);
	CNCrypto._free(point_m);
	CNCrypto._free(point2_m);
	CNCrypto._free(res_m);
	return bintohex(res);
}

//returns a 32 byte point via "ge_p3_tobytes" rather than a 160 byte "p3", otherwise same as above;
export function hash_to_ec_2(key: string) {
	if (key.length !== KEY_SIZE * 2) {
		throw Error("Invalid input length");
	}
	const h_m = CNCrypto._malloc(HASH_SIZE);
	const point_m = CNCrypto._malloc(STRUCT_SIZES.GE_P2);
	const point2_m = CNCrypto._malloc(STRUCT_SIZES.GE_P1P1);
	const res_m = CNCrypto._malloc(STRUCT_SIZES.GE_P3);
	const hash = hextobin(cn_fast_hash(key));
	const res2_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hash, h_m);
	CNCrypto.ccall(
		"ge_fromfe_frombytes_vartime",
		"void",
		["number", "number"],
		[point_m, h_m],
	);
	CNCrypto.ccall(
		"ge_mul8",
		"void",
		["number", "number"],
		[point2_m, point_m],
	);
	CNCrypto.ccall(
		"ge_p1p1_to_p3",
		"void",
		["number", "number"],
		[res_m, point2_m],
	);
	CNCrypto.ccall(
		"ge_p3_tobytes",
		"void",
		["number", "number"],
		[res2_m, res_m],
	);
	const res = CNCrypto.HEAPU8.subarray(res2_m, res2_m + KEY_SIZE);
	CNCrypto._free(h_m);
	CNCrypto._free(point_m);
	CNCrypto._free(point2_m);
	CNCrypto._free(res_m);
	CNCrypto._free(res2_m);
	return bintohex(res);
}
export const hashToPoint = hash_to_ec_2;

export function array_hash_to_scalar(array: string[]) {
	let buf = "";
	for (let i = 0; i < array.length; i++) {
		buf += array[i];
	}
	return hash_to_scalar(buf);
}
