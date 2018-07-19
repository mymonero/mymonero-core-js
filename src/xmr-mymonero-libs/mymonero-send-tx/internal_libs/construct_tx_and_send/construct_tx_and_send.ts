import { sendFundStatus } from "../../status_update_constants";
import { selectOutputsAndAmountForMixin } from "../output_selection";
import { multiplyFeePriority, calculateFeeKb } from "../fee_utils";
import { ERR } from "../errors";
import { Log } from "../logger";
import {
	constructTx,
	totalAmtAndEstFee,
	validateAndConstructFundTargets,
} from "../tx_utils/tx_utils";
import { getBaseTotalAmount } from "../amt_utils";
import {
	CreateTxAndAttemptToSendParams,
	GetFundTargetsAndFeeParams,
} from "./types";

/**
 *
 * @description
 * 1. Recalculates the fee and total amount needed for the transaction to be sent. RCT + non sweeping transactions will have their
 * network fee increased if fee calculation based on the number of outputs needed is higher than the passed-in fee. RCT+ sweeping transactions
 * are just checked if they have enough balance to proceed with the transaction. Non-RCT transactions will have no fee recalculation done on them.
 *
 *
 * 2. The resulting return values from step 1 will then be validated so that the sender has sufficient balances to proceed with sending the transaction.
 * Then, a list of sending targets will be constructed, always consisting of the target address and amount they want to send to, and possibly a change address,
 * if the sum of outs is greater than the amount sent + fee needed, and possibly a fake address + 0 amount to keep output uniformity if no change address
 * was generated.
 *
 *
 * 3. Finally, a list of random outputs is fetched from API to be mixed into the transaction (for generation of the ring signature) to provide anonymity for the sender.
 *
 *
 * NOTE: This function may be called more than once (although I believe two times is the maximum) if the recalculated fee is lower than the
 * actual transaction fee needed when the final fee is calculated from the size of the transaction itself. In the case that the previously mentioned
 * condition is true, then this function will be re-called with the updated higher fee based on the transaction size in kb.
 * @export
 * @param {GetFundTargetsAndFeeParams} params
 */
export async function getRestOfTxData(params: GetFundTargetsAndFeeParams) {
	const {
		senderAddress,

		targetAddress,

		mixin,
		unusedOuts,

		simplePriority,
		feelessTotal,
		feePerKB, // obtained from server, so passed in
		networkFee,

		isRingCT,
		isSweeping,

		updateStatus,
		api,
		nettype,
	} = params;

	// Now we need to establish some values for balance validation and to construct the transaction
	updateStatus(sendFundStatus.calculatingFee);

	const baseTotalAmount = getBaseTotalAmount(
		isSweeping,
		feelessTotal,
		networkFee,
	);

	Log.Balance.requiredBase(baseTotalAmount, isSweeping);

	const {
		remainingUnusedOuts, // this is a copy of the pre-mutation usingOuts
		usingOuts,
		usingOutsAmount,
	} = selectOutputsAndAmountForMixin(
		baseTotalAmount,
		unusedOuts,
		isRingCT,
		isSweeping,
	);

	// v-- now if RingCT compute fee as closely as possible before hand

	const { newFee, totalAmount } = totalAmtAndEstFee({
		baseTotalAmount,
		feelessTotal,
		feePerKB,
		isRingCT,
		isSweeping,
		mixin,
		networkFee,
		remainingUnusedOuts,
		simplePriority,
		usingOuts,
		usingOutsAmount,
	});
	Log.Balance.requiredPostRct(totalAmount);

	const { fundTargets } = validateAndConstructFundTargets({
		senderAddress,
		targetAddress,

		feelessTotal,
		totalAmount,
		usingOutsAmount,

		isRingCT,
		isSweeping,
		nettype,
	});
	Log.Target.display(fundTargets);

	// check for invalid mixin level
	if (mixin < 0 || isNaN(mixin)) {
		throw ERR.MIXIN.INVAL;
	}

	// if we want to have mixin for anonyminity
	if (mixin > 0) {
		updateStatus(sendFundStatus.fetchingDecoyOutputs);

		// grab random outputs to make a ring signature with
		const { mixOuts } = await api.randomOuts(usingOuts, mixin);

		return { mixOuts, fundTargets, newFee, usingOuts };
	}

	// mixin === 0: -- PSNOTE: is that even allowed?
	return { mixOuts: undefined, fundTargets, newFee, usingOuts };
}

/**
 * @description Creates the transaction blob and attempts to send it.
 *
 *
 * The transaction blob will be not sent if the resulting fee calculated based on the blobs size
 * is higher than the provided fee to the function, instead itll return a failure result, along
 * with the fee based on the transaction blob.
 *
 *
 * Otherwise, the serialized transaction blob will be sent to the API endpoint, along with
 * a success return value with the fee + transaction blobs' hash
 *
 * @export
 * @param {CreateTxAndAttemptToSendParams} params
 */
export async function createTxAndAttemptToSend(
	params: CreateTxAndAttemptToSendParams,
) {
	const {
		senderAddress,
		senderPrivateKeys,

		simplePriority,

		feePerKB,
		networkFee,

		updateStatus,
		api,
	} = params;

	updateStatus(sendFundStatus.constructingTransaction);

	const { numOfKB, serializedSignedTx, txHash } = constructTx(params);

	const txFee = calculateFeeKb(
		feePerKB,
		numOfKB,
		multiplyFeePriority(simplePriority),
	);
	// if we need a higher fee
	if (txFee.compare(networkFee) > 0) {
		Log.Fee.estLowerThanReal(networkFee, txFee);
		return { success: false, txFee, txHash };
	}

	// generated with correct per-kb fee
	Log.Fee.successfulTx(networkFee);
	updateStatus(sendFundStatus.submittingTransaction);

	await api.submitSerializedSignedTransaction(
		senderAddress,
		senderPrivateKeys,
		serializedSignedTx,
	);

	return { success: true, txFee: networkFee, txHash };
}
