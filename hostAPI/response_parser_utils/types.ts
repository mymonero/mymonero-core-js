import { JSBigInt, Omit } from "types";

export interface SpentOutput {
	amount: string;
	key_image: string;
	tx_pub_key: string;
	out_index: number;
	mixin?: number;
}

export interface AddressTransactionsTx {
	id: number;
	hash?: string;
	timestamp: string;
	total_received?: string;
	total_sent?: string;
	unlock_time?: number;
	height?: number;
	coinbase?: boolean;
	mempool?: boolean;
	mixin?: number;
	spent_outputs?: SpentOutput[];
	payment_id?: string;
}

export interface AddressTransactions {
	total_received?: string;
	scanned_height?: number;
	scanned_block_height?: number;
	start_height?: number;
	transaction_height?: number;
	blockchain_height?: number;
	transactions?: AddressTransactionsTx[];
}

export interface NormalizedTransaction
	extends Required<Omit<AddressTransactionsTx, "total_sent" | "timestamp">> {
	total_sent: JSBigInt;
	amount: JSBigInt;
	approx_float_amount: number;
	timestamp: Date;
}

export interface Rates {
	[currencySymbol: string]: number;
}

export interface AddressInfo {
	locked_funds?: string;
	total_received?: string;
	total_sent?: string;
	scanned_height?: number;
	scanned_block_height?: number;
	start_height?: number;
	transaction_height?: number;
	blockchain_height?: number;
	spent_outputs?: SpentOutput[];
	rates?: Rates;
}

export interface UnspentOutput {
	amount: string;
	public_key: string;
	index: number;
	global_index: number;
	rct: string;
	tx_id: number;
	tx_hash: string;
	tx_pub_key: string;
	tx_prefix_hash: string;
	spend_key_images: string[];
	timestamp: string;
	height: number;
}

export interface UnspentOuts {
	per_kb_fee: number;
	amount: string;
	outputs?: UnspentOutput[];
}
