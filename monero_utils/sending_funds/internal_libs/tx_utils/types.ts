import { NetType } from "cryptonote_utils/nettype";
import {
	ParsedTarget,
	Pid,
	ViewSendKeys,
	Output,
	AmountOutput,
} from "../types";
import { JSBigInt } from "types";

export type ConstructTxParams = {
	senderPublicKeys: ViewSendKeys;
	senderPrivateKeys: ViewSendKeys;

	targetAddress: string;
	fundTargets: ParsedTarget[];

	pid: Pid;
	encryptPid: boolean;

	mixOuts?: AmountOutput[];
	mixin: number;
	usingOuts: Output[];

	networkFee: JSBigInt;

	isRingCT: boolean;

	nettype: NetType;
};

export type TotalAmtAndEstFeeParams = {
	usingOutsAmount: JSBigInt;
	baseTotalAmount: JSBigInt;

	mixin: number;
	remainingUnusedOuts: Output[];
	usingOuts: Output[];

	simplePriority: number;
	feelessTotal: JSBigInt;
	feePerKB: JSBigInt; // obtained from server, so passed in
	networkFee: JSBigInt;

	isSweeping: boolean;
	isRingCT: boolean;
};

export type EstRctFeeAndAmtParams = {
	mixin: number;
	usingOutsAmount: JSBigInt;
	remainingUnusedOuts: Output[];
	usingOuts: Output[];

	simplePriority: number;
	feelessTotal: JSBigInt;
	feePerKB: JSBigInt; // obtained from server, so passed in
	networkFee: JSBigInt;

	isSweeping: boolean;
};

export type ConstructFundTargetsParams = {
	senderAddress: string;
	targetAddress: string;

	feelessTotal: JSBigInt;
	totalAmount: JSBigInt;
	usingOutsAmount: JSBigInt;

	isSweeping: boolean;
	isRingCT: boolean;

	nettype: NetType;
};
