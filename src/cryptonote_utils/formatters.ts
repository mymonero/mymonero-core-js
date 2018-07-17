import { config } from "monero_utils/monero_config";
import { BigInt } from "biginteger";
import { ParsedTarget } from "monero_utils/sending_funds/internal_libs/types";

export function formatMoneyFull(units: BigInt | string) {
	let strUnits = units.toString();
	const symbol = strUnits[0] === "-" ? "-" : "";
	if (symbol === "-") {
		strUnits = strUnits.slice(1);
	}
	let decimal;
	if (strUnits.length >= config.coinUnitPlaces) {
		decimal = strUnits.substr(
			strUnits.length - config.coinUnitPlaces,
			config.coinUnitPlaces,
		);
	} else {
		decimal = padLeft(strUnits, config.coinUnitPlaces, "0");
	}
	return (
		symbol +
		(strUnits.substr(0, strUnits.length - config.coinUnitPlaces) || "0") +
		"." +
		decimal
	);
}

export function formatMoneyFullSymbol(units: BigInt | string) {
	return formatMoneyFull(units) + " " + config.coinSymbol;
}

export function formatMoney(units: BigInt | string) {
	const f = trimRight(formatMoneyFull(units), "0");
	if (f[f.length - 1] === ".") {
		return f.slice(0, f.length - 1);
	}
	return f;
}

export function formatMoneySymbol(units: BigInt | string) {
	return formatMoney(units) + " " + config.coinSymbol;
}

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

export function printDsts(dsts: ParsedTarget[]) {
	for (let i = 0; i < dsts.length; i++) {
		console.log(dsts[i].address + ": " + formatMoneyFull(dsts[i].amount));
	}
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

function trimRight(str: string, char: string) {
	while (str[str.length - 1] == char) str = str.slice(0, -1);
	return str;
}

export function padLeft(str: string, len: number, char: string) {
	while (str.length < len) {
		str = char + str;
	}
	return str;
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
