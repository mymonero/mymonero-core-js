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
const monero_utils_promise = require('./monero_utils')
const monero_amount_format_utils = require("./monero_amount_format_utils");
const monero_paymentID_utils = require("./monero_paymentID_utils");
const JSBigInt = require("../cryptonote_utils/biginteger").BigInteger;
//
const hostAPI_net_service_utils = require("../hostAPI/net_service_utils");
//
function _forkv7_minimumMixin() {
	return 6;
}
function _mixinToRingsize(mixin) {
	return mixin + 1;
}
//
function thisFork_minMixin() {
	return _forkv7_minimumMixin();
}
function thisFork_minRingSize() {
	return _mixinToRingsize(thisFork_minMixin());
}
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
function SendFunds(
	target_address, // currency-ready wallet address, but not an OA address (resolve before calling)
	nettype,
	amount_orZeroWhenSweep, // number - value will be ignoring for sweep
	isSweep_orZeroWhenAmount, // send true to sweep - amount_orZeroWhenSweep will be ignored
	wallet__public_address,
	wallet__private_keys,
	wallet__public_keys,
	hostedMoneroAPIClient, // TODO: possibly factor this dependency
	monero_openalias_utils,
	payment_id,
	simple_priority,
	preSuccess_nonTerminal_statusUpdate_fn, // (_ stepCode: SendFunds_ProcessStep_Code) -> Void
	success_fn,
	// success_fn: (
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
	monero_utils_promise.then(function(monero_utils)
	{
		const mixin = fixedMixin();
		var isRingCT = true;
		var sweeping = isSweep_orZeroWhenAmount === true; // rather than, say, undefined
		//
		// some callback trampoline function declarations…
		function __trampolineFor_success(
			moneroReady_targetDescription_address,
			sentAmount,
			final__payment_id,
			tx_hash,
			tx_fee,
			tx_key,
			mixin,
		) {
			success_fn(
				moneroReady_targetDescription_address,
				sentAmount,
				final__payment_id,
				tx_hash,
				tx_fee,
				tx_key,
				mixin,
			);
		}
		function __trampolineFor_err_withErr(err) {
			failWithErr_fn(err);
		}
		function __trampolineFor_err_withStr(errStr) {
			const err = new Error(errStr);
			console.error(errStr);
			failWithErr_fn(err);
		}
		//
		// parse & normalize the target descriptions by mapping them to Monero addresses & amounts
		var amount = sweeping ? 0 : amount_orZeroWhenSweep;
		const targetDescription = {
			address: target_address,
			amount: amount,
		};
		new_moneroReadyTargetDescriptions_fromTargetDescriptions(
			monero_openalias_utils,
			[targetDescription], // requires a list of descriptions - but SendFunds was
			// not written with multiple target support as MyMonero does not yet support it
			nettype,
			monero_utils,
			function(err, moneroReady_targetDescriptions) {
				if (err) {
					__trampolineFor_err_withErr(err);
					return;
				}
				const invalidOrZeroDestination_errStr =
					"You need to enter a valid destination";
				if (moneroReady_targetDescriptions.length === 0) {
					__trampolineFor_err_withStr(invalidOrZeroDestination_errStr);
					return;
				}
				const moneroReady_targetDescription =
					moneroReady_targetDescriptions[0];
				if (
					moneroReady_targetDescription === null ||
					typeof moneroReady_targetDescription === "undefined"
				) {
					__trampolineFor_err_withStr(invalidOrZeroDestination_errStr);
					return;
				}
				_proceedTo_prepareToSendFundsTo_moneroReady_targetDescription(
					moneroReady_targetDescription,
				);
			},
		);
		function _proceedTo_prepareToSendFundsTo_moneroReady_targetDescription(
			moneroReady_targetDescription,
		) {
			var moneroReady_targetDescription_address =
				moneroReady_targetDescription.address;
			var moneroReady_targetDescription_amount =
				moneroReady_targetDescription.amount;
			//
			var totalAmountWithoutFee_JSBigInt = new JSBigInt(0).add(
				moneroReady_targetDescription_amount,
			);
			console.log(
				"💬  Total to send, before fee: " + sweeping
					? "all"
					: monero_amount_format_utils.formatMoney(totalAmountWithoutFee_JSBigInt),
			);
			if (!sweeping && totalAmountWithoutFee_JSBigInt.compare(0) <= 0) {
				const errStr = "The amount you've entered is too low";
				__trampolineFor_err_withStr(errStr);
				return;
			}
			//
			// Derive/finalize some values…
			var final__payment_id = payment_id;
			var final__pid_encrypt = false; // we don't want to encrypt payment ID unless we find an integrated one
			var address__decode_result;
			try {
				address__decode_result = monero_utils.decode_address(
					moneroReady_targetDescription_address,
					nettype,
				);
			} catch (e) {
				__trampolineFor_err_withStr(
					typeof e === "string" ? e : e.toString(),
				);
				return;
			}
			if (payment_id) {
				if (address__decode_result.intPaymentId) {
					const errStr =
						"Payment ID must be blank when using an Integrated Address";
					__trampolineFor_err_withStr(errStr);
					return;
				} else if (
					monero_utils.is_subaddress(
						moneroReady_targetDescription_address,
						nettype,
					)
				) {
					const errStr =
						"Payment ID must be blank when using a Subaddress";
					__trampolineFor_err_withStr(errStr);
					return;
				}
			}
			if (address__decode_result.intPaymentId) {
				final__payment_id = address__decode_result.intPaymentId;
				final__pid_encrypt = true; // we do want to encrypt if using an integrated address
			} else if (
				monero_paymentID_utils.IsValidPaymentIDOrNoPaymentID(
					final__payment_id,
				) === false
			) {
				const errStr = "Invalid payment ID.";
				__trampolineFor_err_withStr(errStr);
				return;
			}
			//
			_proceedTo_getUnspentOutsUsableForMixin(
				moneroReady_targetDescription_address,
				totalAmountWithoutFee_JSBigInt,
				final__payment_id,
				final__pid_encrypt,
			);
		}
		function _proceedTo_getUnspentOutsUsableForMixin(
			moneroReady_targetDescription_address,
			totalAmountWithoutFee_JSBigInt,
			final__payment_id, // non-existent or valid
			final__pid_encrypt, // true or false
		) {
			preSuccess_nonTerminal_statusUpdate_fn(
				SendFunds_ProcessStep_Code.fetchingLatestBalance,
			);
			hostedMoneroAPIClient.UnspentOuts(
				wallet__public_address,
				wallet__private_keys.view,
				wallet__public_keys.spend,
				wallet__private_keys.spend,
				mixin,
				sweeping,
				function(err, unspentOuts, unusedOuts, dynamic_feePerKB_JSBigInt) {
					if (err) {
						__trampolineFor_err_withErr(err);
						return;
					}
					console.log(
						"Received dynamic per kb fee",
						monero_amount_format_utils.formatMoneySymbol(dynamic_feePerKB_JSBigInt),
					);
					_proceedTo_constructFundTransferListAndSendFundsByUsingUnusedUnspentOutsForMixin(
						moneroReady_targetDescription_address,
						totalAmountWithoutFee_JSBigInt,
						final__payment_id,
						final__pid_encrypt,
						unusedOuts,
						dynamic_feePerKB_JSBigInt,
					);
				},
			);
		}
		function _proceedTo_constructFundTransferListAndSendFundsByUsingUnusedUnspentOutsForMixin(
			moneroReady_targetDescription_address,
			totalAmountWithoutFee_JSBigInt,
			final__payment_id,
			final__pid_encrypt,
			unusedOuts,
			dynamic_feePerKB_JSBigInt,
		) {
			// status: constructing transaction…
			const feePerKB_JSBigInt = dynamic_feePerKB_JSBigInt;
			// Transaction will need at least 1KB fee (or 13KB for RingCT)
			const network_minimumTXSize_kb = /*isRingCT ? */ 13; /* : 1*/
			const network_minimumTXSize_bytes = network_minimumTXSize_kb * 1000 // B -> kB
			const network_minimumFee = new JSBigInt(
				monero_utils.calculate_fee(
					"" + feePerKB_JSBigInt,
					network_minimumTXSize_bytes,
					fee_multiplier_for_priority(simple_priority)
				)
			)
			// ^-- now we're going to try using this minimum fee but the codepath has to be able to be re-entered if we find after constructing the whole tx that it is larger in kb than the minimum fee we're attempting to send it off with
			__reenterable_constructFundTransferListAndSendFunds_findingLowestNetworkFee(
				moneroReady_targetDescription_address,
				totalAmountWithoutFee_JSBigInt,
				final__payment_id,
				final__pid_encrypt,
				unusedOuts,
				feePerKB_JSBigInt, // obtained from server, so passed in
				network_minimumFee,
			);
		}
		function __reenterable_constructFundTransferListAndSendFunds_findingLowestNetworkFee(
			moneroReady_targetDescription_address,
			totalAmountWithoutFee_JSBigInt,
			final__payment_id,
			final__pid_encrypt,
			unusedOuts,
			feePerKB_JSBigInt,
			passedIn_attemptAt_network_minimumFee,
		) {
			// Now we need to establish some values for balance validation and to construct the transaction
			preSuccess_nonTerminal_statusUpdate_fn(
				SendFunds_ProcessStep_Code.calculatingFee,
			);
			//
			var attemptAt_network_minimumFee = passedIn_attemptAt_network_minimumFee; // we may change this if isRingCT
			// const hostingService_chargeAmount = hostedMoneroAPIClient.HostingServiceChargeFor_transactionWithNetworkFee(attemptAt_network_minimumFee)
			var totalAmountIncludingFees;
			if (sweeping) {
				totalAmountIncludingFees = new JSBigInt("18450000000000000000"); //~uint64 max
				console.log("Balance required: all");
			} else {
				totalAmountIncludingFees = totalAmountWithoutFee_JSBigInt.add(
					attemptAt_network_minimumFee,
				); /*.add(hostingService_chargeAmount) NOTE service fee removed for now */
				console.log(
					"Balance required: " +
						monero_amount_format_utils.formatMoneySymbol(totalAmountIncludingFees),
				);
			}
			const usableOutputsAndAmounts = _outputsAndAmountToUseForMixin(
				totalAmountIncludingFees,
				unusedOuts,
				isRingCT,
				sweeping,
			);
			// v-- now if RingCT compute fee as closely as possible before hand
			var usingOuts = usableOutputsAndAmounts.usingOuts;
			var usingOutsAmount = usableOutputsAndAmounts.usingOutsAmount;
			var remaining_unusedOuts = usableOutputsAndAmounts.remaining_unusedOuts; // this is a copy of the pre-mutation usingOuts
			if (/*usingOuts.length > 1 &&*/ isRingCT) {
				var newNeededFee = new JSBigInt(
					monero_utils.calculate_fee(
						"" + feePerKB_JSBigInt,
						monero_utils.estimate_rct_tx_size(
							usingOuts.length, mixin, 2
						),
						fee_multiplier_for_priority(simple_priority)
					)
				);
				// if newNeededFee < neededFee, use neededFee instead (should only happen on the 2nd or later times through (due to estimated fee being too low))
				if (newNeededFee.compare(attemptAt_network_minimumFee) < 0) {
					newNeededFee = attemptAt_network_minimumFee;
				}
				if (sweeping) {
					/* 
					// When/if sending to multiple destinations supported, uncomment and port this:					
					if (dsts.length !== 1) {
						deferred.reject("Sweeping to multiple accounts is not allowed");
						return;
					}
					*/
					totalAmountWithoutFee_JSBigInt = usingOutsAmount.subtract(
						newNeededFee,
					);
					if (totalAmountWithoutFee_JSBigInt.compare(0) < 1) {
						const errStr = `Your spendable balance is too low. Have ${monero_amount_format_utils.formatMoney(
							usingOutsAmount,
						)} ${
							monero_config.coinSymbol
						} spendable, need ${monero_amount_format_utils.formatMoney(
							newNeededFee,
						)} ${monero_config.coinSymbol}.`;
						__trampolineFor_err_withStr(errStr);
						return;
					}
					totalAmountIncludingFees = totalAmountWithoutFee_JSBigInt.add(
						newNeededFee,
					);
				} else {
					totalAmountIncludingFees = totalAmountWithoutFee_JSBigInt.add(
						newNeededFee,
					);
					// add outputs 1 at a time till we either have them all or can meet the fee
					while (
						usingOutsAmount.compare(totalAmountIncludingFees) < 0 &&
						remaining_unusedOuts.length > 0
					) {
						const out = _popAndReturnRandomElementFromList(
							remaining_unusedOuts,
						);
						console.log(
							"Using output: " +
								monero_amount_format_utils.formatMoney(out.amount) +
								" - " +
								JSON.stringify(out),
						);
						// and recalculate invalidated values
						newNeededFee = new JSBigInt(
							monero_utils.calculate_fee(
								"" + feePerKB_JSBigInt,
								monero_utils.estimate_rct_tx_size(
									usingOuts.length, mixin, 2
								),
								fee_multiplier_for_priority(simple_priority)
							)
						);
						totalAmountIncludingFees = totalAmountWithoutFee_JSBigInt.add(
							newNeededFee,
						);
					}
				}
				console.log(
					"New fee: " +
						monero_amount_format_utils.formatMoneySymbol(newNeededFee) +
						" for " +
						usingOuts.length +
						" inputs",
				);
				attemptAt_network_minimumFee = newNeededFee;
			}
			console.log(
				"~ Balance required: " +
					monero_amount_format_utils.formatMoneySymbol(totalAmountIncludingFees),
			);
			// Now we can validate available balance with usingOutsAmount (TODO? maybe this check can be done before selecting outputs?)
			const usingOutsAmount_comparedTo_totalAmount = usingOutsAmount.compare(
				totalAmountIncludingFees,
			);
			if (usingOutsAmount_comparedTo_totalAmount < 0) {
				const errStr = `Your spendable balance is too low. Have ${monero_amount_format_utils.formatMoney(
					usingOutsAmount,
				)} ${
					monero_config.coinSymbol
				} spendable, need ${monero_amount_format_utils.formatMoney(
					totalAmountIncludingFees,
				)} ${monero_config.coinSymbol}.`;
				__trampolineFor_err_withStr(errStr);
				return;
			}
			//
			// Must calculate change..
			var changeAmount = JSBigInt("0"); // to initialize
			if (usingOutsAmount_comparedTo_totalAmount > 0) {
				if (sweeping) {
					throw "Unexpected usingOutsAmount_comparedTo_totalAmount > 0 && sweeping";
				}
				changeAmount = usingOutsAmount.subtract(
					totalAmountIncludingFees,
				);
			}
			console.log("Calculated changeAmount:", changeAmount);
			//
			// first, grab RandomOuts, then enter __createTx
			preSuccess_nonTerminal_statusUpdate_fn(
				SendFunds_ProcessStep_Code.fetchingDecoyOutputs,
			);
			hostedMoneroAPIClient.RandomOuts(usingOuts, mixin, function(
				err,
				amount_outs,
			) {
				if (err) {
					__trampolineFor_err_withErr(err);
					return;
				}
				__createTxAndAttemptToSend(amount_outs);
			});
			//
			function __createTxAndAttemptToSend(mix_outs) {
				preSuccess_nonTerminal_statusUpdate_fn(
					SendFunds_ProcessStep_Code.constructingTransaction,
				);
				function printDsts(dsts) 
				{
					for (var i = 0; i < dsts.length; i++) {
						console.log(dsts[i].address + ": " + monero_amount_format_utils.formatMoneyFull(dsts[i].amount))
					}
				}
				var create_transaction__retVals;
				try {
					create_transaction__retVals = monero_utils.create_signed_transaction(
						wallet__public_address,
						wallet__private_keys,
						target_address,
						usingOuts,
						mix_outs,
						mixin,
						totalAmountWithoutFee_JSBigInt.toString(), // even though it's in dsts, sending it directly as core C++ takes it
						changeAmount.toString(),
						attemptAt_network_minimumFee.toString(), // must serialize for IPC
						final__payment_id,
						0,
						isRingCT,
						nettype,
					);
					console.log("got back", create_transaction__retVals)
				} catch (e) {
					var errStr;
					if (e) {
						errStr = typeof e == "string" ? e : e.toString();
					} else {
						errStr = "Failed to create transaction with unknown error.";
					}
					__trampolineFor_err_withStr(errStr);
					return;
				}
				console.log("created tx: ", JSON.stringify(create_transaction__retVals));
				//
				if (typeof create_transaction__retVals.err_msg !== 'undefined' && create_transaction__retVals.err_msg) {
					// actually not expecting this! but just in case..
					__trampolineFor_err_withStr(create_transaction__retVals.err_msg);
					return;
				}
				var serialized_signedTx = create_transaction__retVals.signed_serialized_tx;
				var tx_hash = create_transaction__retVals.tx_hash;
				var tx_key = create_transaction__retVals.tx_key;
				console.log("tx serialized: " + serialized_signedTx);
				console.log("Tx hash: " + tx_hash);
				console.log("Tx key: " + tx_key);
				//
				// work out per-kb fee for transaction and verify that it's enough
				var txBlobBytes = serialized_signedTx.length / 2;
				var numKB = Math.floor(txBlobBytes / 1024);
				if (txBlobBytes % 1024) {
					numKB++;
				}
				console.log(
					txBlobBytes +
						" bytes; current fee: " +
						monero_amount_format_utils.formatMoneyFull(attemptAt_network_minimumFee) +
						"",
				);
				const feeActuallyNeededByNetwork = new JSBigInt(
					monero_utils.calculate_fee(
						"" + feePerKB_JSBigInt,
						txBlobBytes,
						fee_multiplier_for_priority(simple_priority)
					)
				)
				// if we need a higher fee
				if (
					feeActuallyNeededByNetwork.compare(
						attemptAt_network_minimumFee,
					) > 0
				) {
					console.log(
						"💬  Need to reconstruct the tx with enough of a network fee. Previous fee: " +
							monero_amount_format_utils.formatMoneyFull(
								attemptAt_network_minimumFee,
							) +
							" New fee: " +
							monero_amount_format_utils.formatMoneyFull(
								feeActuallyNeededByNetwork,
							),
					);
					// this will update status back to .calculatingFee
					__reenterable_constructFundTransferListAndSendFunds_findingLowestNetworkFee(
						moneroReady_targetDescription_address,
						totalAmountWithoutFee_JSBigInt,
						final__payment_id,
						final__pid_encrypt,
						unusedOuts,
						feePerKB_JSBigInt,
						feeActuallyNeededByNetwork, // we are re-entering this codepath after changing this feeActuallyNeededByNetwork
					);
					//
					return;
				}
				//
				// generated with correct per-kb fee
				const final_networkFee = attemptAt_network_minimumFee; // just to make things clear
				console.log(
					"💬  Successful tx generation, submitting tx. Going with final_networkFee of ",
					monero_amount_format_utils.formatMoney(final_networkFee),
				);
				// status: submitting…
				preSuccess_nonTerminal_statusUpdate_fn(
					SendFunds_ProcessStep_Code.submittingTransaction,
				);
				hostedMoneroAPIClient.SubmitSerializedSignedTransaction(
					wallet__public_address,
					wallet__private_keys.view,
					serialized_signedTx,
					function(err) {
						if (err) {
							__trampolineFor_err_withStr(
								"Something unexpected occurred when submitting your transaction: " +
									err,
							);
							return;
						}
						const tx_fee = final_networkFee; /*.add(hostingService_chargeAmount) NOTE: Service charge removed to reduce bloat for now */
						__trampolineFor_success(
							moneroReady_targetDescription_address,
							sweeping
								? parseFloat(
										monero_amount_format_utils.formatMoneyFull(
											totalAmountWithoutFee_JSBigInt,
										),
								  )
								: amount,
							final__payment_id,
							tx_hash,
							tx_fee,
							tx_key,
							mixin,
						); // 🎉
					},
				);
			}
		}
	});
}
exports.SendFunds = SendFunds;
//
function new_moneroReadyTargetDescriptions_fromTargetDescriptions(
	monero_openalias_utils,
	targetDescriptions,
	nettype,
	monero_utils,
	fn, // fn: (err, moneroReady_targetDescriptions) -> Void
	// TODO: remove this fn - this is a sync method now
) {
	// parse & normalize the target descriptions by mapping them to currency (Monero)-ready addresses & amounts
	// some pure function declarations for the map we'll do on targetDescriptions
	//
	const moneroReady_targetDescriptions = [];
	for (var i = 0 ; i < targetDescriptions.length ; i++) {
		const targetDescription = targetDescriptions[i];
		if (!targetDescription.address && !targetDescription.amount) {
			// PSNote: is this check rigorous enough?
			const errStr =
				"Please supply a target address and a target amount.";
			const err = new Error(errStr);
			fn(err);
			return;
		}
		const targetDescription_address = targetDescription.address;
		const targetDescription_amount = "" + targetDescription.amount; // we are converting it to a string here because parseMoney expects a string
		// now verify/parse address and amount
		if (
			monero_openalias_utils.DoesStringContainPeriodChar_excludingAsXMRAddress_qualifyingAsPossibleOAAddress(
				targetDescription_address,
			) == true
		) {
			throw "You must resolve this OA address to a Monero address before calling SendFunds";
		}
		// otherwise this should be a normal, single Monero public address
		try {
			monero_utils.decode_address(targetDescription_address, nettype); // verify that the address is valid
		} catch (e) {
			const errStr =
				"Couldn't decode address " +
				targetDescription_address +
				": " +
				e;
			const err = new Error(errStr);
			fn(err);
			return;
		}
		// amount:
		var moneroReady_amountToSend; // possibly need this ; here for the JS parser
		try {
			moneroReady_amountToSend = monero_amount_format_utils.parseMoney(
				targetDescription_amount,
			);
		} catch (e) {
			const errStr =
				"Couldn't parse amount " +
				targetDescription_amount +
				": " +
				e;
			const err = new Error(errStr);
			fn(err);
			return;
		}
		moneroReady_targetDescriptions.push({
			address: targetDescription_address,
			amount: moneroReady_amountToSend,
		});
	}
	fn(null, moneroReady_targetDescriptions);
}
function __randomIndex(list) {
	return Math.floor(Math.random() * list.length);
}
function _popAndReturnRandomElementFromList(list) {
	var idx = __randomIndex(list);
	var val = list[idx];
	list.splice(idx, 1);
	//
	return val;
}
function _outputsAndAmountToUseForMixin(
	target_amount,
	unusedOuts,
	isRingCT,
	sweeping,
) {
	console.log(
		"Selecting outputs to use. target: " +
			monero_amount_format_utils.formatMoney(target_amount),
	);
	var toFinalize_usingOutsAmount = new JSBigInt(0);
	const toFinalize_usingOuts = [];
	const remaining_unusedOuts = unusedOuts.slice(); // take copy so as to prevent issue if we must re-enter tx building fn if fee too low after building
	while (
		toFinalize_usingOutsAmount.compare(target_amount) < 0 &&
		remaining_unusedOuts.length > 0
	) {
		var out = _popAndReturnRandomElementFromList(remaining_unusedOuts);
		if (!isRingCT && out.rct) {
			// out.rct is set by the server
			continue; // skip rct outputs if not creating rct tx
		}
		const out_amount_JSBigInt = new JSBigInt(out.amount);
		if (out_amount_JSBigInt.compare(monero_config.dustThreshold) < 0) {
			// amount is dusty..
			if (sweeping == false) {
				console.log(
					"Not sweeping, and found a dusty (though maybe mixable) output... skipping it!",
				);
				continue;
			}
			if (!out.rct || typeof out.rct === "undefined") {
				console.log(
					"Sweeping, and found a dusty but unmixable (non-rct) output... skipping it!",
				);
				continue;
			} else {
				console.log(
					"Sweeping and found a dusty but mixable (rct) amount... keeping it!",
				);
			}
		}
		toFinalize_usingOuts.push(out);
		toFinalize_usingOutsAmount = toFinalize_usingOutsAmount.add(
			out_amount_JSBigInt,
		);
		console.log(
			"Using output: " +
				monero_amount_format_utils.formatMoney(out_amount_JSBigInt) +
				" - " +
				JSON.stringify(out),
		);
	}
	return {
		usingOuts: toFinalize_usingOuts,
		usingOutsAmount: toFinalize_usingOutsAmount,
		remaining_unusedOuts: remaining_unusedOuts,
	};
}

function decompose_amount_into_digits(amount) 
{
	/*if (dust_threshold === undefined) {
		dust_threshold = config.dustThreshold;
	}*/
	amount = amount.toString();
	var ret = [];
	while (amount.length > 0) {
		//split all the way down since v2 fork
		/*var remaining = new JSBigInt(amount);
		if (remaining.compare(config.dustThreshold) <= 0) {
			if (remaining.compare(0) > 0) {
				ret.push(remaining);
			}
			break;
		}*/
		//check so we don't create 0s
		if (amount[0] !== "0") {
			var digit = amount[0];
			while (digit.length < amount.length) {
				digit += "0";
			}
			ret.push(new JSBigInt(digit));
		}
		amount = amount.slice(1);
	}
	return ret;
}
function decompose_tx_destinations(dsts, rct, serializeForIPC) 
{
	var out = [];
	if (rct) {
		for (var i = 0; i < dsts.length; i++) {
			out.push({
				address: dsts[i].address,
				amount: serializeForIPC ? dsts[i].amount.toString() : dsts[i].amount,
			});
		}
	} else {
		for (var i = 0; i < dsts.length; i++) {
			var digits = decompose_amount_into_digits(dsts[i].amount);
			for (var j = 0; j < digits.length; j++) {
				if (digits[j].compare(0) > 0) {
					out.push({
						address: dsts[i].address,
						amount: serializeForIPC ? digits[j].toString() : digits[j],
					});
				}
			}
		}
	}
	return out.sort(function(a, b) {
		return a["amount"] - b["amount"];
	});
};