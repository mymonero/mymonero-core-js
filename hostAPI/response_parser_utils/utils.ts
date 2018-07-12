import monero_utils from "monero_utils/monero_cryptonote_utils_instance";
import {
	AddressTransactions,
	AddressTransactionsTx,
	NormalizedTransaction,
	SpentOutput,
	AddressInfo,
	UnspentOutput,
} from "./types";
import { JSBigInt } from "types";

export function isKeyImageEqual({ key_image }: SpentOutput, keyImage: string) {
	return key_image === keyImage;
}

//#region addressInfo

export function normalizeAddressInfo(data: AddressInfo): Required<AddressInfo> {
	const defaultObj: Required<AddressInfo> = {
		total_sent: "0",
		total_received: "0",
		locked_funds: "0",

		start_height: 0,
		scanned_block_height: 0,
		scanned_height: 0,
		transaction_height: 0,
		blockchain_height: 0,

		rates: {},

		spent_outputs: [] as SpentOutput[],
	};
	return { ...defaultObj, ...data };
}
//#endregion addressInfo

//#region parseAddressTransactions

export function normalizeAddressTransactions(
	data: AddressTransactions,
): Required<AddressTransactions> {
	const defaultObj: Required<AddressTransactions> = {
		scanned_height: 0,
		scanned_block_height: 0,
		start_height: 0,
		transaction_height: 0,
		blockchain_height: 0,
		transactions: [] as AddressTransactionsTx[],
		total_received: "0",
	};
	return { ...defaultObj, ...data };
}

export function normalizeTransaction(
	tx: AddressTransactionsTx,
): NormalizedTransaction {
	const defaultObj: NormalizedTransaction = {
		amount: "0",
		approx_float_amount: 0,
		hash: "",
		height: 0,
		id: 0,
		mempool: false,
		coinbase: false,
		mixin: 0,
		spent_outputs: [] as SpentOutput[],
		timestamp: "",
		total_received: "0",
		total_sent: "0",
		unlock_time: 0,
		payment_id: "",
	};

	const mergedObj = { ...defaultObj, ...tx };

	return mergedObj;
}

/**
 *
 * @description Validates that the sum of total received and total sent is greater than 1
 * @param {NormalizedTransaction} { total_received, total_sent}
 */
export function zeroTransactionAmount({
	total_received,
	total_sent,
}: NormalizedTransaction) {
	return new JSBigInt(total_received).add(total_sent).compare(0) <= 0;
}

export function calculateTransactionAmount({
	total_received,
	total_sent,
}: NormalizedTransaction) {
	return new JSBigInt(total_received).subtract(total_sent).toString();
}

export function estimateTransactionAmount({ amount }: NormalizedTransaction) {
	return parseFloat(monero_utils.formatMoney(amount));
}

/**
 *
 * @description If the transaction is:
 * 1. An outgoing transaction, e.g. it is sending moneroj to an address rather than receiving it
 * 2. And contains an encrypted (8 byte) payment id
 *
 * Then, it is removed from the transaction object, because the server (MyMonero) can't filter out short (encrypted) pids on outgoing txs
 * @export
 * @param {NormalizedTransaction} tx
 */
export function removeEncryptedPaymentIDs(tx: NormalizedTransaction) {
	const { payment_id, approx_float_amount } = tx;
	const outgoingTxWithEncPid =
		payment_id && payment_id.length === 16 && approx_float_amount < 0;

	if (outgoingTxWithEncPid) {
		delete tx.payment_id;
	}
}

/**
 * @description Sort transactions based on the following cases where higher priorities
 * gain a lower index value:
 *
 * 1. Transactions that are in the mempool gain priority
 * 2. Otherwise, sort by id, where the higher ID has higher priority
 *
 * @export
 * @param {AddressTransactionsTx[]} transactions
 * @returns
 */
export function sortTransactions(transactions: AddressTransactionsTx[]) {
	return transactions.sort((a, b) => {
		if (a.mempool && !b.mempool) {
			return -1; // a first
		} else if (b.mempool) {
			return 1; // b first
		}

		// both mempool - fall back to .id compare
		return b.id - a.id;
	});
}

//#endregion parseAddressTransactions

//#region parseUnspentOuts

export function validateUnspentOutput(out: UnspentOutput, index: number) {
	if (!out) {
		throw Error(`unspent_output at index ${index} was null`);
	}
}

export function validateSpendKeyImages(keyImgs: string[], index: number) {
	if (!keyImgs) {
		throw Error(
			`spend_key_images of unspent_output at index ${index} was null`,
		);
	}
}

export function validUnspentOutput(out: UnspentOutput, index: number) {
	if (out) {
		return true;
	} else {
		console.warn(
			`This unspent output at i ${index} was  undefined! Skipping.`,
		);
		return false;
	}
}

export function validTxPubKey(out: UnspentOutput) {
	if (out.tx_pub_key) {
		return true;
	} else {
		console.warn(
			"This unspent out was missing a tx_pub_key! Skipping.",
			out,
		);
		return false;
	}
}

//#endregion parseUnspentOuts
