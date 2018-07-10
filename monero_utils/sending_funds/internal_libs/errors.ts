import { JSBigInt } from "types";
import { config } from "monero_utils/monero_config";
import monero_utils from "monero_utils/monero_cryptonote_utils_instance";

export namespace ERR {
	export namespace RING {
		export const INSUFF = Error("Ringsize is below the minimum.");
	}

	export namespace MIXIN {
		export const INVAL = Error("Invalid mixin");
	}
	export namespace DEST {
		export const INVAL = Error("You need to enter a valid destination");
	}

	export namespace AMT {
		export const INSUFF = Error("The amount you've entered is too low");
	}

	export namespace PID {
		export const NO_INTEG_ADDR = Error(
			"Payment ID must be blank when using an Integrated Address",
		);
		export const NO_SUB_ADDR = Error(
			"Payment ID must be blank when using a Subaddress",
		);
		export const INVAL = Error("Invalid payment ID.");
	}

	export namespace BAL {
		export function insuff(amtAvail: JSBigInt, requiredAmt: JSBigInt) {
			const { coinSymbol } = config;
			const amtAvailStr = monero_utils.formatMoney(amtAvail);
			const requiredAmtStr = monero_utils.formatMoney(requiredAmt);
			const errStr = `Your spendable balance is too low. Have ${amtAvailStr} ${coinSymbol} spendable, need ${requiredAmtStr} ${coinSymbol}.`;
			return Error(errStr);
		}
	}

	export namespace SWEEP {
		export const TOTAL_NEQ_OUTS = Error(
			"The sum of all outputs should be equal to the total amount for sweeping transactions",
		);
	}

	export namespace TX {
		export function failure(err?: Error) {
			const errStr = err
				? err.toString()
				: "Failed to create transaction with unknown error.";

			return Error(errStr);
		}
		export function submitUnknown(err: Error) {
			return Error(
				"Something unexpected occurred when submitting your transaction: " +
					err,
			);
		}
	}

	export namespace PARSE_TRGT {
		export const EMPTY = Error(
			"Please supply a target address and a target amount.",
		);
		export const OA_RES = Error(
			"You must resolve this OpenAlias address to a Monero address before calling SendFunds",
		);

		export function decodeAddress(targetAddress: string, err: Error) {
			return Error(`Couldn't decode address ${targetAddress} : ${err}`);
		}

		export function amount(targetAmount: string, err: Error) {
			return Error(`Couldn't parse amount ${targetAmount} : ${err}`);
		}
	}
}
