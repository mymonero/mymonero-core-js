import { JSBigInt } from "types";

export type ViewSendKeys = {
	view: string;
	spend: string;
};
export type RawTarget = {
	address: string;
	amount: number;
};

export type ParsedTarget = {
	address: string;
	amount: JSBigInt;
};

export type Pid = string | null;

export type Output = {
	amount: string;
	public_key: string;
	index: number;
	global_index: number;
	rct: string;
	tx_id: number;
	tx_hash: string;
	tx_pub_key: string;
	tx_prefix_hash: string;
	spend_key_images: string;
	timestamp: string;
	height: number;
};

export type AmountOutput = {
	amount: string;
	outputs: RandomOutput[];
};

type RandomOutput = {
	global_index: string;
	public_key: string;
	rct: string;
};
