// Copyright (c) 2014-2019, MyMonero.com
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
//
"use strict";
//
const JSBigInt = require("../cryptonote_utils/biginteger").BigInteger;
const monero_config = require("./monero_config");
const moment = require("../cryptonote_utils/moment")
const monero_keyImage_cache_utils = require("./monero_keyImage_cache_utils");
const monero_amount_format_utils = require("./monero_amount_format_utils");
//
function ownedParsedTxFrom__orNil(
	raw_tx,
	address,
	view_key__private,
	spend_key__public,
	spend_key__private,
	keyImage_cache,
	coreBridge_instance
) {
	var tx = JSON.parse(JSON.stringify(raw_tx)) // copy ... do we need/want to do this?
	//
	if ((tx.spent_outputs || []).length > 0) {
		for (var j = 0; j < tx.spent_outputs.length; ++j) {
			var key_image = monero_keyImage_cache_utils.Lazy_KeyImage(
				keyImage_cache,
				tx.spent_outputs[j].tx_pub_key,
				tx.spent_outputs[j].out_index,
				address,
				view_key__private,
				spend_key__public,
				spend_key__private,
				coreBridge_instance
			);
			if (tx.spent_outputs[j].key_image !== key_image) {
				// console.log('Output used as mixin, ignoring (' + transactions[i].spent_outputs[j].key_image + '/' + key_image + ')')
				tx.total_sent = (new JSBigInt(tx.total_sent)).subtract(tx.spent_outputs[j].amount).toString() // TODO: probably faster to keep it as a JSBigInt til we're done calculating			
				tx.spent_outputs.splice(j, 1) // remove
				j--
			}
		}
	}
	if (new JSBigInt(tx.total_received||0).add(tx.total_sent||0).compare(0) <= 0) {
		return null // not own tx - discard
	}
	tx.amount = new JSBigInt(tx.total_received || 0).subtract(tx.total_sent || 0).toString()
	tx.approx_float_amount = parseFloat(monero_amount_format_utils.formatMoney(tx.amount));
	// tx.timestamp = tx.timestamp;
	//
	if (typeof tx.payment_id !== "undefined" && tx.payment_id) {
		if (tx.payment_id.length == 16) {
			// short (encrypted) pid
			if (tx.approx_float_amount < 0) {
				// outgoing
				delete tx["payment_id"]; // need to filter these out .. because the server can't filter out short (encrypted) pids on outgoing txs
			}
		}
	}
	return tx
}
exports.ownedParsedTxFrom__orNil = ownedParsedTxFrom__orNil
//
function IsTransactionConfirmed(tx, blockchain_height) 
{
	// TODO: check tx.mempool here?
	if (tx.height === null || typeof tx.height == 'undefined') {
		return false // supposing it hasn't made it into a block yet
	}
	return blockchain_height - tx.height > monero_config.txMinConfirms;
}
exports.IsTransactionConfirmed = IsTransactionConfirmed;
//
function IsTransactionUnlocked(tx, blockchain_height) {
	const unlock_time = tx.unlock_time || 0;
	if (!monero_config.maxBlockNumber) {
		throw "Max block number is not set in config!";
	}
	if (unlock_time < monero_config.maxBlockNumber) {
		// unlock time is block height
		return blockchain_height >= unlock_time;
	} else {
		// unlock time is timestamp
		var current_time = Math.round(new Date().getTime() / 1000);
		return current_time >= unlock_time;
	}
}
exports.IsTransactionUnlocked = IsTransactionUnlocked;
//
function TransactionLockedReason(tx, blockchain_height)
{
	const unlock_time = tx.unlock_time || 0;
	if (unlock_time < monero_config.maxBlockNumber) {
		// unlock time is block height
		var numBlocks = unlock_time - blockchain_height;
		if (numBlocks <= 0) {
			return "Transaction is unlocked";
		}
		var unlock_prediction = moment().add(
			numBlocks * monero_config.avgBlockTime,
			"seconds"
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
		var current_time = Math.round(new Date().getTime() / 1000);
		var time_difference = unlock_time - current_time;
		if (time_difference <= 0) {
			return "Transaction is unlocked";
		}
		var unlock_moment = moment(unlock_time * 1000);
		return (
			"Will be unlocked " +
			unlock_moment.fromNow() +
			", " +
			unlock_moment.calendar()
		);
	}
}
exports.TransactionLockedReason = TransactionLockedReason;
