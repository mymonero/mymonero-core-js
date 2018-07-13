import { NetType } from "cryptonote_utils/nettype";
import { Log } from "./logger";
import { decode_address } from "cryptonote_utils";

export function getTargetPubViewKey(
	encPid: boolean,
	targetAddress: string,
	nettype: NetType,
): string | undefined {
	if (encPid) {
		const key = decode_address(targetAddress, nettype).view;

		Log.Target.viewKey(key);
		return key;
	}
}
