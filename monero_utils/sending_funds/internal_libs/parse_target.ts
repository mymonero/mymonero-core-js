import { ParsedTarget, RawTarget } from "./types";
import { NetType } from "cryptonote_utils/nettype";
import { ERR } from "./errors";
import monero_utils from "monero_utils/monero_cryptonote_utils_instance";
import { possibleOAAddress } from "./open_alias_lite";
import { JSBigInt } from "types";

/**
 * @description Map through the provided targets and normalize each address/amount pair
 *
 * Addresses are checked to see if they may belong to an OpenAlias address, and rejected if so.
 * Then they are validated by attempting to decode them.
 *
 * Amounts are attempted to be parsed from string value to BigInt value
 *
 * The validated address / parsed amount pairs are then returned
 *
 * @export
 * @param {RawTarget[]} targetsToParse
 * @param {NetType} nettype
 * @returns {ParsedTarget[]}
 */
export function parseTargets(
	targetsToParse: RawTarget[],
	nettype: NetType,
): ParsedTarget[] {
	return targetsToParse.map(({ address, amount }) => {
		if (!address && !amount) {
			throw ERR.PARSE_TRGT.EMPTY;
		}

		if (possibleOAAddress(address)) {
			throw ERR.PARSE_TRGT.OA_RES;
		}
		const amountStr = amount.toString();

		try {
			monero_utils.decode_address(address, nettype);
		} catch (e) {
			throw ERR.PARSE_TRGT.decodeAddress(address, e);
		}

		try {
			const parsedAmount: JSBigInt = monero_utils.parseMoney(amountStr);
			return { address, amount: parsedAmount };
		} catch (e) {
			throw ERR.PARSE_TRGT.amount(amountStr, e);
		}
	});
}
