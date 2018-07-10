import { JSBigInt } from "types";

export const DEFAULT_FEE_PRIORITY = 1;

export function calculateFee(
	feePerKB: JSBigInt,
	numOfBytes: number,
	feeMultiplier: number,
) {
	const numberOf_kB = new JSBigInt((numOfBytes + 1023.0) / 1024.0); // i.e. ceil

	return calculateFeeKb(feePerKB, numberOf_kB, feeMultiplier);
}

export function calculateFeeKb(
	feePerKB: JSBigInt,
	numOfBytes: JSBigInt | number,
	feeMultiplier: number,
) {
	const numberOf_kB = new JSBigInt(numOfBytes);
	const fee = feePerKB.multiply(feeMultiplier).multiply(numberOf_kB);

	return fee;
}

export function multiplyFeePriority(prio: number) {
	const fee_multiplier = [1, 4, 20, 166];

	const priority = prio || DEFAULT_FEE_PRIORITY;

	if (priority <= 0 || priority > fee_multiplier.length) {
		throw "fee_multiplier_for_priority: simple_priority out of bounds";
	}
	const priority_idx = priority - 1;
	return fee_multiplier[priority_idx];
}
