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
const async = require("async");
//
const monero_config = require("./monero_config");
const monero_utils = require("./monero_cryptonote_utils_instance");
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
function estimateRctSize(inputs, mixin, outputs, extra_size, bulletproof) 
{
	// keeping this in JS instead of C++ for now b/c it's much faster to access, and we don't have to make it asynchronous by waiting for the module to load
	bulletproof = bulletproof == true ? true : false
	extra_size = extra_size || 40
	//
	var size = 0;
	// tx prefix
	// first few bytes
	size += 1 + 6;
	size += inputs * (1 + 6 + (mixin + 1) * 2 + 32); 
	// vout
	size += outputs * (6 + 32);
	// extra
	size += extra_size;
	// rct signatures
	// type
	size += 1;
	// rangeSigs
	if (bulletproof)
		size += ((2*6 + 4 + 5)*32 + 3) * outputs;
	else
		size += (2*64*32+32+64*32) * outputs;
	// MGs
	size += inputs * (64 * (mixin + 1) + 32);
	// mixRing - not serialized, can be reconstructed
	/* size += 2 * 32 * (mixin+1) * inputs; */
	// pseudoOuts
	size += 32 * inputs;
	// ecdhInfo
	size += 2 * 32 * outputs;
	// outPk - only commitment is saved
	size += 32 * outputs;
	// txnFee
	size += 4;
	// const logStr = `estimated rct tx size for ${inputs} at mixin ${mixin} and ${outputs} : ${size}  (${((32 * inputs/*+1*/) + 2 * 32 * (mixin+1) * inputs + 32 * outputs)}) saved)`
	// console.log(logStr)

	return size;
};
function calculate_fee(fee_per_kb_JSBigInt, numberOf_bytes, fee_multiplier) {
	const numberOf_kB_JSBigInt = new JSBigInt(
		(numberOf_bytes + 1023.0) / 1024.0,
	); // i.e. ceil
	//
	return calculate_fee__kb(
		fee_per_kb_JSBigInt,
		numberOf_kB_JSBigInt,
		fee_multiplier,
	);
}
function calculate_fee__kb(fee_per_kb_JSBigInt, numberOf_kb, fee_multiplier) {
	const numberOf_kB_JSBigInt = new JSBigInt(numberOf_kb);
	const fee = fee_per_kb_JSBigInt
		.multiply(fee_multiplier)
		.multiply(numberOf_kB_JSBigInt);
	//
	return fee;
}
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
function EstimatedTransaction_networkFee(
	nonZero_mixin_int,
	feePerKB_JSBigInt,
	simple_priority,
) {
	const numberOf_inputs = 2; // this might change -- might select inputs
	const numberOf_outputs =
		1 /*dest*/ + 1 /*change*/ + 0; /*no mymonero fee presently*/
	// TODO: update est tx size for bulletproofs
	// TODO: normalize est tx size fn naming
	const estimated_txSize = estimateRctSize(
		numberOf_inputs,
		nonZero_mixin_int,
		numberOf_outputs,
	);
	const estimated_fee = calculate_fee(
		feePerKB_JSBigInt,
		estimated_txSize,
		fee_multiplier_for_priority(simple_priority),
	);
	//
	return estimated_fee;
}
exports.EstimatedTransaction_networkFee = EstimatedTransaction_networkFee;
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
	mixin,
	simple_priority,
	preSuccess_nonTerminal_statusUpdate_fn, // (_ stepCode: SendFunds_ProcessStep_Code) -> Void
	success_fn,
	// success_fn: (
	//		moneroReady_targetDescription_address?,
	//		sentAmount?,
	//		final__payment_id?,
	//		tx_hash?,
	//		tx_fee?
	// )
	failWithErr_fn,
	// failWithErr_fn: (
	//		err
	// )
) {
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
	) {
		success_fn(
			moneroReady_targetDescription_address,
			sentAmount,
			final__payment_id,
			tx_hash,
			tx_fee,
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
	if (mixin < thisFork_minMixin()) {
		__trampolineFor_err_withStr("Ringsize is below the minimum.");
		return;
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
		const network_minimumFee = calculate_fee__kb(
			feePerKB_JSBigInt,
			network_minimumTXSize_kb,
			fee_multiplier_for_priority(simple_priority),
		);
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
			var newNeededFee = calculate_fee(
				feePerKB_JSBigInt,
				estimateRctSize(usingOuts.length, mixin, 2),
				fee_multiplier_for_priority(simple_priority),
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
					newNeededFee = calculate_fee(
						feePerKB_JSBigInt,
						estimateRctSize(
							usingOuts.length,
							mixin,
							2,
						),
						fee_multiplier_for_priority(simple_priority),
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
		// Now we can put together the list of fund transfers we need to perform
		const fundTransferDescriptions = []; // to build…
		// I. the actual transaction the user is asking to do
		fundTransferDescriptions.push({
			address: moneroReady_targetDescription_address,
			amount: totalAmountWithoutFee_JSBigInt,
		});
		// II. the fee that the hosting provider charges
		// NOTE: The fee has been removed for RCT until a later date
		// fundTransferDescriptions.push({
		//			 address: hostedMoneroAPIClient.HostingServiceFeeDepositAddress(),
		//			 amount: hostingService_chargeAmount
		// })
		// III. some amount of the total outputs will likely need to be returned to the user as "change":
		if (usingOutsAmount_comparedTo_totalAmount > 0) {
			if (sweeping) {
				throw "Unexpected usingOutsAmount_comparedTo_totalAmount > 0 && sweeping";
			}
			var changeAmount = usingOutsAmount.subtract(
				totalAmountIncludingFees,
			);
			console.log("changeAmount", changeAmount);
			if (isRingCT) {
				// for RCT we don't presently care about dustiness so add entire change amount
				console.log(
					"Sending change of " +
						monero_amount_format_utils.formatMoneySymbol(changeAmount) +
						" to " +
						wallet__public_address,
				);
				fundTransferDescriptions.push({
					address: wallet__public_address,
					amount: changeAmount,
				});
			} else {
				// pre-ringct
				// do not give ourselves change < dust threshold
				var changeAmountDivRem = changeAmount.divRem(
					monero_config.dustThreshold,
				);
				console.log("💬  changeAmountDivRem", changeAmountDivRem);
				if (changeAmountDivRem[1].toString() !== "0") {
					// miners will add dusty change to fee
					console.log(
						"💬  Miners will add change of " +
							monero_amount_format_utils.formatMoneyFullSymbol(
								changeAmountDivRem[1],
							) +
							" to transaction fee (below dust threshold)",
					);
				}
				if (changeAmountDivRem[0].toString() !== "0") {
					// send non-dusty change to our address
					var usableChange = changeAmountDivRem[0].multiply(
						monero_config.dustThreshold,
					);
					console.log(
						"💬  Sending change of " +
							monero_amount_format_utils.formatMoneySymbol(usableChange) +
							" to " +
							wallet__public_address,
					);
					fundTransferDescriptions.push({
						address: wallet__public_address,
						amount: usableChange,
					});
				}
			}
		} else if (usingOutsAmount_comparedTo_totalAmount == 0) {
			// this should always fire when sweeping
			if (isRingCT) {
				// then create random destination to keep 2 outputs always in case of 0 change
				const fakeAddress = monero_utils.new_fake_address_for_rct_tx(
					nettype,
				);
				console.log(
					"Sending 0 XMR to a fake address to keep tx uniform (no change exists): " +
						fakeAddress,
				);
				fundTransferDescriptions.push({
					address: fakeAddress,
					amount: 0,
				});
			}
		}
		console.log(
			"fundTransferDescriptions so far",
			fundTransferDescriptions,
		);
		if (mixin < 0 || isNaN(mixin)) {
			__trampolineFor_err_withStr("Invalid mixin");
			return;
		}
		if (mixin > 0) {
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
			return;
		} else {
			// mixin === 0: -- PSNOTE: is that even allowed?
			__createTxAndAttemptToSend();
		}
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
			var signedTx;
			try {
				console.log("Destinations: ");
				printDsts(fundTransferDescriptions); // TODO: port this out
				//
				var realDestViewKey; // need to get viewkey for encrypting here, because of splitting and sorting
				if (final__pid_encrypt) {
					realDestViewKey = monero_utils.decode_address(
						moneroReady_targetDescription_address,
						nettype,
					).view;
					console.log("got realDestViewKey", realDestViewKey);
				}
				console.log("fundTransferDescriptions", fundTransferDescriptions)
				var IPCsafe_splitDestinations = decompose_tx_destinations( // TODO: port this out
					fundTransferDescriptions,
					isRingCT,
					true // serialize (convert JSBigInts to strings for IPC)
				);
				printDsts(IPCsafe_splitDestinations);
				//
				signedTx = monero_utils.create_transaction__IPCsafe(
					wallet__public_keys,
					wallet__private_keys,
					IPCsafe_splitDestinations,
					usingOuts,
					mix_outs,
					mixin,
					attemptAt_network_minimumFee.toString(), // must serialize for IPC
					final__payment_id,
					final__pid_encrypt,
					realDestViewKey,
					0,
					isRingCT,
					nettype,
				);
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
			console.log("signed tx: ", JSON.stringify(signedTx));
			//
			var serialized_signedTx;
			var tx_hash;
			if (signedTx.version === 1) {
				serialized_signedTx = monero_utils.serialize_tx(signedTx);
				tx_hash = monero_utils.cn_fast_hash(serialized_signedTx);
			} else {
				const raw_tx_and_hash = monero_utils.serialize_rct_tx_with_hash(
					signedTx,
				);
				serialized_signedTx = raw_tx_and_hash.raw;
				tx_hash = raw_tx_and_hash.hash;
			}
			console.log("tx serialized: " + serialized_signedTx);
			console.log("Tx hash: " + tx_hash);
			//
			// work out per-kb fee for transaction and verify that it's enough
			var txBlobBytes = serialized_signedTx.length / 2;
			var numKB = Math.floor(txBlobBytes / 1024);
			if (txBlobBytes % 1024) {
				numKB++;
			}
			console.log(
				txBlobBytes +
					" bytes <= " +
					numKB +
					" KB (current fee: " +
					monero_amount_format_utils.formatMoneyFull(attemptAt_network_minimumFee) +
					")",
			);
			const feeActuallyNeededByNetwork = calculate_fee__kb(
				feePerKB_JSBigInt,
				numKB,
				fee_multiplier_for_priority(simple_priority),
			);
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
					); // 🎉
				},
			);
		}
	}
}
exports.SendFunds = SendFunds;
//
function new_moneroReadyTargetDescriptions_fromTargetDescriptions(
	monero_openalias_utils,
	targetDescriptions,
	nettype,
	fn, // fn: (err, moneroReady_targetDescriptions) -> Void
) {
	// parse & normalize the target descriptions by mapping them to currency (Monero)-ready addresses & amounts
	// some pure function declarations for the map we'll do on targetDescriptions
	async.mapSeries(
		targetDescriptions,
		function(targetDescription, cb) {
			if (!targetDescription.address && !targetDescription.amount) {
				// PSNote: is this check rigorous enough?
				const errStr =
					"Please supply a target address and a target amount.";
				const err = new Error(errStr);
				cb(err);
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
				cb(err);
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
				cb(err);
				return;
			}
			cb(null, {
				address: targetDescription_address,
				amount: moneroReady_amountToSend,
			});
		},
		function(err, moneroReady_targetDescriptions) {
			fn(err, moneroReady_targetDescriptions);
		},
	);
}
//
function randomFloat_unit()
{ // https://stackoverflow.com/questions/34575635/cryptographically-secure-float?answertab=oldest#tab-top
	// I've produced this function to replace Math.random, which we are black-holing to prevent emscripten from ever being able to call it (not that it is)
	let buffer = new ArrayBuffer(8); // A buffer with just the right size to convert to Float64
	let ints = new Int8Array(buffer); // View it as an Int8Array and fill it with 8 random ints
	window.crypto.getRandomValues(ints);
	//
	// Set the sign (ints[7][7]) to 0 and the
	// exponent (ints[7][6]-[6][5]) to just the right size 
	// (all ones except for the highest bit)
	ints[7] = 63;
	ints[6] |= 0xf0;
	//
	// Now view it as a Float64Array, and read the one float from it
	let float = new DataView(buffer).getFloat64(0, true) - 1;
	//
	return float; 

// Probably another way of doing this if the above is not good enough:
/*
	if (typeof crypto !== "undefined") {
	    var randomBuffer = new Uint8Array(1);
        crypto.getRandomValues(randomBuffer);
        //
        return randomBuffer[0] / 256.0;
	} else if (ENVIRONMENT_IS_NODE) {
		return require("crypto")["randomBytes"](1)[0] / 256.0
	} else {
		throw "Unable to support randomFloat_unit without window.crypto or a \"crypto\" module"
	}
*/
} 
function __randomIndex(list) {
	return Math.floor(randomFloat_unit() * list.length);
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