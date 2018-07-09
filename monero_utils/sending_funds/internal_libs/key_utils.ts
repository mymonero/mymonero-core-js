import { NetType } from "cryptonote_utils/nettype";
import monero_utils from "monero_utils/monero_cryptonote_utils_instance";
import { Log } from "./logger";

export function getTargetPubViewKey(
	encPid: boolean,
	targetAddress: string,
	nettype: NetType,
): string | undefined {
	if (encPid) {
		const key = monero_utils.decode_address(targetAddress, nettype).view;

		Log.Target.viewKey(key);
		return key;
	}
}
