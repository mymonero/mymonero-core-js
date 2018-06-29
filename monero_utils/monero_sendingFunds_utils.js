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
const monero_paymentID_utils = require("./monero_paymentID_utils");
const JSBigInt = require("../cryptonote_utils/biginteger").BigInteger;

const V7_MIN_MIXIN = 6;

function _mixinToRingsize(mixin) {
	return mixin + 1;
}
function minMixin() {
	return V7_MIN_MIXIN;
}
function minRingSize() {
	return _mixinToRingsize(minMixin());
}

exports.minMixin = minMixin;
exports.minRingSize = minRingSize;

function fixedMixin() {
	return minMixin(); /* using the monero app default to remove MM user identifiers */
}
function fixedRingsize() {
	return _mixinToRingsize(fixedMixin());
}
exports.fixedMixin = fixedMixin;
exports.fixedRingsize = fixedRingsize;

const DEFAULT_FEE_PRIORITY = 1;

exports.DEFAULT_FEE_PRIORITY = DEFAULT_FEE_PRIORITY;

function calculateFee(feePerKBJSBigInt, numOfBytes, feeMultiplier) {
	const numberOf_kB_JSBigInt = new JSBigInt((numOfBytes + 1023.0) / 1024.0); // i.e. ceil

	return calculateFeeKb(
		feePerKBJSBigInt,
		numberOf_kB_JSBigInt,
		feeMultiplier,
	);
}
function calculateFeeKb(feePerKBJSBigInt, numOfBytes, feeMultiplier) {
	const numberOf_kB_JSBigInt = new JSBigInt(numOfBytes);
	const fee = feePerKBJSBigInt
		.multiply(feeMultiplier)
		.multiply(numberOf_kB_JSBigInt);

	return fee;
}

function multiplyFeePriority(prio) {
	const fee_multiplier = [1, 4, 20, 166];

	const priority = prio || DEFAULT_FEE_PRIORITY;

	if (priority <= 0 || priority > fee_multiplier.length) {
		throw "fee_multiplier_for_priority: simple_priority out of bounds";
	}
	const priority_idx = priority - 1;
	return fee_multiplier[priority_idx];
}

function estimatedTransactionNetworkFee(
	nonZeroMixinInt,
	feePerKBJSBigInt,
	simplePriority,
) {
	const numOfInputs = 2; // this might change -- might select inputs
	const numOfOutputs =
		1 /*dest*/ + 1 /*change*/ + 0; /*no mymonero fee presently*/
	// TODO: update est tx size for bulletproofs
	// TODO: normalize est tx size fn naming
	const estimatedTxSize = monero_utils.estimateRctSize(
		numOfInputs,
		nonZeroMixinInt,
		numOfOutputs,
	);
	const estFee = calculateFee(
		feePerKBJSBigInt,
		estimatedTxSize,
		multiplyFeePriority(simplePriority),
	);
	//
	return estFee;
}
exports.EstimatedTransaction_networkFee = estimatedTransactionNetworkFee;
//
const sendFundStatus = {
	fetching_latest_balance: 1,
	calculating_fee: 2,
	fetching_decoy_outputs: 3, // may get skipped if 0 mixin
	constructing_transaction: 4, // may go back to .calculatingFee
	submitting_transaction: 5,
};
exports.SendFunds_ProcessStep_Code = sendFundStatus;
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
	targetAddress, // currency-ready wallet address, but not an OpenAlias address (resolve before calling)
	nettype,
	amountorZeroWhenSweep, // number - value will be ignoring for sweep
	isSweeporZeroWhenAmount, // send true to sweep - amount_orZeroWhenSweep will be ignored
	senderPublicAddress,
	senderPrivateKeys,
	senderPublicKeys,
	nodeAPI, // TODO: possibly factor this dependency
	moneroOpenaliasUtils,
	pid,
	mixin,
	simplePriority,
	updateStatusCb, // (_ stepCode: SendFunds_ProcessStep_Code) -> Void
	successCb,
	// success_fn: (
	//		moneroReady_targetDescription_address?,
	//		sentAmount?,
	//		final__payment_id?,
	//		tx_hash?,
	//		tx_fee?
	// )
	errCb,
	// failWithErr_fn: (
	//		err
	// )
) {
	const isRingCT = true;
	const sweeping = isSweeporZeroWhenAmount === true; // rather than, say, undefined

	if (mixin < minMixin()) {
		return errCb(Error("Ringsize is below the minimum."));
	}
	//
	// parse & normalize the target descriptions by mapping them to Monero addresses & amounts
	const target_amount = sweeping ? 0 : amountorZeroWhenSweep;
	const target = {
		address: targetAddress,
		amount: target_amount,
	};
	resolveTargets(
		moneroOpenaliasUtils,
		[target], // requires a list of descriptions - but SendFunds was
		// not written with multiple target support as MyMonero does not yet support it
		nettype,
		function(_err, _resolved_targets) {
			if (_err) {
				return errCb(_err);
			}

			if (_resolved_targets.length === 0) {
				return errCb(Error("You need to enter a valid destination"));
			}
			const single_target = _resolved_targets[0];
			if (!single_target) {
				return errCb(Error("You need to enter a valid destination"));
			}
			_prepare_to_send_to_target(single_target);
		},
	);
	function _prepare_to_send_to_target(resolvedTarget) {
		const _targetAddress = resolvedTarget.address;
		const _target_amount = resolvedTarget.amount;
		//
		var feelessTotalJSBigInt = new JSBigInt(_target_amount);

		const feeless_total = sweeping
			? "all"
			: monero_utils.formatMoney(feelessTotalJSBigInt);
		console.log(`💬  Total to send, before fee: ${feeless_total}`);

		if (!sweeping && feelessTotalJSBigInt.compare(0) <= 0) {
			return errCb(Error("The amount you've entered is too low"));
		}
		//
		// Derive/finalize some values…
		let _pid = pid;
		let encryptPid = false; // we don't want to encrypt payment ID unless we find an integrated one

		// NOTE: refactor this out, its already done in resolve_targets
		var decoded_address;
		try {
			decoded_address = monero_utils.decode_address(
				_targetAddress,
				nettype,
			);
		} catch (e) {
			return errCb(Error(e.toString()));
		}

		// assert that the target address is not of type integrated nor subaddress
		// if a payment id is included
		if (pid) {
			if (decoded_address.intPaymentId) {
				return errCb(
					Error(
						"Payment ID must be blank when using an Integrated Address",
					),
				);
			} else if (monero_utils.is_subaddress(_targetAddress, nettype)) {
				return errCb(
					Error("Payment ID must be blank when using a Subaddress"),
				);
			}
		}

		// if the target address is integrated
		// then encrypt the payment id
		// and make sure its also valid
		if (decoded_address.intPaymentId) {
			_pid = decoded_address.intPaymentId;
			encryptPid = true;
		} else if (
			!monero_paymentID_utils.IsValidPaymentIDOrNoPaymentID(_pid)
		) {
			return errCb(Error("Invalid payment ID."));
		}

		_getUsableUnspentOutsForMixin(
			_targetAddress,
			feelessTotalJSBigInt,
			_pid,
			encryptPid,
		);
	}
	function _getUsableUnspentOutsForMixin(
		_targetAddress,
		_feelessTotalJSBigInt,
		_pid, // non-existent or valid
		_encryptPid, // true or false
	) {
		updateStatusCb(sendFundStatus.fetching_latest_balance);
		nodeAPI.UnspentOuts(
			senderPublicAddress,
			senderPrivateKeys.view,
			senderPublicKeys.spend,
			senderPrivateKeys.spend,
			mixin,
			sweeping,
			function(err, unspentOuts, __unusedOuts, __dynFeePerKBJSBigInt) {
				if (err) {
					return errCb(err);
				}
				console.log(
					"Received dynamic per kb fee",
					monero_utils.formatMoneySymbol(__dynFeePerKBJSBigInt),
				);
				_proceedTo_constructFundTransferListAndSendFundsByUsingUnusedUnspentOutsForMixin(
					_targetAddress,
					_feelessTotalJSBigInt,
					_pid,
					_encryptPid,
					__unusedOuts,
					__dynFeePerKBJSBigInt,
				);
			},
		);
	}
	function _proceedTo_constructFundTransferListAndSendFundsByUsingUnusedUnspentOutsForMixin(
		_targetAddress,
		_feelessTotalAmountJSBigInt,
		_pid,
		_encryptPid,
		_unusedOuts,
		_dynamicFeePerKBJSBigInt,
	) {
		// status: constructing transaction…
		const _feePerKBJSBigInt = _dynamicFeePerKBJSBigInt;
		// Transaction will need at least 1KB fee (or 13KB for RingCT)
		const _minNetworkTxSizeKb = /*isRingCT ? */ 13; /* : 1*/
		const _estMinNetworkFee = calculateFeeKb(
			_feePerKBJSBigInt,
			_minNetworkTxSizeKb,
			multiplyFeePriority(simplePriority),
		);
		// now we're going to try using this minimum fee but the function will be called again
		// if we find after constructing the whole tx that it is larger in kb than
		// the minimum fee we're attempting to send it off with
		_attempt_to_constructFundTransferListAndSendFunds_findingLowestNetworkFee(
			_targetAddress,
			_feelessTotalAmountJSBigInt,
			_pid,
			_encryptPid,
			_unusedOuts,
			_feePerKBJSBigInt, // obtained from server, so passed in
			_estMinNetworkFee,
		);
	}
	function _attempt_to_constructFundTransferListAndSendFunds_findingLowestNetworkFee(
		_targetAddress,
		_feelessTotalJSBigInt,
		_pid,
		_encryptPid,
		_unusedOuts,
		_feePerKBJSBigInt,
		_estMinNetworkFee,
	) {
		// Now we need to establish some values for balance validation and to construct the transaction
		updateStatusCb(sendFundStatus.calculating_fee);

		let estMinNetworkFee = _estMinNetworkFee; // we may change this if isRingCT
		// const hostingService_chargeAmount = hostedMoneroAPIClient.HostingServiceChargeFor_transactionWithNetworkFee(attemptAt_network_minimumFee)
		let total_amount;
		if (sweeping) {
			total_amount = new JSBigInt("18450000000000000000"); //~uint64 max
			console.log("Balance required: all");
		} else {
			total_amount = _feelessTotalJSBigInt.add(
				estMinNetworkFee,
			); /*.add(hostingService_chargeAmount) NOTE service fee removed for now */
			console.log(
				"Balance required: " +
					monero_utils.formatMoneySymbol(total_amount),
			);
		}
		const usableOutputsAndAmounts = outputsAndAmountForMixin(
			total_amount,
			_unusedOuts,
			isRingCT,
			sweeping,
		);
		// v-- now if RingCT compute fee as closely as possible before hand
		var usingOuts = usableOutputsAndAmounts.usingOuts;
		var usingOutsAmount = usableOutputsAndAmounts.usingOutsAmount;
		var remaining_unusedOuts = usableOutputsAndAmounts.remainingUnusedOuts; // this is a copy of the pre-mutation usingOuts
		if (/*usingOuts.length > 1 &&*/ isRingCT) {
			var newNeededFee = calculateFee(
				_feePerKBJSBigInt,
				monero_utils.estimateRctSize(usingOuts.length, mixin, 2),
				multiplyFeePriority(simplePriority),
			);
			// if newNeededFee < neededFee, use neededFee instead (should only happen on the 2nd or later times through (due to estimated fee being too low))
			if (newNeededFee.compare(estMinNetworkFee) < 0) {
				newNeededFee = estMinNetworkFee;
			}
			if (sweeping) {
				/* 
				// When/if sending to multiple destinations supported, uncomment and port this:					
				if (dsts.length !== 1) {
					deferred.reject("Sweeping to multiple accounts is not allowed");
					return;
				}
				*/
				_feelessTotalJSBigInt = usingOutsAmount.subtract(newNeededFee);
				if (_feelessTotalJSBigInt.compare(0) < 1) {
					const { coinSymbol } = monero_config;
					const outsAmountStr = monero_utils.formatMoney(
						usingOutsAmount,
					);
					const newNeededFeeStr = monero_utils.formatMoney(
						newNeededFee,
					);
					const errStr = `Your spendable balance is too low. Have ${outsAmountStr} ${coinSymbol} spendable, need ${newNeededFeeStr} ${coinSymbol}.`;

					return errCb(Error(errStr));
				}
				total_amount = _feelessTotalJSBigInt.add(newNeededFee);
			} else {
				total_amount = _feelessTotalJSBigInt.add(newNeededFee);
				// add outputs 1 at a time till we either have them all or can meet the fee
				while (
					usingOutsAmount.compare(total_amount) < 0 &&
					remaining_unusedOuts.length > 0
				) {
					const out = popRandElement(remaining_unusedOuts);
					console.log(
						"Using output: " +
							monero_utils.formatMoney(out.amount) +
							" - " +
							JSON.stringify(out),
					);
					// and recalculate invalidated values
					newNeededFee = calculateFee(
						_feePerKBJSBigInt,
						monero_utils.estimateRctSize(
							usingOuts.length,
							mixin,
							2,
						),
						multiplyFeePriority(simplePriority),
					);
					total_amount = _feelessTotalJSBigInt.add(newNeededFee);
				}
			}
			console.log(
				"New fee: " +
					monero_utils.formatMoneySymbol(newNeededFee) +
					" for " +
					usingOuts.length +
					" inputs",
			);
			estMinNetworkFee = newNeededFee;
		}
		console.log(
			"~ Balance required: " +
				monero_utils.formatMoneySymbol(total_amount),
		);
		// Now we can validate available balance with usingOutsAmount (TODO? maybe this check can be done before selecting outputs?)
		const usingOutsAmount_comparedTo_totalAmount = usingOutsAmount.compare(
			total_amount,
		);
		if (usingOutsAmount_comparedTo_totalAmount < 0) {
			const { coinSymbol } = monero_config;
			const usingOutsAmountStr = monero_utils.formatMoney(
				usingOutsAmount,
			);
			const totalAmountIncludingFeesStr = monero_utils.formatMoney(
				total_amount,
			);
			const errStr = `Your spendable balance is too low. Have ${usingOutsAmountStr} ${coinSymbol} spendable, need ${totalAmountIncludingFeesStr} ${coinSymbol}.`;
			return errCb(Error(errStr));
		}
		// Now we can put together the list of fund transfers we need to perform
		const fundTransferDescriptions = []; // to build…
		// I. the actual transaction the user is asking to do
		fundTransferDescriptions.push({
			address: _targetAddress,
			amount: _feelessTotalJSBigInt,
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
			var change_amount = usingOutsAmount.subtract(total_amount);
			console.log("changeAmount", change_amount);
			if (isRingCT) {
				// for RCT we don't presently care about dustiness so add entire change amount
				console.log(
					"Sending change of " +
						monero_utils.formatMoneySymbol(change_amount) +
						" to " +
						senderPublicAddress,
				);
				fundTransferDescriptions.push({
					address: senderPublicAddress,
					amount: change_amount,
				});
			} else {
				// pre-ringct
				// do not give ourselves change < dust threshold
				var changeAmountDivRem = change_amount.divRem(
					monero_config.dustThreshold,
				);
				console.log("💬  changeAmountDivRem", changeAmountDivRem);
				if (changeAmountDivRem[1].toString() !== "0") {
					// miners will add dusty change to fee
					console.log(
						"💬  Miners will add change of " +
							monero_utils.formatMoneyFullSymbol(
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
							monero_utils.formatMoneySymbol(usableChange) +
							" to " +
							senderPublicAddress,
					);
					fundTransferDescriptions.push({
						address: senderPublicAddress,
						amount: usableChange,
					});
				}
			}
		} else if (usingOutsAmount_comparedTo_totalAmount === 0) {
			// this should always fire when sweeping
			if (isRingCT) {
				// then create random destination to keep 2 outputs always in case of 0 change
				const fakeAddress = monero_utils.create_address(
					monero_utils.random_scalar(),
					nettype,
				).public_addr;

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
			return errCb(Error("Invalid mixin"));
		}
		if (mixin > 0) {
			// first, grab RandomOuts, then enter __createTx
			updateStatusCb(sendFundStatus.fetching_decoy_outputs);
			nodeAPI.RandomOuts(usingOuts, mixin, function(_err, _amount_outs) {
				if (_err) {
					errCb(_err);
					return;
				}
				_createTxAndAttemptToSend(_amount_outs);
			});
			return;
		} else {
			// mixin === 0: -- PSNOTE: is that even allowed?
			_createTxAndAttemptToSend();
		}
		function _createTxAndAttemptToSend(mixOuts) {
			updateStatusCb(sendFundStatus.constructing_transaction);
			var signedTx;
			try {
				console.log("Destinations: ");
				monero_utils.printDsts(fundTransferDescriptions);
				//
				var realDestViewKey; // need to get viewkey for encrypting here, because of splitting and sorting
				if (_encryptPid) {
					realDestViewKey = monero_utils.decode_address(
						_targetAddress,
						nettype,
					).view;
					console.log("got realDestViewKey", realDestViewKey);
				}
				var splitDestinations = monero_utils.decompose_tx_destinations(
					fundTransferDescriptions,
					isRingCT,
				);
				console.log("Decomposed destinations:");
				monero_utils.printDsts(splitDestinations);
				//
				signedTx = monero_utils.create_transaction(
					senderPublicKeys,
					senderPrivateKeys,
					splitDestinations,
					usingOuts,
					mixOuts,
					mixin,
					_estMinNetworkFee,
					_pid,
					_encryptPid,
					realDestViewKey,
					0,
					isRingCT,
					nettype,
				);
			} catch (e) {
				let errStr;
				if (e) {
					errStr = e.toString();
				} else {
					errStr = "Failed to create transaction with unknown error.";
				}
				return errCb(Error(errStr));
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
					monero_utils.formatMoneyFull(_estMinNetworkFee) +
					")",
			);
			const feeActuallyNeededByNetwork = calculateFeeKb(
				_feePerKBJSBigInt,
				numKB,
				multiplyFeePriority(simplePriority),
			);
			// if we need a higher fee
			if (feeActuallyNeededByNetwork.compare(_estMinNetworkFee) > 0) {
				console.log(
					"💬  Need to reconstruct the tx with enough of a network fee. Previous fee: " +
						monero_utils.formatMoneyFull(_estMinNetworkFee) +
						" New fee: " +
						monero_utils.formatMoneyFull(
							feeActuallyNeededByNetwork,
						),
				);
				// this will update status back to .calculatingFee
				_attempt_to_constructFundTransferListAndSendFunds_findingLowestNetworkFee(
					_targetAddress,
					_feelessTotalJSBigInt,
					_pid,
					_encryptPid,
					_unusedOuts,
					_feePerKBJSBigInt,
					feeActuallyNeededByNetwork, // we are re-entering this codepath after changing this feeActuallyNeededByNetwork
				);
				//
				return;
			}

			// generated with correct per-kb fee
			const final_networkFee = _estMinNetworkFee; // just to make things clear
			console.log(
				"💬  Successful tx generation, submitting tx. Going with final_networkFee of ",
				monero_utils.formatMoney(final_networkFee),
			);

			updateStatusCb(sendFundStatus.submitting_transaction);

			nodeAPI.SubmitSerializedSignedTransaction(
				senderPublicAddress,
				senderPrivateKeys.view,
				serialized_signedTx,
				function(err) {
					if (err) {
						return errCb(
							Error(
								"Something unexpected occurred when submitting your transaction: " +
									err,
							),
						);
					}
					const tx_fee = final_networkFee; /*.add(hostingService_chargeAmount) NOTE: Service charge removed to reduce bloat for now */
					successCb(
						_targetAddress,
						sweeping
							? parseFloat(
									monero_utils.formatMoneyFull(
										_feelessTotalJSBigInt,
									),
							  )
							: target_amount,
						_pid,
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
/**
 *
 * @description Validate & Normalize passed in target descriptions of {address, amount}.
 *
 * Checks if address is valid along with the amount.
 *
 * parse & normalize the target descriptions by mapping them to currency (Monero)-ready addresses & amounts
 * @param {*} moneroOpenaliasUtils
 * @param {{address,amount}[]} targetsToResolve
 * @param {*} nettype
 * @param {(err: Error | null, resolved_targets?: {address,amount}[]) => void } cb
 */
function resolveTargets(moneroOpenaliasUtils, targetsToResolve, nettype, cb) {
	async.mapSeries(
		targetsToResolve,
		(target, _cb) => {
			if (!target.address && !target.amount) {
				// PSNote: is this check rigorous enough?
				return _cb(
					Error(
						"Please supply a target address and a target amount.",
					),
				);
			}
			const target_address = target.address;
			const target_amount = target.amount.toString(); // we are converting it to a string here because parseMoney expects a string
			// now verify/parse address and amount
			if (
				moneroOpenaliasUtils.DoesStringContainPeriodChar_excludingAsXMRAddress_qualifyingAsPossibleOAAddress(
					target_address,
				)
			) {
				return _cb(
					Error(
						"You must resolve this OpenAlias address to a Monero address before calling SendFunds",
					),
				);
			}
			// otherwise this should be a normal, single Monero public address
			try {
				monero_utils.decode_address(target_address, nettype); // verify that the address is valid
			} catch (e) {
				return _cb(
					Error(`Couldn't decode address ${target_address} : ${e}`),
				);
			}
			// amount
			try {
				const parsed_amount = monero_utils.parseMoney(target_amount);
				return _cb(null, {
					address: target_address,
					amount: parsed_amount,
				});
			} catch (e) {
				return _cb(
					Error(`Couldn't parse amount ${target_amount} : ${e}`),
				);
			}
		},
		(err, resolved_targets) => {
			cb(err, resolved_targets);
		},
	);
}

function popRandElement(list) {
	var idx = Math.floor(Math.random() * list.length);
	var val = list[idx];
	list.splice(idx, 1);
	return val;
}

function outputsAndAmountForMixin(
	targetAmount,
	unusedOuts,
	isRingCT,
	sweeping,
) {
	console.log(
		"Selecting outputs to use. target: " +
			monero_utils.formatMoney(targetAmount),
	);
	var usingOutsAmount = new JSBigInt(0);
	const usingOuts = [];
	const remainingUnusedOuts = unusedOuts.slice(); // take copy so as to prevent issue if we must re-enter tx building fn if fee too low after building
	while (
		usingOutsAmount.compare(targetAmount) < 0 &&
		remainingUnusedOuts.length > 0
	) {
		var out = popRandElement(remainingUnusedOuts);
		if (!isRingCT && out.rct) {
			// out.rct is set by the server
			continue; // skip rct outputs if not creating rct tx
		}
		const out_amount_JSBigInt = new JSBigInt(out.amount);
		if (out_amount_JSBigInt.compare(monero_config.dustThreshold) < 0) {
			// amount is dusty..
			if (!sweeping) {
				console.log(
					"Not sweeping, and found a dusty (though maybe mixable) output... skipping it!",
				);
				continue;
			}
			if (!out.rct) {
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
		usingOuts.push(out);
		usingOutsAmount = usingOutsAmount.add(out_amount_JSBigInt);
		console.log(
			`Using output: ${monero_utils.formatMoney(
				out_amount_JSBigInt,
			)} - ${JSON.stringify(out)}`,
		);
	}
	return {
		usingOuts,
		usingOutsAmount,
		remainingUnusedOuts,
	};
}
