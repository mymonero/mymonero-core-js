import monero_utils from "monero_utils/monero_cryptonote_utils_instance";
import { ParsedTarget, Output } from "./types";
import { JSBigInt } from "types";

export namespace Log {
	export namespace Amount {
		export function beforeFee(feelessTotal: JSBigInt, isSweeping: boolean) {
			const feeless_total = isSweeping
				? "all"
				: monero_utils.formatMoney(feelessTotal);
			console.log(`💬  Total to send, before fee: ${feeless_total}`);
		}

		export function change(changeAmount: JSBigInt) {
			console.log("changeAmount", changeAmount);
		}

		export function changeAmountDivRem(amt: [JSBigInt, JSBigInt]) {
			console.log("💬  changeAmountDivRem", amt);
		}

		export function toSelf(changeAmount: JSBigInt, selfAddress: string) {
			console.log(
				"Sending change of " +
					monero_utils.formatMoneySymbol(changeAmount) +
					" to " +
					selfAddress,
			);
		}
	}

	export namespace Fee {
		export function dynPerKB(dynFeePerKB: JSBigInt) {
			console.log(
				"Received dynamic per kb fee",
				monero_utils.formatMoneySymbol(dynFeePerKB),
			);
		}
		export function basedOnInputs(
			newNeededFee: JSBigInt,
			usingOuts: Output[],
		) {
			console.log(
				"New fee: " +
					monero_utils.formatMoneySymbol(newNeededFee) +
					" for " +
					usingOuts.length +
					" inputs",
			);
		}
		export function belowDustThreshold(changeDivDustRemainder: JSBigInt) {
			console.log(
				"💬  Miners will add change of " +
					monero_utils.formatMoneyFullSymbol(changeDivDustRemainder) +
					" to transaction fee (below dust threshold)",
			);
		}

		export function estLowerThanReal(
			estMinNetworkFee: JSBigInt,
			feeActuallyNeededByNetwork: JSBigInt,
		) {
			console.log(
				"💬  Need to reconstruct the tx with enough of a network fee. Previous fee: " +
					monero_utils.formatMoneyFull(estMinNetworkFee) +
					" New fee: " +
					monero_utils.formatMoneyFull(feeActuallyNeededByNetwork),
			);
			console.log("Reconstructing tx....");
		}

		export function txKB(
			txBlobBytes: number,
			numOfKB: number,
			estMinNetworkFee: JSBigInt,
		) {
			console.log(
				txBlobBytes +
					" bytes <= " +
					numOfKB +
					" KB (current fee: " +
					monero_utils.formatMoneyFull(estMinNetworkFee) +
					")",
			);
		}

		export function successfulTx(finalNetworkFee: JSBigInt) {
			console.log(
				"💬  Successful tx generation, submitting tx. Going with final_networkFee of ",
				monero_utils.formatMoney(finalNetworkFee),
			);
		}
	}

	export namespace Balance {
		export function requiredBase(
			totalAmount: JSBigInt,
			isSweeping: boolean,
		) {
			if (isSweeping) {
				console.log("Balance required: all");
			} else {
				console.log(
					"Balance required: " +
						monero_utils.formatMoneySymbol(totalAmount),
				);
			}
		}

		export function requiredPostRct(totalAmount: JSBigInt) {
			console.log(
				"~ Balance required: " +
					monero_utils.formatMoneySymbol(totalAmount),
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
					monero_utils.formatMoney(out.amount) +
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
			monero_utils.printDsts(fundTargets);
		}

		export function displayDecomposed(splitDestinations: ParsedTarget[]) {
			console.log("Decomposed destinations:");
			monero_utils.printDsts(splitDestinations);
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
		export function target(targetAmount: JSBigInt) {
			console.log(
				"Selecting outputs to use. target: " +
					monero_utils.formatMoney(targetAmount),
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

		export function usingOut(outAmount: JSBigInt, out: Output) {
			console.log(
				`Using output: ${monero_utils.formatMoney(
					outAmount,
				)} - ${JSON.stringify(out)}`,
			);
		}
	}
}
