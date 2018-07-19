import { BigInt } from "biginteger";
import { swapEndian } from "./hex-strings";

//switch byte order charwise
export function swapEndianC(str: string) {
	let data = "";
	for (let i = 1; i <= str.length; i++) {
		data += str.substr(0 - i, 1);
	}
	return data;
}

//for most uses you'll also want to swapEndian after conversion
//mainly to convert integer "scalars" to usable hexadecimal strings
//uint long long to 32 byte key
export function d2h(integer: string | BigInt) {
	let padding = "";
	for (let i = 0; i < 63; i++) {
		padding += "0";
	}
	return (padding + new BigInt(integer).toString(16).toLowerCase()).slice(
		-64,
	);
}

//integer (string) to scalar
export function d2s(integer: string | BigInt) {
	return swapEndian(d2h(integer));
}

//convert integer string to 64bit "binary" little-endian string
export function d2b(integer: string | BigInt) {
	let padding = "";
	for (let i = 0; i < 63; i++) {
		padding += "0";
	}
	const a = new BigInt(integer);
	if (a.toString(2).length > 64) {
		throw Error("amount overflows uint64!");
	}
	return swapEndianC((padding + a.toString(2)).slice(-64));
}
