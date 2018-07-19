import { isValidOrNoPaymentID } from "xmr-pid";
import { ERR } from "./errors";
import { decode_address, is_subaddress } from "xmr-address-utils";
import { NetType } from "xmr-types";

/**
 *
 *  @description
 *  Attempts to decode the provided address based on its nettype to break it down into its components
 *  {pubSend, pubView, integratedPaymentId}
 *
 * Then based on the decoded values, determines if the payment ID (if supplied) should be encrypted or not.
 *
 * If a payment ID is not supplied, it may be grabbed from the integratedPaymentId component of the decoded
 * address if provided.
 *
 * At each step, invariants are enforced to prevent the following scenarios.
 *
 *
 * 1. Supplied PID + Integrated PID
 * 2. Supplied PID + Sending to subaddress
 * 3. Invalid supplied PID
 *
 *
 * @export
 * @param {string} address
 * @param {NetType} nettype
 * @param {(string | null)} pid
 */
export function checkAddressAndPidValidity(
	address: string,
	nettype: NetType,
	pid: string | null,
) {
	let retPid = pid;
	let encryptPid = false;

	const decodedAddress = decode_address(address, nettype);
	// assert that the target address is not of type integrated nor subaddress
	// if a payment id is included
	if (retPid) {
		if (decodedAddress.intPaymentId) {
			throw ERR.PID.NO_INTEG_ADDR;
		} else if (is_subaddress(address, nettype)) {
			throw ERR.PID.NO_SUB_ADDR;
		}
	}

	// if the target address is integrated
	// then encrypt the payment id
	// and make sure its also valid
	if (decodedAddress.intPaymentId) {
		retPid = decodedAddress.intPaymentId;
		encryptPid = true;
	} else if (!isValidOrNoPaymentID(retPid)) {
		throw ERR.PID.INVAL;
	}

	return { pid: retPid, encryptPid };
}
