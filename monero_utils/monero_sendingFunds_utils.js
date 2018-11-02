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
//
"use strict";
//
const monero_config = require("./monero_config");
const monero_amount_format_utils = require("./monero_amount_format_utils");
const monero_paymentID_utils = require("./monero_paymentID_utils");
const JSBigInt = require("../cryptonote_utils/biginteger").BigInteger;
//
const hostAPI_net_service_utils = require("../hostAPI/net_service_utils");
//
let monero_utils

function _mixinToRingsize(mixin) {
	return mixin + 1;
}
//
function thisFork_minMixin() {
	return 10;
}
function thisFork_minRingSize() {
	return _mixinToRingsize(thisFork_minMixin());
}
function initMoneroUtils (moneroUtils) {
	monero_utils = moneroUtils
}
exports.initMoneroUtils = initMoneroUtils
exports.thisFork_minMixin = thisFork_minMixin;
exports.thisFork_minRingSize = thisFork_minRingSize;
//
function fixedMixin() {
	return thisFork_minMixin(); /* using the monero app default to remove MM user identifiers */
}
function fixedRingsize() {
	return _mixinToRingsize(fixedMixin());
}
exports.fixedMixin = fixedMixin;
exports.fixedRingsize = fixedRingsize;
//
//
function default_priority() {
	return 1;
} // aka .low
exports.default_priority = default_priority;
//
const newer_multipliers = [1, 4, 20, 166];
function fee_multiplier_for_priority(priority__or0ForDefault) {
	const final_priorityInt =
		!priority__or0ForDefault || priority__or0ForDefault == 0
			? default_priority()
			: priority__or0ForDefault;
	if (
		final_priorityInt <= 0 ||
		final_priorityInt > newer_multipliers.length
	) {
		throw "fee_multiplier_for_priority: simple_priority out of bounds";
	}
	const priority_as_idx = final_priorityInt - 1;
	return newer_multipliers[priority_as_idx];
}
//
const SendFunds_ProcessStep_Code = {
	fetchingLatestBalance: 1,
	calculatingFee: 2,
	fetchingDecoyOutputs: 3, // may get skipped if 0 mixin
	constructingTransaction: 4, // may go back to .calculatingFee
	submittingTransaction: 5,
};
exports.SendFunds_ProcessStep_Code = SendFunds_ProcessStep_Code;
const SendFunds_ProcessStep_MessageSuffix = {
	1: "Fetching latest balance.",
	2: "Calculating fee.",
	3: "Fetching decoy outputs.",
	4: "Constructing transaction.", // may go back to .calculatingFee
	5: "Submitting transaction.",
};
exports.SendFunds_ProcessStep_MessageSuffix = SendFunds_ProcessStep_MessageSuffix;
//
function SendFunds( // TODO: migrate this to take a map of args
	target_address, // currency-ready wallet address, but not an OA address (resolve before calling)
	nettype,
	amount_orZeroWhenSweep, // number - value will be ignoring for sweep
	isSweep_orZeroWhenAmount, // send true to sweep - amount_orZeroWhenSweep will be ignored
	wallet__public_address,
	wallet__private_keys,
	wallet__public_keys,
	hostedMoneroAPIClient, // TODO: possibly factor this dependency
	payment_id,
	simple_priority,
	preSuccess_nonTerminal_statusUpdate_fn, // (_ stepCode: SendFunds_ProcessStep_Code) -> Void
	success_fn,
	// success_fn: ( // TODO: to be migrated to args as return obj
	//		moneroReady_targetDescription_address?,
	//		sentAmount?,
	//		final__payment_id?,
	//		tx_hash?,
	//		tx_fee?,
	//		tx_key?,
	//		mixin?,
	// )
	failWithErr_fn
	// failWithErr_fn: (
	//		err
	// )
) {
	// monero_utils_promise.then(async function(monero_utils)
	{
		const mixin = fixedMixin(); // would be nice to eliminate this dependency or grab it from C++
		//
		// some callback trampoline function declarations…
		function __trampolineFor_err_withErr(err) {
			failWithErr_fn(err);
		}
		function __trampolineFor_err_withStr(errStr) {
			const err = new Error(errStr);
			console.error(errStr);
			failWithErr_fn(err);
		}
		//
		var sweeping = isSweep_orZeroWhenAmount === true; // rather than, say, undefined
		var amount = "" + (sweeping ? 0 : amount_orZeroWhenSweep); //TODO just send string
		var sending_amount; // possibly need this ; here for the JS parser
		if (sweeping) {
			sending_amount = 0
		} else {
			try {
				sending_amount = monero_amount_format_utils.parseMoney(amount);
			} catch (e) {
				__trampolineFor_err_withStr(`Couldn't parse amount ${amount}: ${e}`);
				return;
			}
		}
		//
		// TODO:
		// const wallet__public_keys = await decode_address(from_address, nettype);
		//
		preSuccess_nonTerminal_statusUpdate_fn(SendFunds_ProcessStep_Code.fetchingLatestBalance);
		var fee_per_b__string;
		var unspent_outs; 
		hostedMoneroAPIClient.UnspentOuts(
			wallet__public_address,
			wallet__private_keys.view,
			wallet__public_keys.spend,
			wallet__private_keys.spend,
			mixin,
			sweeping,
			async function(err, returned_unusedOuts, per_byte_fee__string)
			{
				if (err) {
					__trampolineFor_err_withErr(err);
					return;
				}
				console.log("Received dynamic per kb fee", monero_amount_format_utils.formatMoneySymbol(new JSBigInt(per_byte_fee__string)));
				{ // save some values for re-enterable function
					unspent_outs = returned_unusedOuts; // TODO: which one should be used? delete the other
					fee_per_b__string = per_byte_fee__string; 
				}
				await __reenterable_constructAndSendTx(
					null, // for the first try - passedIn_attemptAt_network_minimumFee
					1
				);
			}
		);
		async function __reenterable_constructAndSendTx(optl__passedIn_attemptAt_fee, constructionAttempt)
		{
			// Now we need to establish some values for balance validation and to construct the transaction
			preSuccess_nonTerminal_statusUpdate_fn(SendFunds_ProcessStep_Code.calculatingFee);
			var step1_retVals;
			try {
				step1_retVals = await monero_utils.send_step1__prepare_params_for_get_decoys(
					sweeping,
					sending_amount.toString(), // must be a string
					fee_per_b__string,
					simple_priority,
					unspent_outs,
					payment_id, // may be nil
					optl__passedIn_attemptAt_fee
				);
			} catch (e) {
				var errStr;
				if (e) {
					errStr = typeof e == "string" ? e : e.toString();
				} else {
					errStr = "Failed to create transaction (step 1) with unknown error.";
				}
				__trampolineFor_err_withStr(errStr);
				return;
			}
			//
			// prep for step2
			// first, grab RandomOuts, then enter step2
			preSuccess_nonTerminal_statusUpdate_fn(SendFunds_ProcessStep_Code.fetchingDecoyOutputs);
			hostedMoneroAPIClient.RandomOuts(
				step1_retVals.using_outs, 
				step1_retVals.mixin, 
				async function(err, mix_outs)
				{
					if (err) {
						__trampolineFor_err_withErr(err);
						return;
					}
					await ___createTxAndAttemptToSend(mix_outs); 
				}
			);
			async function ___createTxAndAttemptToSend(mix_outs) 
			{
				preSuccess_nonTerminal_statusUpdate_fn(SendFunds_ProcessStep_Code.constructingTransaction);
				var step2_retVals;
				try {
					step2_retVals = await monero_utils.send_step2__try_create_transaction(
						wallet__public_address,
						wallet__private_keys,
						target_address,
						step1_retVals.using_outs, // able to read this directly from step1 JSON
						mix_outs,
						step1_retVals.mixin,
						step1_retVals.final_total_wo_fee,
						step1_retVals.change_amount,
						step1_retVals.using_fee,
						payment_id, 
						simple_priority,
						fee_per_b__string,
						0, // unlock time
						nettype
					);
				} catch (e) {
					var errStr;
					if (e) {
						errStr = typeof e == "string" ? e : e.toString();
					} else {
						errStr = "Failed to create transaction (step 2) with unknown error.";
					}
					__trampolineFor_err_withStr(errStr);
					return;
				}
				if (typeof step2_retVals.err_msg !== 'undefined' && step2_retVals.err_msg) { // actually not expecting this! but just in case..
					__trampolineFor_err_withStr(step2_retVals.err_msg);
					return;
				}
				// if we need a higher fee
				if (step2_retVals.tx_must_be_reconstructed === true || step2_retVals.tx_must_be_reconstructed === "true") { // TODO
					console.log("Need to reconstruct the tx with enough of a network fee");
					// this will update status back to .calculatingFee
					if (constructionAttempt > 30) { // just going to avoid an infinite loop here
						__trampolineFor_err_withStr("Unable to construct a transaction with sufficient fee for unknown reason.");
						return;
					}
					await __reenterable_constructAndSendTx(
						step2_retVals.fee_actually_needed, // we are re-entering the step1->step2 codepath after updating fee_actually_needed
						constructionAttempt + 1
					);
					return;
				}
				// Generated with correct fee
				// console.log("tx serialized: " + step2_retVals.signed_serialized_tx);
				// console.log("Tx hash: " + step2_retVals.tx_hash);
				// console.log("Tx key: " + step2_retVals.tx_key);
				// console.log("Successful tx generation; submitting.");
				// status: submitting…
				preSuccess_nonTerminal_statusUpdate_fn(SendFunds_ProcessStep_Code.submittingTransaction);
				hostedMoneroAPIClient.SubmitSerializedSignedTransaction(
					wallet__public_address,
					wallet__private_keys.view,
					step2_retVals.signed_serialized_tx,
					async function(err) {
						if (err) {
							__trampolineFor_err_withStr("Something unexpected occurred when submitting your transaction: " + err);
							return;
						}
						const final_fee_amount = new JSBigInt(step1_retVals.using_fee)
						const finalTotalWOFee_amount = new JSBigInt(step1_retVals.final_total_wo_fee)
						var final__payment_id = payment_id;
						if (final__payment_id === null || typeof final__payment_id == "undefined" || !final__payment_id) {
							const decoded  = await monero_utils.decode_address(target_address, nettype);
							if (decoded.intPaymentId && typeof decoded.intPaymentId !== 'undefined') {
								final__payment_id = decoded.intPaymentId // just preserving original return value - this retVal can eventually be removed
							}
						}
						success_fn( // TODO: port this to returning a dictionary
							target_address, // TODO: remove this
							finalTotalWOFee_amount.add(final_fee_amount), // total sent
							final__payment_id, 
							step2_retVals.tx_hash,
							final_fee_amount,
							step2_retVals.tx_key,
							parseInt(step1_retVals.mixin)
						);
					}
				);
			}
		}
	}
}
exports.SendFunds = SendFunds;