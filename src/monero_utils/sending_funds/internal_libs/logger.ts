import { ParsedTarget, Output } from "./types";
import { BigInt } from "biginteger";
import {
	formatMoneySymbol,
	formatMoneyFullSymbol,
	formatMoney,
	formatMoneyFull,
	printDsts,
} from "cryptonote_utils/formatters";

export namespace Log {
	export namespace Amount {
		export function beforeFee(feelessTotal: BigInt, isSweeping: boolean) {
			const feeless_total = isSweeping
				? "all"
				: formatMoney(feelessTotal);
			console.log(`💬  Total to send, before fee: ${feeless_total}`);
		}

		export function change(changeAmount: BigInt) {
			console.log("changeAmount", changeAmount);
		}

		export function changeAmountDivRem(amt: [BigInt, BigInt]) {
			console.log("💬  changeAmountDivRem", amt);
		}

		export function toSelf(changeAmount: BigInt, selfAddress: string) {
			console.log(
				"Sending change of " +
					formatMoneySymbol(changeAmount) +
					" to " +
					selfAddress,
			);
		}
	}

	export namespace Fee {
		export function dynPerKB(dynFeePerKB: BigInt) {
			console.log(
				"Received dynamic per kb fee",
				formatMoneySymbol(dynFeePerKB),
			);
		}
		export function basedOnInputs(
			newNeededFee: BigInt,
			usingOuts: Output[],
		) {
			console.log(
				"New fee: " +
					formatMoneySymbol(newNeededFee) +
					" for " +
					usingOuts.length +
					" inputs",
			);
		}
		export function belowDustThreshold(changeDivDustRemainder: BigInt) {
			console.log(
				"💬  Miners will add change of " +
					formatMoneyFullSymbol(changeDivDustRemainder) +
					" to transaction fee (below dust threshold)",
			);
		}

		export function estLowerThanReal(
			estMinNetworkFee: BigInt,
			feeActuallyNeededByNetwork: BigInt,
		) {
			console.log(
				"💬  Need to reconstruct the tx with enough of a network fee. Previous fee: " +
					formatMoneyFull(estMinNetworkFee) +
					" New fee: " +
					formatMoneyFull(feeActuallyNeededByNetwork),
			);
			console.log("Reconstructing tx....");
		}

		export function txKB(
			txBlobBytes: number,
			numOfKB: number,
			estMinNetworkFee: BigInt,
		) {
			console.log(
				txBlobBytes +
					" bytes <= " +
					numOfKB +
					" KB (current fee: " +
					formatMoneyFull(estMinNetworkFee) +
					")",
			);
		}

		export function successfulTx(finalNetworkFee: BigInt) {
			console.log(
				"💬  Successful tx generation, submitting tx. Going with final_networkFee of ",
				formatMoney(finalNetworkFee),
			);
		}
	}

	export namespace Balance {
		export function requiredBase(totalAmount: BigInt, isSweeping: boolean) {
			if (isSweeping) {
				console.log("Balance required: all");
			} else {
				console.log(
					"Balance required: " + formatMoneySymbol(totalAmount),
				);
			}
		}

		export function requiredPostRct(totalAmount: BigInt) {
			console.log(
				"~ Balance required: " + formatMoneySymbol(totalAmount),
			);
		}
	}

	export namespace Output {
		export function uniformity(fakeAddress: string) {
			console.log(
				"Sending 0 XMR to a fake address to keep tx uniform (no change exists): " +
					fakeAddress,
			);
		}

		export function display(out: Output) {
			console.log(
				"Using output: " +
					formatMoney(out.amount) +
					" - " +
					JSON.stringify(out),
			);
		}
	}

	export namespace Target {
		export function display(fundTargets: ParsedTarget[]) {
			console.log("fundTransferDescriptions so far", fundTargets);
		}

		export function fullDisplay(fundTargets: ParsedTarget[]) {
			console.log("Destinations: ");
			printDsts(fundTargets);
		}

		export function displayDecomposed(splitDestinations: ParsedTarget[]) {
			console.log("Decomposed destinations:");
			printDsts(splitDestinations);
		}

		export function viewKey(viewKey: string) {
			console.log("got target address's view key", viewKey);
		}
	}

	export namespace Transaction {
		export function signed(signedTx) {
			console.log("signed tx: ", JSON.stringify(signedTx));
		}
		export function serializedAndHash(
			serializedTx: string,
			txHash: string,
		) {
			console.log("tx serialized: " + serializedTx);
			console.log("Tx hash: " + txHash);
		}
	}

	export namespace SelectOutsAndAmtForMix {
		export function target(targetAmount: BigInt) {
			console.log(
				"Selecting outputs to use. target: " +
					formatMoney(targetAmount),
			);
		}

		export namespace Dusty {
			export function notSweeping() {
				console.log(
					"Not sweeping, and found a dusty (though maybe mixable) output... skipping it!",
				);
			}
			export function nonRct() {
				console.log(
					"Sweeping, and found a dusty but unmixable (non-rct) output... skipping it!",
				);
			}
			export function rct() {
				console.log(
					"Sweeping and found a dusty but mixable (rct) amount... keeping it!",
				);
			}
		}

		export function usingOut(outAmount: BigInt, out: Output) {
			console.log(
				`Using output: ${formatMoney(outAmount)} - ${JSON.stringify(
					out,
				)}`,
			);
		}
	}
}
