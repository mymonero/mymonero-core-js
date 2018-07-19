import { hexUtils } from "xmr-str-utils";
import SHA3 = require("keccakjs");

const { hextobin, valid_hex } = hexUtils;

export function cn_fast_hash(input: string) {
	if (input.length % 2 !== 0 || !valid_hex(input)) {
		throw Error("Input invalid");
	}

	const hasher = new SHA3(256);
	hasher.update(Buffer.from((hextobin(input).buffer as any) as Buffer));
	return hasher.digest("hex");
}
