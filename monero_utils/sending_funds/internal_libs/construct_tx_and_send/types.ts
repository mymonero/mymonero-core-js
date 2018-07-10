import { WrappedNodeApi } from "../async_node_api";
import { NetType } from "cryptonote_utils/nettype";
import {
	ViewSendKeys,
	JSBigInt,
	ParsedTarget,
	Pid,
	Output,
	AmountOutput,
} from "../types";
import { Status } from "../../status_update_constants";

export type GetFundTargetsAndFeeParams = {
	senderAddress: string;
	senderPublicKeys: ViewSendKeys;
	senderPrivateKeys: ViewSendKeys;

	targetAddress: string;
	targetAmount: number;

	mixin: number;
	unusedOuts: Output[];

	simplePriority: number;
	feelessTotal: JSBigInt;
	feePerKB: JSBigInt; // obtained from server, so passed in
	networkFee: JSBigInt;

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
	feelessTotal: JSBigInt;
	feePerKB: JSBigInt; // obtained from server, so passed in
	networkFee: JSBigInt;

	isSweeping: boolean;
	isRingCT: boolean;

	updateStatus: (status: Status) => void;
	api: WrappedNodeApi;
	nettype: NetType;
};
