export function valid_hex(hex: string) {
	const exp = new RegExp("[0-9a-fA-F]{" + hex.length + "}");
	return exp.test(hex);
}

//simple exclusive or function for two hex inputs
export function hex_xor(hex1: string, hex2: string) {
	if (
		!hex1 ||
		!hex2 ||
		hex1.length !== hex2.length ||
		hex1.length % 2 !== 0 ||
		hex2.length % 2 !== 0
	) {
		throw Error("Hex string(s) is/are invalid!");
	}
	const bin1 = hextobin(hex1);
	const bin2 = hextobin(hex2);
	const xor = new Uint8Array(bin1.length);
	for (let i = 0; i < xor.length; i++) {
		xor[i] = bin1[i] ^ bin2[i];
	}
	return bintohex(xor);
}

export function hextobin(hex: string) {
	if (hex.length % 2 !== 0) throw Error("Hex string has invalid length!");
	const res = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length / 2; ++i) {
		res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return res;
}

export function bintohex(bin: Uint8Array) {
	const out = [];
	for (let i = 0; i < bin.length; ++i) {
		out.push(("0" + bin[i].toString(16)).slice(-2));
	}
	return out.join("");
}

//switch byte order for hex string
export function swapEndian(hex: string) {
	if (hex.length % 2 !== 0) {
		return "length must be a multiple of 2!";
	}
	let data = "";
	for (let i = 1; i <= hex.length / 2; i++) {
		data += hex.substr(0 - 2 * i, 2);
	}
	return data;
}
