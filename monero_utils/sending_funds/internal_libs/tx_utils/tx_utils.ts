import monero_utils from "monero_utils/monero_cryptonote_utils_instance";
import { config } from "monero_utils/monero_config";
import { getTargetPubViewKey } from "../key_utils";
import {
	TotalAmtAndEstFeeParams,
	ConstructTxParams,
	EstRctFeeAndAmtParams,
	ConstructFundTargetsParams,
} from "./types";
import { ERR } from "../errors";
import { Log } from "../logger";
import { popRandElement } from "../arr_utils";
import { calculateFee, multiplyFeePriority } from "../fee_utils";
import { ParsedTarget } from "../types";
import { JSBigInt } from "types";

// #region totalAmtAndEstFee

/**
 * @description
 * Recalculates the fee and total amount needed for the transaction to be sent. RCT + non sweeping transactions will have their
 * network fee increased if fee calculation based on the number of outputs needed is higher than the passed-in fee. RCT+ sweeping transactions
 * are just checked if they have enough balance to proceed with the transaction. Non-RCT transactions will have no fee recalculation done on them.

 * @export
 * @param {TotalAmtAndEstFeeParams} params
 * @returns
 */
export function totalAmtAndEstFee(params: TotalAmtAndEstFeeParams) {
	const {
		baseTotalAmount,

		networkFee,

		isRingCT,

		usingOuts,
	} = params;

	if (!isRingCT) {
		return { newFee: networkFee, totalAmount: baseTotalAmount };
	}

	/* if (usingOuts.length > 1 && isRingCT )*/
	const { newFee, totalAmount } = estRctFeeAndAmt(params);

	Log.Fee.basedOnInputs(newFee, usingOuts);

	return { newFee, totalAmount };
}

function estRctFeeAndAmt(params: EstRctFeeAndAmtParams) {
	const {
		mixin,

		usingOuts,
		usingOutsAmount,

		simplePriority,

		feePerKB, // obtained from server, so passed in
		networkFee,
		isSweeping,
	} = params;

	let feeBasedOnOuts = calculateFee(
		feePerKB,
		monero_utils.estimateRctSize(usingOuts.length, mixin, 2),
		multiplyFeePriority(simplePriority),
	);

	// if newNeededFee < neededFee, use neededFee instead
	//(should only happen on the 2nd or later times through(due to estimated fee being too low))
	if (feeBasedOnOuts.compare(networkFee) < 0) {
		feeBasedOnOuts = networkFee;
	}

	const [totalAmount, newFee] = isSweeping
		? estRctSwpingAmt(usingOutsAmount, feeBasedOnOuts)
		: estRctNonSwpAmt(params, feeBasedOnOuts);

	return { totalAmount, newFee };
}

function estRctSwpingAmt(usingOutsAmount: JSBigInt, fee: JSBigInt) {
	/* 
	// When/if sending to multiple destinations supported, uncomment and port this:					
	if (dsts.length !== 1) {
		deferred.reject("Sweeping to multiple accounts is not allowed");
		return;
	}
	*/

	// feeless total is equivalent to all outputs (since its a sweeping tx)
	// subtracted from the newNeededFee  (either from min tx cost or calculated cost based on outputs)
	const _feelessTotal = usingOutsAmount.subtract(fee);

	// if the feeless total is less than 0 (so sum of all outputs is still less than network fee)
	// then reject tx
	if (_feelessTotal.compare(0) < 1) {
		throw ERR.BAL.insuff(usingOutsAmount, fee);
	}

	// otherwise make the total amount the feeless total + the new fee
	const totalAmount = _feelessTotal.add(fee);

	return [totalAmount, fee];
}

function estRctNonSwpAmt(params: EstRctFeeAndAmtParams, fee: JSBigInt) {
	const {
		mixin,
		remainingUnusedOuts,
		usingOuts,
		usingOutsAmount,

		simplePriority,
		feelessTotal,
		feePerKB, // obtained from server, so passed in
	} = params;

	// make the current total amount equivalent to the feeless total and the new needed fee
	let currTotalAmount = feelessTotal.add(fee);

	// add outputs 1 at a time till we either have them all or can meet the fee

	// this case can happen when the fee calculated via outs size
	// is greater than the minimum tx fee size,
	// requiring a higher fee, so more outputs (if available)
	// need to be selected to fufill the difference

	let newFee = fee;
	while (
		usingOutsAmount.compare(currTotalAmount) < 0 &&
		remainingUnusedOuts.length > 0
	) {
		const out = popRandElement(remainingUnusedOuts);

		Log.Output.display(out);

		// and recalculate invalidated values
		newFee = calculateFee(
			feePerKB,
			monero_utils.estimateRctSize(usingOuts.length, mixin, 2),
			multiplyFeePriority(simplePriority),
		);
		currTotalAmount = feelessTotal.add(newFee);
	}

	const totalAmount = currTotalAmount;
	return [totalAmount, newFee];
}

// #endregion totalAmtAndEstFee

// #region validateAndConstructFundTargets

/**
 * @description
 * 1. Validates the total amount needed for the tx against the available amounts via the sum of all outputs
 * to see if the sender has sufficient funds.
 *
 * 2. Then, a list of sending targets will be constructed, always consisting of the target address and amount they want to send to, and possibly a change address,
 * if the sum of outs is greater than the amount sent + fee needed, and possibly a fake address + 0 amount to keep output uniformity if no change address
 * was generated.
 *
 * @export
 * @param {ConstructFundTargetsParams} params
 * @returns
 */
export function validateAndConstructFundTargets(
	params: ConstructFundTargetsParams,
) {
	const {
		senderAddress,
		targetAddress,

		feelessTotal,
		totalAmount,
		usingOutsAmount,

		isSweeping,
		isRingCT,

		nettype,
	} = params;

	// Now we can validate available balance with usingOutsAmount (TODO? maybe this check can be done before selecting outputs?)
	const outsCmpToTotalAmounts = usingOutsAmount.compare(totalAmount);
	const outsLessThanTotal = outsCmpToTotalAmounts < 0;
	const outsGreaterThanTotal = outsCmpToTotalAmounts > 0;
	const outsEqualToTotal = outsCmpToTotalAmounts === 0;

	// what follows is comparision of the sum of outs amounts
	// vs the total amount actually needed
	// while also building up a list of addresses to send to
	// along with the amounts
	if (outsLessThanTotal) {
		throw ERR.BAL.insuff(usingOutsAmount, totalAmount);
	}

	// Now we can put together the list of fund transfers we need to perform
	// excluding the tx fee
	// since that is included in the tx in its own field
	const fundTargets: ParsedTarget[] = []; // to build…
	// I. the actual transaction the user is asking to do
	fundTargets.push({
		address: targetAddress,
		amount: feelessTotal,
	});

	// the fee that the hosting provider charges
	// NOTE: The fee has been removed for RCT until a later date
	// fundTransferDescriptions.push({
	//			 address: hostedMoneroAPIClient.HostingServiceFeeDepositAddress(),
	//			 amount: hostingService_chargeAmount
	// })

	// some amount of the total outputs will likely need to be returned to the user as "change":
	if (outsGreaterThanTotal) {
		if (isSweeping) {
			throw ERR.SWEEP.TOTAL_NEQ_OUTS;
		}
		// where the change amount is whats left after sending to other addresses + fee
		const changeAmount = usingOutsAmount.subtract(totalAmount);

		Log.Amount.change(changeAmount);

		if (isRingCT) {
			// for RCT we don't presently care about dustiness so add entire change amount
			Log.Amount.toSelf(changeAmount, senderAddress);

			fundTargets.push({
				address: senderAddress,
				amount: changeAmount,
			});
		} else {
			// pre-ringct
			// do not give ourselves change < dust threshold
			const [quotient, remainder] = changeAmount.divRem(
				config.dustThreshold,
			);

			Log.Amount.changeAmountDivRem([quotient, remainder]);

			if (!remainder.isZero()) {
				// miners will add dusty change to fee
				Log.Fee.belowDustThreshold(remainder);
			}

			if (!quotient.isZero()) {
				// send non-dusty change to our address
				const usableChange = quotient.multiply(config.dustThreshold);

				Log.Amount.toSelf(usableChange, senderAddress);

				fundTargets.push({
					address: senderAddress,
					amount: usableChange,
				});
			}
		}
	} else if (outsEqualToTotal) {
		// if outputs are equivalent to the total amount
		// this should always fire when sweeping
		// since we want to spend all outputs anyway
		if (isRingCT) {
			// then create random destination to keep 2 outputs always in case of 0 change
			// so we dont create 1 output (outlier)
			const fakeAddress = monero_utils.create_address(
				monero_utils.random_scalar(),
				nettype,
			).public_addr;

			Log.Output.uniformity(fakeAddress);

			fundTargets.push({
				address: fakeAddress,
				amount: JSBigInt.ZERO,
			});
		}
	}

	return { fundTargets };
}

// #endregion validateAndConstructFundTargets

//#region constructTx

export function constructTx(params: ConstructTxParams) {
	const { signedTx } = makeSignedTx(params);
	const { serializedSignedTx, txHash } = getSerializedTxAndHash(signedTx);
	const { numOfKB } = getTxSize(serializedSignedTx, params.networkFee);

	return { numOfKB, txHash, serializedSignedTx };
}

function makeSignedTx(params: ConstructTxParams) {
	try {
		const {
			senderPublicKeys,
			senderPrivateKeys,

			targetAddress,
			fundTargets,

			pid,
			encryptPid,

			mixOuts,
			mixin,
			usingOuts,

			networkFee,

			isRingCT,

			nettype,
		} = params;

		Log.Target.fullDisplay(fundTargets);

		const targetViewKey = getTargetPubViewKey(
			encryptPid,
			targetAddress,
			nettype,
		);

		const splitDestinations: ParsedTarget[] = monero_utils.decompose_tx_destinations(
			fundTargets,
			isRingCT,
		);
		Log.Target.displayDecomposed(splitDestinations);

		const signedTx = monero_utils.create_transaction(
			senderPublicKeys,
			senderPrivateKeys,
			splitDestinations,
			usingOuts,
			mixOuts,
			mixin,
			networkFee,
			pid,
			encryptPid,
			targetViewKey,
			0,
			isRingCT,
			nettype,
		);

		Log.Transaction.signed(signedTx);

		return { signedTx };
	} catch (e) {
		throw ERR.TX.failure(e);
	}
}

function getSerializedTxAndHash(signedTx) {
	type ReturnVal = {
		serializedSignedTx: string;
		txHash: string;
	};

	// pre rct
	if (signedTx.version === 1) {
		const serializedSignedTx = monero_utils.serialize_tx(signedTx);
		const txHash = monero_utils.cn_fast_hash(serializedSignedTx);

		const ret: ReturnVal = {
			serializedSignedTx,
			txHash,
		};

		Log.Transaction.serializedAndHash(serializedSignedTx, txHash);

		return ret;
	}
	// rct
	else {
		const { raw, hash } = monero_utils.serialize_rct_tx_with_hash(signedTx);

		const ret: ReturnVal = {
			serializedSignedTx: raw,
			txHash: hash,
		};

		Log.Transaction.serializedAndHash(raw, hash);

		return ret;
	}
}

function getTxSize(serializedSignedTx: string, estMinNetworkFee: JSBigInt) {
	// work out per-kb fee for transaction and verify that it's enough
	const txBlobBytes = serializedSignedTx.length / 2;
	let numOfKB = Math.floor(txBlobBytes / 1024);
	if (txBlobBytes % 1024) {
		numOfKB++;
	}

	Log.Fee.txKB(txBlobBytes, numOfKB, estMinNetworkFee);
	return { numOfKB };
}

// #endregion constructTx
