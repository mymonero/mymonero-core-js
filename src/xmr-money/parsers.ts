import { config } from "xmr-constants/coin-config";
import { BigInt } from "biginteger";
import { ParsedTarget } from "xmr-types";

/**
 *
 * @param {string} str
 */
export function parseMoney(str: string): BigInt {
	if (!str) return BigInt.ZERO;
	const negative = str[0] === "-";
	if (negative) {
		str = str.slice(1);
	}
	const decimalIndex = str.indexOf(".");
	if (decimalIndex == -1) {
		if (negative) {
			return config.coinUnits.multiply(str).negate();
		}
		return config.coinUnits.multiply(str);
	}
	if (decimalIndex + config.coinUnitPlaces + 1 < str.length) {
		str = str.substr(0, decimalIndex + config.coinUnitPlaces + 1);
	}
	if (negative) {
		return new BigInt(str.substr(0, decimalIndex))
			.exp10(config.coinUnitPlaces)
			.add(
				new BigInt(str.substr(decimalIndex + 1)).exp10(
					decimalIndex + config.coinUnitPlaces - str.length + 1,
				),
			)
			.negate();
	}
	return new BigInt(str.substr(0, decimalIndex))
		.exp10(config.coinUnitPlaces)
		.add(
			new BigInt(str.substr(decimalIndex + 1)).exp10(
				decimalIndex + config.coinUnitPlaces - str.length + 1,
			),
		);
}

export function decompose_tx_destinations(dsts: ParsedTarget[], rct: boolean) {
	const out = [];
	if (rct) {
		for (let i = 0; i < dsts.length; i++) {
			out.push({
				address: dsts[i].address,
				amount: dsts[i].amount,
			});
		}
	} else {
		for (let i = 0; i < dsts.length; i++) {
			const digits = decompose_amount_into_digits(dsts[i].amount);
			for (let j = 0; j < digits.length; j++) {
				if (digits[j].compare(0) > 0) {
					out.push({
						address: dsts[i].address,
						amount: digits[j],
					});
				}
			}
		}
	}
	return out.sort((a, b) => a.amount.subtract(b.amount).toJSValue());
}

function decompose_amount_into_digits(amount: BigInt) {
	let amtStr = amount.toString();
	const ret = [];
	while (amtStr.length > 0) {
		//check so we don't create 0s
		if (amtStr[0] !== "0") {
			let digit = amtStr[0];
			while (digit.length < amtStr.length) {
				digit += "0";
			}
			ret.push(new BigInt(digit));
		}
		amtStr = amtStr.slice(1);
	}
	return ret;
}
