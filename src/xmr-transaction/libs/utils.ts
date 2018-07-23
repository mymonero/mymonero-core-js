import { SignedTransaction } from "xmr-types";
import { encode_varint } from "xmr-varint";
import { cn_fast_hash } from "xmr-fast-hash";
import { valid_hex } from "xmr-str-utils/hex-strings";
import { BigInt } from "biginteger";

const TX_EXTRA_NONCE_MAX_COUNT = 255;

const TX_EXTRA_TAGS = {
	PADDING: "00",
	PUBKEY: "01",
	NONCE: "02",
	MERGE_MINING: "03",
};

const TX_EXTRA_NONCE_TAGS = {
	PAYMENT_ID: "00",
	ENCRYPTED_PAYMENT_ID: "01",
};

export function add_pub_key_to_extra(extra: string, pubkey: string) {
	if (pubkey.length !== 64) throw Error("Invalid pubkey length");
	// Append pubkey tag and pubkey
	extra += TX_EXTRA_TAGS.PUBKEY + pubkey;
	return extra;
}

export function add_nonce_to_extra(extra: string, nonce: string) {
	// Append extra nonce
	if (nonce.length % 2 !== 0) {
		throw Error("Invalid extra nonce");
	}
	if (nonce.length / 2 > TX_EXTRA_NONCE_MAX_COUNT) {
		throw Error(
			"Extra nonce must be at most " +
				TX_EXTRA_NONCE_MAX_COUNT +
				" bytes",
		);
	}
	// Add nonce tag
	extra += TX_EXTRA_TAGS.NONCE;
	// Encode length of nonce
	extra += ("0" + (nonce.length / 2).toString(16)).slice(-2);
	// Write nonce
	extra += nonce;
	return extra;
}

export function get_payment_id_nonce(payment_id: string, pid_encrypt: boolean) {
	if (payment_id.length !== 64 && payment_id.length !== 16) {
		throw Error("Invalid payment id");
	}
	let res = "";
	if (pid_encrypt) {
		res += TX_EXTRA_NONCE_TAGS.ENCRYPTED_PAYMENT_ID;
	} else {
		res += TX_EXTRA_NONCE_TAGS.PAYMENT_ID;
	}
	res += payment_id;
	return res;
}

export function abs_to_rel_offsets(offsets: string[]) {
	if (offsets.length === 0) return offsets;
	for (let i = offsets.length - 1; i >= 1; --i) {
		offsets[i] = new BigInt(offsets[i]).subtract(offsets[i - 1]).toString();
	}
	return offsets;
}

export function serializeTxHeader(tx: SignedTransaction) {
	let buf = "";
	buf += encode_varint(tx.version);
	buf += encode_varint(tx.unlock_time);
	buf += encode_varint(tx.vin.length);

	for (let i = 0; i < tx.vin.length; i++) {
		const vin = tx.vin[i];
		switch (vin.type) {
			case "input_to_key":
				buf += "02";
				buf += encode_varint(vin.amount);
				buf += encode_varint(vin.key_offsets.length);
				for (let j = 0; j < vin.key_offsets.length; j++) {
					buf += encode_varint(vin.key_offsets[j]);
				}
				buf += vin.k_image;
				break;
			default:
				throw Error("Unhandled vin type: " + vin.type);
		}
	}
	buf += encode_varint(tx.vout.length);
	for (let i = 0; i < tx.vout.length; i++) {
		const vout = tx.vout[i];
		buf += encode_varint(vout.amount);
		switch (vout.target.type) {
			case "txout_to_key":
				buf += "02";
				buf += vout.target.key;
				break;
			default:
				throw Error("Unhandled txout target type: " + vout.target.type);
		}
	}
	if (!valid_hex(tx.extra)) {
		throw Error("Tx extra has invalid hex");
	}
	buf += encode_varint(tx.extra.length / 2);
	buf += tx.extra;

	return buf;
}

export function get_tx_prefix_hash(tx: SignedTransaction) {
	const prefix = serializeTxHeader(tx);
	return cn_fast_hash(prefix);
}
