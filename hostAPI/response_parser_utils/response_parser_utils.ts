// Copyright (c) 2014-2018, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import { JSBigInt } from "types";
import {
	genKeyImage,
	KeyImageCache,
	getKeyImageCache,
} from "monero_utils/key_image_utils";
import {
	normalizeAddressTransactions,
	normalizeTransaction,
	isKeyImageEqual,
	zeroTransactionAmount,
	calculateTransactionAmount,
	estimateTransactionAmount,
	sortTransactions,
	removeEncryptedPaymentIDs,
	normalizeAddressInfo,
	validateUnspentOutput,
	validateSpendKeyImages,
	validUnspentOutput,
	validTxPubKey,
} from "./utils";
import {
	AddressTransactions,
	AddressInfo,
	UnspentOuts,
	NormalizedTransaction,
} from "./types";

export function parseAddressInfo(
	address: string,
	keyImageCache: KeyImageCache = getKeyImageCache(address),
	data: AddressInfo,
	privViewKey: string,
	pubSpendKey: string,
	privSpendKey: string,
) {
	const normalizedData = normalizeAddressInfo(data);
	let { total_sent } = normalizedData;
	const {
		total_received,
		locked_funds: locked_balance,
		start_height: account_scan_start_height,
		scanned_block_height: account_scanned_tx_height,
		scanned_height: account_scanned_block_height,
		transaction_height,
		blockchain_height,
		rates: ratesBySymbol,
		spent_outputs,
	} = normalizedData;

	for (const spent_output of spent_outputs) {
		const key_image = genKeyImage(
			keyImageCache,
			spent_output.tx_pub_key,
			spent_output.out_index,
			address,
			privViewKey,
			pubSpendKey,
			privSpendKey,
		);

		if (!isKeyImageEqual(spent_output, key_image)) {
			total_sent = new JSBigInt(total_sent)
				.subtract(spent_output.amount)
				.toString();
		}
	}

	return {
		total_received: new JSBigInt(total_received),
		locked_balance: new JSBigInt(locked_balance),
		total_sent: new JSBigInt(total_sent),

		spent_outputs,
		account_scanned_tx_height,
		account_scanned_block_height,
		account_scan_start_height,
		transaction_height,
		blockchain_height,

		ratesBySymbol,
	};
}

export function parseAddressTransactions(
	address: string,
	keyImgCache: KeyImageCache = getKeyImageCache(address),
	data: AddressTransactions,
	privViewKey: string,
	pubSpendKey: string,
	privSpendKey: string,
) {
	const {
		blockchain_height,
		scanned_block_height: account_scanned_block_height,
		scanned_height: account_scanned_height,
		start_height: account_scan_start_height,
		total_received,
		transaction_height,
		transactions,
	} = normalizeAddressTransactions(data);

	const normalizedTransactions: NormalizedTransaction[] = [];

	for (let i = 0; i < transactions.length; i++) {
		const transaction = normalizeTransaction(transactions[i]);

		for (let j = 0; j < transaction.spent_outputs.length; j++) {
			const keyImage = genKeyImage(
				keyImgCache,
				transaction.spent_outputs[j].tx_pub_key,
				transaction.spent_outputs[j].out_index,
				address,
				privViewKey,
				pubSpendKey,
				privSpendKey,
			);

			if (!isKeyImageEqual(transaction.spent_outputs[j], keyImage)) {
				transaction.total_sent = new JSBigInt(
					transaction.total_sent,
				).subtract(transaction.spent_outputs[j].amount);

				transaction.spent_outputs.splice(j, 1);
				j--;
			}
		}

		if (zeroTransactionAmount(transaction)) {
			transactions.splice(i, 1);
			i--;
			continue;
		}

		transaction.amount = calculateTransactionAmount(transaction);

		transaction.approx_float_amount = estimateTransactionAmount(
			transaction,
		);

		removeEncryptedPaymentIDs(transaction);

		normalizedTransactions.push(transaction);
	}

	sortTransactions(normalizedTransactions);

	// on the other side, we convert transactions timestamp to Date obj

	return {
		account_scanned_height,
		account_scanned_block_height,
		account_scan_start_height,
		transaction_height,
		blockchain_height,
		transactions: normalizedTransactions,
	};
}

/**
 * @description Go through each (possibly) unspent out and remove ones that have been spent before
 * by computing a key image per unspent output and checking if they match any spend_key_images
 * @param {string} address
 * @param {KeyImageCache} [keyImageCache=getKeyImageCache(address)]
 * @param {UnspentOuts} data
 * @param {string} privViewKey
 * @param {string} pubSpendKey
 * @param {string} privSpendKey
 */
export function parseUnspentOuts(
	address: string,
	keyImageCache: KeyImageCache = getKeyImageCache(address),
	data: UnspentOuts,
	privViewKey: string,
	pubSpendKey: string,
	privSpendKey: string,
) {
	const { outputs, per_kb_fee } = data;

	if (!per_kb_fee) {
		throw Error("Unexpected / missing per_kb_fee");
	}

	const unspentOuts = outputs || [];

	for (let i = 0; i < unspentOuts.length; i++) {
		const unspentOut = unspentOuts[i];
		validateUnspentOutput(unspentOut, i);

		const { spend_key_images } = unspentOut;
		validateSpendKeyImages(spend_key_images, i);

		for (let j = 0; j < spend_key_images.length; j++) {
			const beforeSplice = unspentOuts[i];

			if (!validUnspentOutput(beforeSplice, i)) {
				// NOTE: Looks like the i-- code below should exit earlier if this is necessary
				continue;
			}

			if (!validTxPubKey(beforeSplice)) {
				continue;
			}

			const keyImage = genKeyImage(
				keyImageCache,
				beforeSplice.tx_pub_key,
				beforeSplice.index,
				address,
				privViewKey,
				pubSpendKey,
				privSpendKey,
			);

			if (keyImage === beforeSplice.spend_key_images[j]) {
				// Remove output from list
				unspentOuts.splice(i, 1);

				const afterSplice = unspentOuts[i];

				// skip rest of spend_key_images
				if (afterSplice) {
					j = afterSplice.spend_key_images.length;
				}

				i--;
			} else {
				console.log(
					`💬  Output used as mixin (${keyImage} / ${
						unspentOuts[i].spend_key_images[j]
					})`,
				);
			}
		}
	}

	console.log("Unspent outs: " + JSON.stringify(unspentOuts));

	return {
		unspentOuts,
		unusedOuts: [...unspentOuts],
		per_kb_fee: new JSBigInt(per_kb_fee),
	};
}
