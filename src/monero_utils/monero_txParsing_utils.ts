import { NormalizedTransaction } from "hostAPI/response_parser_utils/types";

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

import { config } from "./monero_config";

export function IsTransactionConfirmed(
	tx: NormalizedTransaction,
	blockchainHeight: number,
) {
	return blockchainHeight - tx.height > config.txMinConfirms;
}

export function IsTransactionUnlocked(
	{ unlock_time }: NormalizedTransaction,
	blockchainHeight: number,
) {
	if (!config.maxBlockNumber) {
		throw Error("Max block number is not set in config!");
	}
	if (unlock_time < config.maxBlockNumber) {
		// unlock time is block height
		return blockchainHeight >= unlock_time;
	} else {
		// unlock time is timestamp
		const current_time = Math.round(new Date().getTime() / 1000);
		return current_time >= unlock_time;
	}
}

export function TransactionLockedReason(
	{ unlock_time }: NormalizedTransaction,
	blockchainHeight: number,
) {
	if (unlock_time < config.maxBlockNumber) {
		// unlock time is block height
		const numBlocks = unlock_time - blockchainHeight;
		if (numBlocks <= 0) {
			return "Transaction is unlocked";
		}
		const unlock_prediction = moment().add(
			numBlocks * config.avgBlockTime,
			"seconds",
		);
		return (
			"Will be unlocked in " +
			numBlocks +
			" blocks, ~" +
			unlock_prediction.fromNow(true) +
			", " +
			unlock_prediction.calendar() +
			""
		);
	} else {
		// unlock time is timestamp
		const current_time = Math.round(new Date().getTime() / 1000);
		const time_difference = unlock_time - current_time;
		if (time_difference <= 0) {
			return "Transaction is unlocked";
		}
		const unlock_moment = moment(unlock_time * 1000);
		return (
			"Will be unlocked " +
			unlock_moment.fromNow() +
			", " +
			unlock_moment.calendar()
		);
	}
}
