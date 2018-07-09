import { JSBigInt } from "types";

/**
 * @description Gets a starting total amount.
 *
 *  In the case of a sweeping transaction, the maximum possible amount (based on 64 bits unsigned integer) is chosen,
 * since all of the user's outputs will be used regardless.
 *
 * Otherwise, the feeless total (also known as the amount the sender actually wants to send to the given target address)
 * is summed with the network fee to give the total amount returned
 *
 * @export
 * @param {boolean} isSweeping
 * @param {JSBigInt} feelessTotal
 * @param {JSBigInt} networkFee
 * @returns
 */
export function getBaseTotalAmount(
	isSweeping: boolean,
	feelessTotal: JSBigInt,
	networkFee: JSBigInt,
) {
	// const hostingService_chargeAmount = hostedMoneroAPIClient.HostingServiceChargeFor_transactionWithNetworkFee(attemptAt_network_minimumFee)

	if (isSweeping) {
		return new JSBigInt("18450000000000000000"); //~uint64 max
	} else {
		return feelessTotal.add(
			networkFee,
		); /*.add(hostingService_chargeAmount) NOTE service fee removed for now */
	}
}
