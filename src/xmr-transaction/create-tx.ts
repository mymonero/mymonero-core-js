import {
	ParsedTarget,
	ViewSendKeys,
	Output,
	AmountOutput,
	Pid,
	NetType,
	SignedTransaction,
	SecretCommitment,
	RingMember,
	TransactionOutput,
	Keys,
} from "xmr-types";
import { BigInt } from "biginteger";
import { valid_keys, random_keypair } from "xmr-key-utils";
import { zeroCommit } from "xmr-crypto-ops/rctOps";
import { d2s } from "xmr-str-utils/integer-strings";
import { formatMoney, formatMoneyFull } from "xmr-money/formatters";
import {
	INTEGRATED_ID_SIZE,
	ENCRYPTED_PAYMENT_ID_TAIL,
} from "xmr-constants/address";
import { cn_fast_hash } from "xmr-fast-hash";
import {
	generate_key_derivation,
	derive_public_key,
	derivation_to_scalar,
} from "xmr-crypto-ops/derivation";
import { hex_xor } from "xmr-str-utils/hex-strings";
import { I } from "xmr-crypto-ops/constants";
import { generate_key_image_helper_rct } from "xmr-crypto-ops/key_image";
import { decode_address, is_subaddress } from "xmr-address-utils";
import { ge_scalarmult } from "xmr-crypto-ops/primitive_ops";

import {
	get_payment_id_nonce,
	add_nonce_to_extra,
	abs_to_rel_offsets,
	add_pub_key_to_extra,
	get_tx_prefix_hash,
} from "./libs/utils";
import { generate_ring_signature } from "./libs/non-ringct";
import { genRct } from "./libs/ringct";

const UINT64_MAX = new BigInt(2).pow(64);

interface SourceOutput {
	index: string;
	key: string;
	commit?: string;
}

interface Source {
	amount: string;
	outputs: SourceOutput[];
	real_out_tx_key: string;
	real_out: number;
	real_out_in_tx: number;
	mask?: string | null;
}

export function create_transaction(
	pub_keys: ViewSendKeys,
	sec_keys: ViewSendKeys,
	dsts: ParsedTarget[],
	outputs: Output[],
	mix_outs: AmountOutput[] | undefined,
	fake_outputs_count: number,
	fee_amount: BigInt,
	payment_id: Pid,
	pid_encrypt: boolean,
	realDestViewKey: string | undefined,
	unlock_time: number,
	rct: boolean,
	nettype: NetType,
) {
	unlock_time = unlock_time || 0;
	mix_outs = mix_outs || [];
	let i, j;
	if (dsts.length === 0) {
		throw Error("Destinations empty");
	}
	if (mix_outs.length !== outputs.length && fake_outputs_count !== 0) {
		throw Error(
			"Wrong number of mix outs provided (" +
				outputs.length +
				" outputs, " +
				mix_outs.length +
				" mix outs)",
		);
	}
	for (i = 0; i < mix_outs.length; i++) {
		if ((mix_outs[i].outputs || []).length < fake_outputs_count) {
			throw Error("Not enough outputs to mix with");
		}
	}
	const keys: Keys = {
		view: {
			pub: pub_keys.view,
			sec: sec_keys.view,
		},
		spend: {
			pub: pub_keys.spend,
			sec: sec_keys.spend,
		},
	};
	if (
		!valid_keys(
			keys.view.pub,
			keys.view.sec,
			keys.spend.pub,
			keys.spend.sec,
		)
	) {
		throw Error("Invalid secret keys!");
	}
	let needed_money = BigInt.ZERO;
	for (i = 0; i < dsts.length; ++i) {
		needed_money = needed_money.add(dsts[i].amount);
		if (needed_money.compare(UINT64_MAX) !== -1) {
			throw Error("Output overflow!");
		}
	}
	let found_money = BigInt.ZERO;
	const sources = [];
	console.log("Selected transfers: ", outputs);
	for (i = 0; i < outputs.length; ++i) {
		found_money = found_money.add(outputs[i].amount);
		if (found_money.compare(UINT64_MAX) !== -1) {
			throw Error("Input overflow!");
		}

		const src: Source = {
			amount: outputs[i].amount,
			outputs: [],
			real_out: 0,
			real_out_in_tx: 0,
			real_out_tx_key: "",
		};

		if (mix_outs.length !== 0) {
			// Sort fake outputs by global index
			mix_outs[i].outputs.sort(function(a, b) {
				return new BigInt(a.global_index).compare(b.global_index);
			});
			j = 0;
			while (
				src.outputs.length < fake_outputs_count &&
				j < mix_outs[i].outputs.length
			) {
				const out = mix_outs[i].outputs[j];
				if (+out.global_index === outputs[i].global_index) {
					console.log("got mixin the same as output, skipping");
					j++;
					continue;
				}

				const oe: SourceOutput = {
					index: out.global_index.toString(),
					key: out.public_key,
				};

				if (rct) {
					if (out.rct) {
						oe.commit = out.rct.slice(0, 64); //add commitment from rct mix outs
					} else {
						if (outputs[i].rct) {
							throw Error("mix rct outs missing commit");
						}
						oe.commit = zeroCommit(d2s(src.amount)); //create identity-masked commitment for non-rct mix input
					}
				}
				src.outputs.push(oe);
				j++;
			}
		}
		const real_oe: SourceOutput = {
			index: outputs[i].global_index.toString(),
			key: outputs[i].public_key,
		};

		if (rct) {
			if (outputs[i].rct) {
				real_oe.commit = outputs[i].rct.slice(0, 64); //add commitment for real input
			} else {
				real_oe.commit = zeroCommit(d2s(src.amount)); //create identity-masked commitment for non-rct input
			}
		}

		let real_index = src.outputs.length;
		for (j = 0; j < src.outputs.length; j++) {
			if (new BigInt(real_oe.index).compare(src.outputs[j].index) < 0) {
				real_index = j;
				break;
			}
		}
		// Add real_oe to outputs
		src.outputs.splice(real_index, 0, real_oe);
		src.real_out_tx_key = outputs[i].tx_pub_key;
		// Real output entry index
		src.real_out = real_index;
		src.real_out_in_tx = outputs[i].index;
		if (rct) {
			// if rct, slice encrypted, otherwise will be set by generate_key_image_helper_rct
			src.mask = outputs[i].rct ? outputs[i].rct.slice(64, 128) : null;
		}
		sources.push(src);
	}
	console.log("sources: ", sources);
	const change = {
		amount: BigInt.ZERO,
	};
	const cmp = needed_money.compare(found_money);
	if (cmp < 0) {
		change.amount = found_money.subtract(needed_money);
		if (change.amount.compare(fee_amount) !== 0) {
			throw Error("early fee calculation != later");
		}
	} else if (cmp > 0) {
		throw Error("Need more money than found! (have: ") +
			formatMoney(found_money) +
			" need: " +
			formatMoney(needed_money) +
			")";
	}
	return construct_tx(
		keys,
		sources,
		dsts,
		fee_amount,
		payment_id,
		pid_encrypt,
		realDestViewKey,
		unlock_time,
		rct,
		nettype,
	);
}

function construct_tx(
	keys: Keys,
	sources: Source[],
	dsts: ParsedTarget[],
	fee_amount: BigInt,
	payment_id: string | null,
	pid_encrypt: boolean,
	realDestViewKey: string | undefined,
	unlock_time: number,
	rct: boolean,
	nettype: NetType,
) {
	//we move payment ID stuff here, because we need txkey to encrypt
	const txkey = random_keypair();
	console.log(txkey);
	let extra = "";
	if (payment_id) {
		if (pid_encrypt && payment_id.length !== INTEGRATED_ID_SIZE * 2) {
			throw Error(
				"payment ID must be " +
					INTEGRATED_ID_SIZE +
					" bytes to be encrypted!",
			);
		}
		console.log("Adding payment id: " + payment_id);
		if (pid_encrypt) {
			if (!realDestViewKey) {
				throw Error("RealDestViewKey not found");
			}
			//get the derivation from our passed viewkey, then hash that + tail to get encryption key
			const pid_key = cn_fast_hash(
				generate_key_derivation(realDestViewKey, txkey.sec) +
					ENCRYPTED_PAYMENT_ID_TAIL.toString(16),
			).slice(0, INTEGRATED_ID_SIZE * 2);
			console.log("Txkeys:", txkey, "Payment ID key:", pid_key);
			payment_id = hex_xor(payment_id, pid_key);
		}
		const nonce = get_payment_id_nonce(payment_id, pid_encrypt);
		console.log("Extra nonce: " + nonce);
		extra = add_nonce_to_extra(extra, nonce);
	}

	const CURRENT_TX_VERSION = 2;
	const OLD_TX_VERSION = 1;

	const tx: SignedTransaction = {
		unlock_time,
		version: rct ? CURRENT_TX_VERSION : OLD_TX_VERSION,
		extra,
		vin: [],
		vout: [],
		rct_signatures: undefined,
		signatures: undefined,
	};

	const inputs_money = sources.reduce<BigInt>(
		(totalAmount, { amount }) => totalAmount.add(amount),
		BigInt.ZERO,
	);

	let i;
	console.log("Sources: ");

	//run the for loop twice to sort ins by key image
	//first generate key image and other construction data to sort it all in one go
	const sourcesWithKeyImgAndKeys = sources.map((source, idx) => {
		console.log(idx + ": " + formatMoneyFull(source.amount));
		if (source.real_out >= source.outputs.length) {
			throw Error("real index >= outputs.length");
		}
		const { key_image, in_ephemeral } = generate_key_image_helper_rct(
			keys,
			source.real_out_tx_key,
			source.real_out_in_tx,
			source.mask,
		); //mask will be undefined for non-rct

		if (in_ephemeral.pub !== source.outputs[source.real_out].key) {
			throw Error("in_ephemeral.pub != source.real_out.key");
		}

		return {
			...source,
			key_image,
			in_ephemeral,
		};
	});

	//sort ins
	sourcesWithKeyImgAndKeys.sort((a, b) => {
		return (
			BigInt.parse(a.key_image, 16).compare(
				BigInt.parse(b.key_image, 16),
			) * -1
		);
	});

	const in_contexts = sourcesWithKeyImgAndKeys.map(
		source => source.in_ephemeral,
	);

	//copy the sorted sourcesWithKeyImgAndKeys data to tx
	const vin = sourcesWithKeyImgAndKeys.map(source => {
		const input_to_key = {
			type: "input_to_key",
			amount: source.amount,
			k_image: source.key_image,
			key_offsets: source.outputs.map(s => s.index),
		};

		input_to_key.key_offsets = abs_to_rel_offsets(input_to_key.key_offsets);
		return input_to_key;
	});

	tx.vin = vin;

	const dstsWithKeys = dsts.map(d => {
		if (d.amount.compare(0) < 0) {
			throw Error("dst.amount < 0"); //amount can be zero if no change
		}
		const keys = decode_address(d.address, nettype);
		return { ...d, keys };
	});

	const outputs_money = dstsWithKeys.reduce<BigInt>(
		(outputs_money, { amount }) => outputs_money.add(amount),
		BigInt.ZERO,
	);

	interface Ret {
		amountKeys: string[];
		vout: TransactionOutput[];
	}

	const ret: Ret = { amountKeys: [], vout: [] };
	//amountKeys is rct only
	const { amountKeys, vout } = dstsWithKeys.reduce<Ret>(
		({ amountKeys, vout }, dstWKey, out_index) => {
			// R = rD for subaddresses
			if (is_subaddress(dstWKey.address, nettype)) {
				if (payment_id) {
					// this could stand to be placed earlier in the function but we save repeating a little algo time this way
					throw Error(
						"Payment ID must not be supplied when sending to a subaddress",
					);
				}
				txkey.pub = ge_scalarmult(dstWKey.keys.spend, txkey.sec);
			}
			// send change to ourselves
			const out_derivation =
				dstWKey.keys.view === keys.view.pub
					? generate_key_derivation(txkey.pub, keys.view.sec)
					: generate_key_derivation(dstWKey.keys.view, txkey.sec);

			const out_ephemeral_pub = derive_public_key(
				out_derivation,
				out_index,
				dstWKey.keys.spend,
			);

			const out = {
				amount: dstWKey.amount.toString(),
				// txout_to_key
				target: {
					type: "txout_to_key",
					key: out_ephemeral_pub,
				},
			};

			const nextAmountKeys = rct
				? [
						...amountKeys,
						derivation_to_scalar(out_derivation, out_index),
				  ]
				: amountKeys;
			const nextVout = [...vout, out];
			const nextVal: Ret = { amountKeys: nextAmountKeys, vout: nextVout };
			return nextVal;
		},
		ret,
	);

	tx.vout = vout;

	// add pub key to extra after we know whether to use R = rG or R = rD
	tx.extra = add_pub_key_to_extra(tx.extra, txkey.pub);

	if (outputs_money.add(fee_amount).compare(inputs_money) > 0) {
		throw Error(
			`outputs money:${formatMoneyFull(
				outputs_money,
			)} + fee:${formatMoneyFull(
				fee_amount,
			)} > inputs money:${formatMoneyFull(inputs_money)}`,
		);
	}

	if (!rct) {
		const signatures = sourcesWithKeyImgAndKeys.map((src, i) => {
			const src_keys = src.outputs.map(s => s.key);
			const sigs = generate_ring_signature(
				get_tx_prefix_hash(tx),
				tx.vin[i].k_image,
				src_keys,
				in_contexts[i].sec,
				sourcesWithKeyImgAndKeys[i].real_out,
			);
			return sigs;
		});
		tx.signatures = signatures;
	} else {
		//rct
		const keyimages: string[] = [];
		const inSk: SecretCommitment[] = [];
		const inAmounts: string[] = [];
		const mixRing: RingMember[][] = [];
		const indices: number[] = [];

		tx.vin.forEach((input, i) => {
			keyimages.push(input.k_image);
			inSk.push({
				x: in_contexts[i].sec,
				a: in_contexts[i].mask,
			});
			inAmounts.push(input.amount);

			if (in_contexts[i].mask !== I) {
				//if input is rct (has a valid mask), 0 out amount
				input.amount = "0";
			}

			mixRing[i] = sourcesWithKeyImgAndKeys[i].outputs.map(o => {
				if (!o.commit) {
					throw Error("Commit not found");
				}
				return {
					dest: o.key,
					mask: o.commit,
				};
			});

			indices.push(sourcesWithKeyImgAndKeys[i].real_out);
		});

		const outAmounts = [];
		for (i = 0; i < tx.vout.length; i++) {
			outAmounts.push(tx.vout[i].amount);
			tx.vout[i].amount = "0"; //zero out all rct outputs
		}
		const tx_prefix_hash = get_tx_prefix_hash(tx);
		tx.rct_signatures = genRct(
			tx_prefix_hash,
			inSk,
			keyimages,
			/*destinations, */ inAmounts,
			outAmounts,
			mixRing,
			amountKeys,
			indices,
			fee_amount.toString(),
		);
	}
	console.log(tx);
	return tx;
}
