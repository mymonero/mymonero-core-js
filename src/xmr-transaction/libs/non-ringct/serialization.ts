import { SignedTransaction } from "xmr-types";
import { serializeTxHeader } from "../utils";

export function serialize_non_rct_tx(tx: SignedTransaction) {
	//tx: {
	//	version: uint64,
	//	unlock_time: uint64,
	//	extra: hex,
	//	vin: [{amount: uint64, k_image: hex, key_offsets: [uint64,..]},...],
	//	vout: [{amount: uint64, target: {key: hex}},...],
	//	signatures: [[s,s,...],...]
	//}
	let serializedTxHeader = serializeTxHeader(tx);

	if (!tx.signatures) {
		throw Error("This transaction does not contain pre rct signatures");
	}

	if (tx.vin.length !== tx.signatures.length) {
		throw Error("Signatures length != vin length");
	}
	for (let i = 0; i < tx.vin.length; i++) {
		for (let j = 0; j < tx.signatures[i].length; j++) {
			serializedTxHeader += tx.signatures[i][j];
		}
	}

	return serializedTxHeader;
}
