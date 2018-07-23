import { popRandElement } from "./arr_utils";
import { Log } from "./logger";
import { BigInt } from "biginteger";
import { config } from "xmr-constants/coin-config";
import { Output } from "xmr-types";

export function selectOutputsAndAmountForMixin(
	targetAmount: BigInt,
	unusedOuts: Output[],
	isRingCT: boolean,
	sweeping: boolean,
) {
	Log.SelectOutsAndAmtForMix.target(targetAmount);

	let usingOutsAmount = new BigInt(0);
	const usingOuts: Output[] = [];
	const remainingUnusedOuts = unusedOuts.slice(); // take copy so as to prevent issue if we must re-enter tx building fn if fee too low after building
	while (
		usingOutsAmount.compare(targetAmount) < 0 &&
		remainingUnusedOuts.length > 0
	) {
		const out = popRandElement(remainingUnusedOuts);
		if (!isRingCT && out.rct) {
			// out.rct is set by the server
			continue; // skip rct outputs if not creating rct tx
		}
		const outAmount = new BigInt(out.amount);
		if (outAmount.compare(config.dustThreshold) < 0) {
			// amount is dusty..
			if (!sweeping) {
				Log.SelectOutsAndAmtForMix.Dusty.notSweeping();
				continue;
			}
			if (!out.rct) {
				Log.SelectOutsAndAmtForMix.Dusty.rct();
				continue;
			} else {
				Log.SelectOutsAndAmtForMix.Dusty.nonRct();
			}
		}
		usingOuts.push(out);
		usingOutsAmount = usingOutsAmount.add(outAmount);

		Log.SelectOutsAndAmtForMix.usingOut(outAmount, out);
	}
	return {
		usingOuts,
		usingOutsAmount,
		remainingUnusedOuts,
	};
}
