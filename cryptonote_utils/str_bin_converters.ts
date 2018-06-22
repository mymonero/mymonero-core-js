export function strtobin(str: string) {
	const res = new Uint8Array(str.length);
	for (let i = 0; i < str.length; i++) {
		res[i] = str.charCodeAt(i);
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

export function hextobin(hex: string) {
	if (hex.length % 2 !== 0) throw "Hex string has invalid length!";
	var res = new Uint8Array(hex.length / 2);
	for (var i = 0; i < hex.length / 2; ++i) {
		res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return res;
}
