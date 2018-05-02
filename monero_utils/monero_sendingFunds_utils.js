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
"use strict"
//
const async = require('async')
//
const monero_config = require('./monero_config')
const monero_utils = require('./monero_cryptonote_utils_instance')
const monero_paymentID_utils = require('./monero_paymentID_utils')
const JSBigInt = require('../cryptonote_utils/biginteger').BigInteger
//
//
function _forkv7_minimumMixin() { return 6; }
function _mixinToRingsize(mixin) { return mixin + 1; }
//
function thisFork_minMixin() { return _forkv7_minimumMixin(); }
function thisFork_minRingSize() { return _mixinToRingsize(thisFork_minMixin()); }
exports.thisFork_minMixin = thisFork_minMixin;
exports.thisFork_minRingSize = thisFork_minRingSize;
//
function fixedMixin() { return thisFork_minMixin(); /* using the monero app default to remove MM user identifiers */ }
function fixedRingsize() { return _mixinToRingsize(fixedMixin()); }
exports.fixedMixin = fixedMixin;
exports.fixedRingsize = fixedRingsize;
//
//
function default_priority() { return 2; } // aka .mlow or medium low
exports.default_priority = default_priority;
//
//
function calculate_fee(fee_per_kb_JSBigInt, numberOf_bytes, fee_multiplier)
{
	const numberOf_kB_JSBigInt = new JSBigInt((numberOf_bytes + 1023.0) / 1024.0) // i.e. ceil
	//
	return calculate_fee__kb(fee_per_kb_JSBigInt, numberOf_kB_JSBigInt, fee_multiplier)
}
function calculate_fee__kb(fee_per_kb_JSBigInt, numberOf_kb, fee_multiplier)
{
	const numberOf_kB_JSBigInt = new JSBigInt(numberOf_kb)
	const fee = fee_per_kb_JSBigInt.multiply(fee_multiplier).multiply(numberOf_kB_JSBigInt)
	//
	return fee
}
const newer_multipliers = [1, 4, 20, 166];
function fee_multiplier_for_priority(priority__or0ForDefault) {
	const final_priorityInt = !priority__or0ForDefault || priority__or0ForDefault == 0
		? default_priority() 
		: priority__or0ForDefault;
	if (final_priorityInt <= 0 || final_priorityInt > newer_multipliers.length) {
		throw "fee_multiplier_for_priority: simple_priority out of bounds";
	}
	const priority_as_idx = final_priorityInt - 1;
	return newer_multipliers[priority_as_idx];
}
function EstimatedTransaction_networkFee(
	nonZero_mixin_int,
	feePerKB_JSBigInt,
	simple_priority
) {
	const numberOf_inputs = 2 // this might change -- might select inputs
	const numberOf_outputs = 1/*dest*/ + 1/*change*/ + 0/*no mymonero fee presently*/
	// TODO: update est tx size for bulletproofs
	// TODO: normalize est tx size fn naming
	const estimated_txSize = monero_utils.estimateRctSize(numberOf_inputs, nonZero_mixin_int, numberOf_outputs)
	const estimated_fee = calculate_fee(feePerKB_JSBigInt, estimated_txSize, fee_multiplier_for_priority(simple_priority))
	//
	return estimated_fee
}
exports.EstimatedTransaction_networkFee = EstimatedTransaction_networkFee
//
const SendFunds_ProcessStep_Code =
{
	fetchingLatestBalance: 1,
	calculatingFee: 2,
	fetchingDecoyOutputs: 3, // may get skipped if 0 mixin
	constructingTransaction: 4, // may go back to .calculatingFee
	submittingTransaction: 5
}
exports.SendFunds_ProcessStep_Code = SendFunds_ProcessStep_Code
const SendFunds_ProcessStep_MessageSuffix =
{
	1: "Fetching latest balance.",
	2: "Calculating fee.",
	3: "Fetching decoy outputs.",
	4: "Constructing transaction.", // may go back to .calculatingFee
	5: "Submitting transaction."
}
exports.SendFunds_ProcessStep_MessageSuffix = SendFunds_ProcessStep_MessageSuffix
//
function SendFunds(
	isRingCT,
	target_address, // currency-ready wallet address, but not an OA address (resolve before calling)
	nettype,
	amount, // number
	wallet__keyImage_cache,
	wallet__public_address,
	wallet__private_keys,
	wallet__public_keys,
	hostedMoneroAPIClient,
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
	failWithErr_fn
	// failWithErr_fn: (
	//		err
	// )
) {
	//
	// some callback trampoline function declarations…
	function __trampolineFor_success(
		moneroReady_targetDescription_address,
		sentAmount,
		final__payment_id,
		tx_hash,
		tx_fee
	) {
		success_fn(
			moneroReady_targetDescription_address,
			sentAmount,
			final__payment_id,
			tx_hash,
			tx_fee
		)
	}
	function __trampolineFor_err_withErr(err)
	{
		failWithErr_fn(err)
	}
	function __trampolineFor_err_withStr(errStr)
	{
		const err = new Error(errStr)
		console.error(errStr)
		failWithErr_fn(err)
	}
	if (mixin < thisFork_minMixin()) {
		__trampolineFor_err_withStr("Ringsize is below the minimum.")
		return;
	}
	//
	// parse & normalize the target descriptions by mapping them to Monero addresses & amounts
	const targetDescription =
	{ 
		address: target_address, 
		amount: amount
	}
	new_moneroReadyTargetDescriptions_fromTargetDescriptions(
		monero_openalias_utils,
		[ targetDescription ], // requires a list of descriptions - but SendFunds was
		// not written with multiple target support as MyMonero does not yet support it
		nettype,
		function(err, moneroReady_targetDescriptions)
		{
			if (err) {
				__trampolineFor_err_withErr(err)
				return
			}
			const invalidOrZeroDestination_errStr = "You need to enter a valid destination"
			if (moneroReady_targetDescriptions.length === 0) {
				__trampolineFor_err_withStr(invalidOrZeroDestination_errStr)
				return
			}
			const moneroReady_targetDescription = moneroReady_targetDescriptions[0]
			if (moneroReady_targetDescription === null || typeof moneroReady_targetDescription === 'undefined') {
				__trampolineFor_err_withStr(invalidOrZeroDestination_errStr)
				return
			}
			_proceedTo_prepareToSendFundsTo_moneroReady_targetDescription(moneroReady_targetDescription)
		}
	)
	function _proceedTo_prepareToSendFundsTo_moneroReady_targetDescription(moneroReady_targetDescription)
	{
		var moneroReady_targetDescription_address = moneroReady_targetDescription.address
		var moneroReady_targetDescription_amount = moneroReady_targetDescription.amount
		//
		var totalAmountWithoutFee_JSBigInt = (new JSBigInt(0)).add(moneroReady_targetDescription_amount)
		console.log("💬  Total to send, before fee: " + monero_utils.formatMoney(totalAmountWithoutFee_JSBigInt));
		if (totalAmountWithoutFee_JSBigInt.compare(0) <= 0) {
			const errStr = "The amount you've entered is too low"
			__trampolineFor_err_withStr(errStr)
			return
		}
		//
		// Derive/finalize some values…
		var final__payment_id = payment_id
		var final__pid_encrypt = false // we don't want to encrypt payment ID unless we find an integrated one
		var address__decode_result; 
		try {
			address__decode_result = monero_utils.decode_address(moneroReady_targetDescription_address, nettype)
		} catch (e) {
			__trampolineFor_err_withStr(typeof e === 'string' ? e : e.toString())
			return
		}
		if (address__decode_result.intPaymentId && payment_id) {
			const errStr = "Payment ID field must be blank when using an Integrated Address"
			__trampolineFor_err_withStr(errStr)
			return
		}
		if (address__decode_result.intPaymentId) {
			final__payment_id = address__decode_result.intPaymentId
			final__pid_encrypt = true // we do want to encrypt if using an integrated address
		} else if (monero_paymentID_utils.IsValidPaymentIDOrNoPaymentID(final__payment_id) === false) {
			const errStr = "Invalid payment ID."
			__trampolineFor_err_withStr(errStr)
			return
		}
		//
		_proceedTo_getUnspentOutsUsableForMixin(
			moneroReady_targetDescription_address,
			totalAmountWithoutFee_JSBigInt,
			final__payment_id,
			final__pid_encrypt
		)
	}
	function _proceedTo_getUnspentOutsUsableForMixin(
		moneroReady_targetDescription_address,
		totalAmountWithoutFee_JSBigInt,
		final__payment_id, // non-existent or valid
		final__pid_encrypt // true or false
	) {
		preSuccess_nonTerminal_statusUpdate_fn(SendFunds_ProcessStep_Code.fetchingLatestBalance)
		hostedMoneroAPIClient.UnspentOuts(
			wallet__keyImage_cache,
			wallet__public_address,
			wallet__private_keys.view,
			wallet__public_keys.spend,
			wallet__private_keys.spend,
			mixin,
			function(
				err, 
				unspentOuts,
				unusedOuts,
				dynamic_feePerKB_JSBigInt
			)
			{
				if (err) {
					__trampolineFor_err_withErr(err)
					return
				}
				console.log("Received dynamic per kb fee", monero_utils.formatMoneySymbol(dynamic_feePerKB_JSBigInt))
				_proceedTo_constructFundTransferListAndSendFundsByUsingUnusedUnspentOutsForMixin(
					moneroReady_targetDescription_address,
					totalAmountWithoutFee_JSBigInt,
					final__payment_id,
					final__pid_encrypt,
					unusedOuts,
					dynamic_feePerKB_JSBigInt
				)
			}
		)
	}
	function _proceedTo_constructFundTransferListAndSendFundsByUsingUnusedUnspentOutsForMixin(
		moneroReady_targetDescription_address,
		totalAmountWithoutFee_JSBigInt,
		final__payment_id,
		final__pid_encrypt,
		unusedOuts,
		dynamic_feePerKB_JSBigInt
	) {
		// status: constructing transaction…
		const feePerKB_JSBigInt = dynamic_feePerKB_JSBigInt
		// Transaction will need at least 1KB fee (or 13KB for RingCT)
		const network_minimumTXSize_kb = /*isRingCT ? */13/* : 1*/
		const network_minimumFee = calculate_fee__kb(feePerKB_JSBigInt, network_minimumTXSize_kb, fee_multiplier_for_priority(simple_priority))
		// ^-- now we're going to try using this minimum fee but the codepath has to be able to be re-entered if we find after constructing the whole tx that it is larger in kb than the minimum fee we're attempting to send it off with
		__reenterable_constructFundTransferListAndSendFunds_findingLowestNetworkFee(
			moneroReady_targetDescription_address,
			totalAmountWithoutFee_JSBigInt,
			final__payment_id,
			final__pid_encrypt,
			unusedOuts,
			feePerKB_JSBigInt, // obtained from server, so passed in
			network_minimumFee
		)
	}		
	function __reenterable_constructFundTransferListAndSendFunds_findingLowestNetworkFee(
		moneroReady_targetDescription_address,
		totalAmountWithoutFee_JSBigInt,
		final__payment_id,
		final__pid_encrypt,
		unusedOuts,
		feePerKB_JSBigInt,
		passedIn_attemptAt_network_minimumFee
	) { // Now we need to establish some values for balance validation and to construct the transaction
		preSuccess_nonTerminal_statusUpdate_fn(SendFunds_ProcessStep_Code.calculatingFee)
		//
		var attemptAt_network_minimumFee = passedIn_attemptAt_network_minimumFee // we may change this if isRingCT
		// const hostingService_chargeAmount = hostedMoneroAPIClient.HostingServiceChargeFor_transactionWithNetworkFee(attemptAt_network_minimumFee)
		var totalAmountIncludingFees = totalAmountWithoutFee_JSBigInt.add(attemptAt_network_minimumFee)/*.add(hostingService_chargeAmount) NOTE service fee removed for now */
		const usableOutputsAndAmounts = _outputsAndAmountToUseForMixin(
			totalAmountIncludingFees,
			unusedOuts,
			isRingCT
		)
		// v-- now if RingCT compute fee as closely as possible before hand
		var usingOuts = usableOutputsAndAmounts.usingOuts
		var usingOutsAmount = usableOutputsAndAmounts.usingOutsAmount
		var remaining_unusedOuts = usableOutputsAndAmounts.remaining_unusedOuts // this is a copy of the pre-mutation usingOuts
		if (isRingCT) { 
			if (usingOuts.length > 1) {
				var newNeededFee = calculate_fee(
					feePerKB_JSBigInt, 
					monero_utils.estimateRctSize(usingOuts.length, mixin, 2), 
					fee_multiplier_for_priority(simple_priority)
				)
				totalAmountIncludingFees = totalAmountWithoutFee_JSBigInt.add(newNeededFee)
				// add outputs 1 at a time till we either have them all or can meet the fee
				while (usingOutsAmount.compare(totalAmountIncludingFees) < 0 && remaining_unusedOuts.length > 0) {
					const out = _popAndReturnRandomElementFromList(remaining_unusedOuts)
					usingOuts.push(out)
					usingOutsAmount = usingOutsAmount.add(out.amount)
					console.log("Using output: " + monero_utils.formatMoney(out.amount) + " - " + JSON.stringify(out))
					//
					// and recalculate invalidated values
					newNeededFee = calculate_fee(
						feePerKB_JSBigInt, 
						monero_utils.estimateRctSize(usingOuts.length, mixin, 2), 
						fee_multiplier_for_priority(simple_priority)
					)
					totalAmountIncludingFees = totalAmountWithoutFee_JSBigInt.add(newNeededFee)
				}
				console.log("New fee: " + monero_utils.formatMoneySymbol(newNeededFee) + " for " + usingOuts.length + " inputs")
				attemptAt_network_minimumFee = newNeededFee
			}
		}
		console.log("~ Balance required: " + monero_utils.formatMoneySymbol(totalAmountIncludingFees))
		// Now we can validate available balance with usingOutsAmount (TODO? maybe this check can be done before selecting outputs?)
		const usingOutsAmount_comparedTo_totalAmount = usingOutsAmount.compare(totalAmountIncludingFees)
		if (usingOutsAmount_comparedTo_totalAmount < 0) {
			const errStr = `Your spendable balance is too low. Have ${monero_utils.formatMoney(usingOutsAmount)} ${monero_config.coinSymbol} spendable, need ${monero_utils.formatMoney(totalAmountIncludingFees)} ${monero_config.coinSymbol}.`
			__trampolineFor_err_withStr(errStr)
			return
		}
		// Now we can put together the list of fund transfers we need to perform
		const fundTransferDescriptions = [] // to build…
		// I. the actual transaction the user is asking to do
		fundTransferDescriptions.push({ 
			address: moneroReady_targetDescription_address,
			amount: totalAmountWithoutFee_JSBigInt				
		})
		// II. the fee that the hosting provider charges
		// NOTE: The fee has been removed for RCT until a later date
		// fundTransferDescriptions.push({
		//			 address: hostedMoneroAPIClient.HostingServiceFeeDepositAddress(),
		//			 amount: hostingService_chargeAmount
		// })
		// III. some amount of the total outputs will likely need to be returned to the user as "change":			
		if (usingOutsAmount_comparedTo_totalAmount > 0) {
			var changeAmount = usingOutsAmount.subtract(totalAmountIncludingFees)
			console.log("changeAmount" , changeAmount)
			if (isRingCT) { // for RCT we don't presently care about dustiness so add entire change amount
				console.log("Sending change of " + monero_utils.formatMoneySymbol(changeAmount) + " to " + wallet__public_address)
				fundTransferDescriptions.push({
					address: wallet__public_address,
					amount: changeAmount
				})
			} else { // pre-ringct
				// do not give ourselves change < dust threshold
				var changeAmountDivRem = changeAmount.divRem(monero_config.dustThreshold)
				console.log("💬  changeAmountDivRem", changeAmountDivRem)
				if (changeAmountDivRem[1].toString() !== "0") {
					// miners will add dusty change to fee
					console.log("💬  Miners will add change of " + monero_utils.formatMoneyFullSymbol(changeAmountDivRem[1]) + " to transaction fee (below dust threshold)")
				}
				if (changeAmountDivRem[0].toString() !== "0") {
					// send non-dusty change to our address
					var usableChange = changeAmountDivRem[0].multiply(monero_config.dustThreshold)
					console.log("💬  Sending change of " + monero_utils.formatMoneySymbol(usableChange) + " to " + wallet__public_address)
					fundTransferDescriptions.push({
						address: wallet__public_address,
						amount: usableChange
					})
				}
			}
		} else if (usingOutsAmount_comparedTo_totalAmount == 0) {
			if (isRingCT) { // then create random destination to keep 2 outputs always in case of 0 change
				var fakeAddress = monero_utils.create_address(monero_utils.random_scalar(), nettype).public_addr
				console.log("Sending 0 XMR to a fake address to keep tx uniform (no change exists): " + fakeAddress)
				fundTransferDescriptions.push({
					address: fakeAddress,
					amount: 0
				})
			}
		}
		console.log("fundTransferDescriptions so far", fundTransferDescriptions)
		if (mixin < 0 || isNaN(mixin)) {
			__trampolineFor_err_withStr("Invalid mixin")
			return
		}
		if (mixin > 0) { // first, grab RandomOuts, then enter __createTx 
			preSuccess_nonTerminal_statusUpdate_fn(SendFunds_ProcessStep_Code.fetchingDecoyOutputs)
			hostedMoneroAPIClient.RandomOuts(
				usingOuts,
				mixin,
				function(err, amount_outs)
				{
					if (err) {
						__trampolineFor_err_withErr(err)
						return
					}
					__createTxAndAttemptToSend(amount_outs)
				}
			)
			return
		} else { // mixin === 0: -- PSNOTE: is that even allowed? 
			__createTxAndAttemptToSend()
		}
		function __createTxAndAttemptToSend(mix_outs)
		{
			preSuccess_nonTerminal_statusUpdate_fn(SendFunds_ProcessStep_Code.constructingTransaction)
			var signedTx;
			try {
				console.log('Destinations: ')
				monero_utils.printDsts(fundTransferDescriptions)
				//
				var realDestViewKey // need to get viewkey for encrypting here, because of splitting and sorting
				if (final__pid_encrypt) {
					realDestViewKey = monero_utils.decode_address(moneroReady_targetDescription_address, nettype).view
					console.log("got realDestViewKey" , realDestViewKey)
				}
				var splitDestinations = monero_utils.decompose_tx_destinations(
					fundTransferDescriptions, 
					isRingCT
				)
				console.log('Decomposed destinations:')
				monero_utils.printDsts(splitDestinations)
				//
				signedTx = monero_utils.create_transaction(
					wallet__public_keys, 
					wallet__private_keys, 
					splitDestinations, 
					usingOuts, 
					mix_outs, 
					mixin, 
					attemptAt_network_minimumFee, 
					final__payment_id, 
					final__pid_encrypt, 
					realDestViewKey, 
					0,
					isRingCT,
					nettype
				)
			} catch (e) {
				var errStr;
				if (e) {
					errStr = typeof e == "string" ? e : e.toString()
				} else {
					errStr = "Failed to create transaction with unknown error."
				}
				__trampolineFor_err_withStr(errStr)
				return
			}
			console.log("signed tx: ", JSON.stringify(signedTx))
			//
			var serialized_signedTx;
			var tx_hash;
			if (signedTx.version === 1) {
				serialized_signedTx = monero_utils.serialize_tx(signedTx)
				tx_hash = monero_utils.cn_fast_hash(serialized_signedTx)
			} else {
				const raw_tx_and_hash = monero_utils.serialize_rct_tx_with_hash(signedTx)
				serialized_signedTx = raw_tx_and_hash.raw
				tx_hash = raw_tx_and_hash.hash
			}
			console.log("tx serialized: " + serialized_signedTx)
			console.log("Tx hash: " + tx_hash)
			//
			// work out per-kb fee for transaction and verify that it's enough
			var txBlobBytes = serialized_signedTx.length / 2
			var numKB = Math.floor(txBlobBytes / 1024)
			if (txBlobBytes % 1024) {
				numKB++
			}
			console.log(txBlobBytes + " bytes <= " + numKB + " KB (current fee: " + monero_utils.formatMoneyFull(attemptAt_network_minimumFee) + ")")
			const feeActuallyNeededByNetwork = calculate_fee__kb(feePerKB_JSBigInt, numKB, fee_multiplier_for_priority(simple_priority))
			// if we need a higher fee
			if (feeActuallyNeededByNetwork.compare(attemptAt_network_minimumFee) > 0) {
				console.log("💬  Need to reconstruct the tx with enough of a network fee. Previous fee: " + monero_utils.formatMoneyFull(attemptAt_network_minimumFee) + " New fee: " + monero_utils.formatMoneyFull(feeActuallyNeededByNetwork))
				// this will update status back to .calculatingFee
				__reenterable_constructFundTransferListAndSendFunds_findingLowestNetworkFee(
					moneroReady_targetDescription_address,
					totalAmountWithoutFee_JSBigInt,
					final__payment_id,
					final__pid_encrypt,
					unusedOuts,
					feePerKB_JSBigInt,
					feeActuallyNeededByNetwork // we are re-entering this codepath after changing this feeActuallyNeededByNetwork
				)
				//
				return
			}
			//
			// generated with correct per-kb fee
			const final_networkFee = attemptAt_network_minimumFee // just to make things clear
			console.log("💬  Successful tx generation, submitting tx. Going with final_networkFee of ", monero_utils.formatMoney(final_networkFee))
			// status: submitting…
			preSuccess_nonTerminal_statusUpdate_fn(SendFunds_ProcessStep_Code.submittingTransaction)
			hostedMoneroAPIClient.SubmitSerializedSignedTransaction(
				wallet__public_address,
				wallet__private_keys.view,
				serialized_signedTx,
				function(err)
				{
					if (err) {
						__trampolineFor_err_withStr("Something unexpected occurred when submitting your transaction:", err)
						return
					}
					const tx_fee = final_networkFee/*.add(hostingService_chargeAmount) NOTE: Service charge removed to reduce bloat for now */
					__trampolineFor_success(
						moneroReady_targetDescription_address,
						amount,
						final__payment_id,
						tx_hash,
						tx_fee
					) // 🎉
				}
			)
		}
	}
}
exports.SendFunds = SendFunds
//
function new_moneroReadyTargetDescriptions_fromTargetDescriptions( 
	monero_openalias_utils,
	targetDescriptions,
	nettype,
	fn
) // fn: (err, moneroReady_targetDescriptions) -> Void
{ // parse & normalize the target descriptions by mapping them to currency (Monero)-ready addresses & amounts
	// some pure function declarations for the map we'll do on targetDescriptions
	async.mapSeries(
		targetDescriptions,
		function(targetDescription, cb)
		{
			if (!targetDescription.address && !targetDescription.amount) { // PSNote: is this check rigorous enough?
				const errStr = "Please supply a target address and a target amount."
				const err = new Error(errStr)
				cb(err)
				return
			}
			const targetDescription_address = targetDescription.address
			const targetDescription_amount = "" + targetDescription.amount // we are converting it to a string here because parseMoney expects a string
			// now verify/parse address and amount
			if (monero_openalias_utils.DoesStringContainPeriodChar_excludingAsXMRAddress_qualifyingAsPossibleOAAddress(targetDescription_address) == true) {
				throw "You must resolve this OA address to a Monero address before calling SendFunds"
			}
			// otherwise this should be a normal, single Monero public address
			try {
				monero_utils.decode_address(targetDescription_address, nettype) // verify that the address is valid
			} catch (e) {
				const errStr = "Couldn't decode address " + targetDescription_address + ": " + e
				const err = new Error(errStr)
				cb(err)
				return
			}
			// amount:
			var moneroReady_amountToSend; // possibly need this ; here for the JS parser
			try {
				moneroReady_amountToSend = monero_utils.parseMoney(targetDescription_amount)
			} catch (e) {
				const errStr = "Couldn't parse amount " + targetDescription_amount + ": " + e
				const err = new Error(errStr)
				cb(err)
				return
			}
			cb(null, { 
				address: targetDescription_address,
				amount: moneroReady_amountToSend
			})
		},
		function(err, moneroReady_targetDescriptions)
		{
			fn(err, moneroReady_targetDescriptions)
		}
	)
}
//
function __randomIndex(list)
{
	return Math.floor(Math.random() * list.length);
}
function _popAndReturnRandomElementFromList(list)
{
	var idx = __randomIndex(list)
	var val = list[idx]
	list.splice(idx, 1)
	//
	return val
}
function _outputsAndAmountToUseForMixin(
	target_amount,
	unusedOuts,
	isRingCT
)
{
	console.log("Selecting outputs to use. target: " + monero_utils.formatMoney(target_amount))
	var toFinalize_usingOutsAmount = new JSBigInt(0)
	const toFinalize_usingOuts = []
	const remaining_unusedOuts = unusedOuts.slice() // take copy so as to prevent issue if we must re-enter tx building fn if fee too low after building
	while (toFinalize_usingOutsAmount.compare(target_amount) < 0 && remaining_unusedOuts.length > 0) {
		var out = _popAndReturnRandomElementFromList(remaining_unusedOuts)
		if (!isRingCT && out.rct) { // out.rct is set by the server
			continue; // skip rct outputs if not creating rct tx
		}
		const out_amount = out.amount
		toFinalize_usingOuts.push(out)
		toFinalize_usingOutsAmount = toFinalize_usingOutsAmount.add(out_amount)
		console.log("Using output: " + monero_utils.formatMoney(out_amount) + " - " + JSON.stringify(out))
	}
	return {
		usingOuts: toFinalize_usingOuts,
		usingOutsAmount: toFinalize_usingOutsAmount,
		remaining_unusedOuts: remaining_unusedOuts
	}
}