import { WrappedNodeApi } from "../async_node_api";
import { NetType } from "cryptonote_utils/nettype";
import {
	ViewSendKeys,
	ParsedTarget,
	Pid,
	Output,
	AmountOutput,
} from "../types";
import { Status } from "../../status_update_constants";
import { BigInt } from "biginteger";

export type GetFundTargetsAndFeeParams = {
	senderAddress: string;
	senderPublicKeys: ViewSendKeys;
	senderPrivateKeys: ViewSendKeys;

	targetAddress: string;
	targetAmount: number;

	mixin: number;
	unusedOuts: Output[];

	simplePriority: number;
	feelessTotal: BigInt;
	feePerKB: BigInt; // obtained from server, so passed in
	networkFee: BigInt;

	isSweeping: boolean;
	isRingCT: boolean;

	updateStatus: (status: Status) => void;
	api: WrappedNodeApi;
	nettype: NetType;
};

export type CreateTxAndAttemptToSendParams = {
	targetAddress: string;
	targetAmount: number;

	senderAddress: string;
	senderPublicKeys: ViewSendKeys;
	senderPrivateKeys: ViewSendKeys;

	fundTargets: ParsedTarget[];

	pid: Pid; // unused
	encryptPid: boolean;

	mixOuts?: AmountOutput[];
	mixin: number;
	usingOuts: Output[];

	simplePriority: number;
	feelessTotal: BigInt;
	feePerKB: BigInt; // obtained from server, so passed in
	networkFee: BigInt;

	isSweeping: boolean;
	isRingCT: boolean;

	updateStatus: (status: Status) => void;
	api: WrappedNodeApi;
	nettype: NetType;
};
