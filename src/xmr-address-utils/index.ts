import { encode_varint } from "xmr-varint";
import { cn_fast_hash } from "xmr-fast-hash";
import { sc_reduce32 } from "xmr-crypto-ops/primitive_ops";
import {
	cryptonoteBase58PrefixForSubAddressOn,
	cryptonoteBase58PrefixForIntegratedAddressOn,
	cryptonoteBase58PrefixForStandardAddressOn,
} from "xmr-nettype-address-prefixes";
import { cnBase58 } from "xmr-b58/xmr-base58";
import { generate_keys, pubkeys_to_string } from "xmr-key-utils";
import {
	INTEGRATED_ID_SIZE,
	ADDRESS_CHECKSUM_SIZE,
} from "xmr-constants/address";
import { Account } from "./types";
import { NetType } from "xmr-types";

export function is_subaddress(addr: string, nettype: NetType) {
	const decoded = cnBase58.decode(addr);
	const subaddressPrefix = encode_varint(
		cryptonoteBase58PrefixForSubAddressOn(nettype),
	);
	const prefix = decoded.slice(0, subaddressPrefix.length);
	return prefix === subaddressPrefix;
}

export function create_address(seed: string, nettype: NetType): Account {
	// updated by Luigi and PS to support reduced and non-reduced seeds
	let first;
	if (seed.length !== 64) {
		first = cn_fast_hash(seed);
	} else {
		first = sc_reduce32(seed);
	}
	const spend = generate_keys(first);
	const second = cn_fast_hash(first);
	const view = generate_keys(second);
	const public_addr = pubkeys_to_string(spend.pub, view.pub, nettype);
	return { spend, view, public_addr };
}

export function decode_address(address: string, nettype: NetType) {
	let dec = cnBase58.decode(address);
	const expectedPrefix = encode_varint(
		cryptonoteBase58PrefixForStandardAddressOn(nettype),
	);
	const expectedPrefixInt = encode_varint(
		cryptonoteBase58PrefixForIntegratedAddressOn(nettype),
	);
	const expectedPrefixSub = encode_varint(
		cryptonoteBase58PrefixForSubAddressOn(nettype),
	);
	const prefix = dec.slice(0, expectedPrefix.length);
	if (
		prefix !== expectedPrefix &&
		prefix !== expectedPrefixInt &&
		prefix !== expectedPrefixSub
	) {
		throw Error("Invalid address prefix");
	}
	dec = dec.slice(expectedPrefix.length);
	const spend = dec.slice(0, 64);
	const view = dec.slice(64, 128);
	let checksum;
	let expectedChecksum;
	let intPaymentId;

	if (prefix === expectedPrefixInt) {
		intPaymentId = dec.slice(128, 128 + INTEGRATED_ID_SIZE * 2);
		checksum = dec.slice(
			128 + INTEGRATED_ID_SIZE * 2,
			128 + INTEGRATED_ID_SIZE * 2 + ADDRESS_CHECKSUM_SIZE * 2,
		);
		expectedChecksum = cn_fast_hash(
			prefix + spend + view + intPaymentId,
		).slice(0, ADDRESS_CHECKSUM_SIZE * 2);
	} else {
		checksum = dec.slice(128, 128 + ADDRESS_CHECKSUM_SIZE * 2);
		expectedChecksum = cn_fast_hash(prefix + spend + view).slice(
			0,
			ADDRESS_CHECKSUM_SIZE * 2,
		);
	}
	if (checksum !== expectedChecksum) {
		throw Error("Invalid checksum");
	}
	if (intPaymentId) {
		return {
			spend: spend,
			view: view,
			intPaymentId: intPaymentId,
		};
	} else {
		return {
			spend: spend,
			view: view,
		};
	}
}

export function makeIntegratedAddressFromAddressAndShortPid(
	address: string,
	short_pid: string,
	nettype: NetType,
) {
	// throws
	let decoded_address = decode_address(
		address, // TODO/FIXME: not super happy about having to decode just to re-encode… this was a quick hack
		nettype,
	); // throws
	if (!short_pid || short_pid.length != 16) {
		throw Error("expected valid short_pid");
	}
	const prefix = encode_varint(
		cryptonoteBase58PrefixForIntegratedAddressOn(nettype),
	);
	const data =
		prefix + decoded_address.spend + decoded_address.view + short_pid;
	const checksum = cn_fast_hash(data);
	const encodable__data = data + checksum.slice(0, ADDRESS_CHECKSUM_SIZE * 2);
	//
	return cnBase58.encode(encodable__data);
}
