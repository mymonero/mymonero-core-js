import { BigInt } from "biginteger";
import { RCTSignatures } from "xmr-transaction/libs/ringct";

export interface TransactionInput {
	type: string;
	amount: string;
	k_image: string;
	key_offsets: string[];
}

export interface TransactionOutput {
	amount: string;
	target: {
		type: string;
		key: string;
	};
}

export enum NetType {
	MAINNET = 0,
	TESTNET = 1,
	STAGENET = 2,
}

export interface SignedTransaction {
	unlock_time: number;
	version: number;
	extra: string;
	vin: TransactionInput[];
	vout: TransactionOutput[];
	rct_signatures?: RCTSignatures;
	signatures?: string[][];
}

export type ParsedTarget = {
	address: string;
	amount: BigInt;
};

export type ViewSendKeys = {
	view: string;
	spend: string;
};

export type RawTarget = {
	address: string;
	amount: number;
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

export interface RingMember {
	dest: string;
	mask: string;
}

export interface SecretCommitment {
	x: string;
	a: string;
}

export interface Key {
	pub: string;
	sec: string;
}

export interface Keys {
	view: Key;
	spend: Key;
}
