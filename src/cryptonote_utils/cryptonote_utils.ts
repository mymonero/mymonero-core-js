// Copyright (c) 2014-2018, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// Original Author: Lucas Jones
// Modified to remove jQuery dep and support modular inclusion of deps by Paul Shapiro (2016)
// Modified to add RingCT support by luigi1111 (2017)
//
// v--- These should maybe be injected into a context and supplied to currencyConfig for future platforms

import cnBase58 = require("./internal_libs/bs58");
import CNCrypto = require("./internal_libs/cn_crypto");
import nacl = require("./internal_libs/fast_cn");
import SHA3 = require("keccakjs");
import nettype_utils = require("./nettype");
import { randomBytes } from "crypto";
import { BigInt } from "biginteger";
import { NetType } from "./nettype";
import { formatMoney, formatMoneyFull } from "./formatters";
import { SecretCommitment, MixCommitment } from "types";
import {
	ViewSendKeys,
	ParsedTarget,
	Output,
	AmountOutput,
	Pid,
} from "monero_utils/sending_funds/internal_libs/types";

const HASH_SIZE = 32;
const ADDRESS_CHECKSUM_SIZE = 4;
const INTEGRATED_ID_SIZE = 8;
const ENCRYPTED_PAYMENT_ID_TAIL = 141;

const UINT64_MAX = new BigInt(2).pow(64);
const CURRENT_TX_VERSION = 2;
const OLD_TX_VERSION = 1;
const RCTTypeFull = 1;
const RCTTypeSimple = 2;
const TX_EXTRA_NONCE_MAX_COUNT = 255;
const TX_EXTRA_TAGS = {
	PADDING: "00",
	PUBKEY: "01",
	NONCE: "02",
	MERGE_MINING: "03",
};
const TX_EXTRA_NONCE_TAGS = {
	PAYMENT_ID: "00",
	ENCRYPTED_PAYMENT_ID: "01",
};
const KEY_SIZE = 32;
const STRUCT_SIZES = {
	GE_P3: 160,
	GE_P2: 120,
	GE_P1P1: 160,
	GE_CACHED: 160,
	EC_SCALAR: 32,
	EC_POINT: 32,
	KEY_IMAGE: 32,
	GE_DSMP: 160 * 8, // ge_cached * 8
	SIGNATURE: 64, // ec_scalar * 2
};

//RCT vars
export const H =
	"8b655970153799af2aeadc9ff1add0ea6c7251d54154cfa92c173a0dd39c1f94"; //base H for amounts

export const l = new BigInt(
	"7237005577332262213973186563042994240857116359379907606001950938285454250989",
); //curve order (not RCT specific)

export const I =
	"0100000000000000000000000000000000000000000000000000000000000000"; //identity element

export function identity() {
	return I;
}

export const Z =
	"0000000000000000000000000000000000000000000000000000000000000000"; //zero scalar

//H2 object to speed up some operations
export const H2 = [
	"8b655970153799af2aeadc9ff1add0ea6c7251d54154cfa92c173a0dd39c1f94",
	"8faa448ae4b3e2bb3d4d130909f55fcd79711c1c83cdbccadd42cbe1515e8712",
	"12a7d62c7791654a57f3e67694ed50b49a7d9e3fc1e4c7a0bde29d187e9cc71d",
	"789ab9934b49c4f9e6785c6d57a498b3ead443f04f13df110c5427b4f214c739",
	"771e9299d94f02ac72e38e44de568ac1dcb2edc6edb61f83ca418e1077ce3de8",
	"73b96db43039819bdaf5680e5c32d741488884d18d93866d4074a849182a8a64",
	"8d458e1c2f68ebebccd2fd5d379f5e58f8134df3e0e88cad3d46701063a8d412",
	"09551edbe494418e81284455d64b35ee8ac093068a5f161fa6637559177ef404",
	"d05a8866f4df8cee1e268b1d23a4c58c92e760309786cdac0feda1d247a9c9a7",
	"55cdaad518bd871dd1eb7bc7023e1dc0fdf3339864f88fdd2de269fe9ee1832d",
	"e7697e951a98cfd5712b84bbe5f34ed733e9473fcb68eda66e3788df1958c306",
	"f92a970bae72782989bfc83adfaa92a4f49c7e95918b3bba3cdc7fe88acc8d47",
	"1f66c2d491d75af915c8db6a6d1cb0cd4f7ddcd5e63d3ba9b83c866c39ef3a2b",
	"3eec9884b43f58e93ef8deea260004efea2a46344fc5965b1a7dd5d18997efa7",
	"b29f8f0ccb96977fe777d489d6be9e7ebc19c409b5103568f277611d7ea84894",
	"56b1f51265b9559876d58d249d0c146d69a103636699874d3f90473550fe3f2c",
	"1d7a36575e22f5d139ff9cc510fa138505576b63815a94e4b012bfd457caaada",
	"d0ac507a864ecd0593fa67be7d23134392d00e4007e2534878d9b242e10d7620",
	"f6c6840b9cf145bb2dccf86e940be0fc098e32e31099d56f7fe087bd5deb5094",
	"28831a3340070eb1db87c12e05980d5f33e9ef90f83a4817c9f4a0a33227e197",
	"87632273d629ccb7e1ed1a768fa2ebd51760f32e1c0b867a5d368d5271055c6e",
	"5c7b29424347964d04275517c5ae14b6b5ea2798b573fc94e6e44a5321600cfb",
	"e6945042d78bc2c3bd6ec58c511a9fe859c0ad63fde494f5039e0e8232612bd5",
	"36d56907e2ec745db6e54f0b2e1b2300abcb422e712da588a40d3f1ebbbe02f6",
	"34db6ee4d0608e5f783650495a3b2f5273c5134e5284e4fdf96627bb16e31e6b",
	"8e7659fb45a3787d674ae86731faa2538ec0fdf442ab26e9c791fada089467e9",
	"3006cf198b24f31bb4c7e6346000abc701e827cfbb5df52dcfa42e9ca9ff0802",
	"f5fd403cb6e8be21472e377ffd805a8c6083ea4803b8485389cc3ebc215f002a",
	"3731b260eb3f9482e45f1c3f3b9dcf834b75e6eef8c40f461ea27e8b6ed9473d",
	"9f9dab09c3f5e42855c2de971b659328a2dbc454845f396ffc053f0bb192f8c3",
	"5e055d25f85fdb98f273e4afe08464c003b70f1ef0677bb5e25706400be620a5",
	"868bcf3679cb6b500b94418c0b8925f9865530303ae4e4b262591865666a4590",
	"b3db6bd3897afbd1df3f9644ab21c8050e1f0038a52f7ca95ac0c3de7558cb7a",
	"8119b3a059ff2cac483e69bcd41d6d27149447914288bbeaee3413e6dcc6d1eb",
	"10fc58f35fc7fe7ae875524bb5850003005b7f978c0c65e2a965464b6d00819c",
	"5acd94eb3c578379c1ea58a343ec4fcff962776fe35521e475a0e06d887b2db9",
	"33daf3a214d6e0d42d2300a7b44b39290db8989b427974cd865db011055a2901",
	"cfc6572f29afd164a494e64e6f1aeb820c3e7da355144e5124a391d06e9f95ea",
	"d5312a4b0ef615a331f6352c2ed21dac9e7c36398b939aec901c257f6cbc9e8e",
	"551d67fefc7b5b9f9fdbf6af57c96c8a74d7e45a002078a7b5ba45c6fde93e33",
	"d50ac7bd5ca593c656928f38428017fc7ba502854c43d8414950e96ecb405dc3",
	"0773e18ea1be44fe1a97e239573cfae3e4e95ef9aa9faabeac1274d3ad261604",
	"e9af0e7ca89330d2b8615d1b4137ca617e21297f2f0ded8e31b7d2ead8714660",
	"7b124583097f1029a0c74191fe7378c9105acc706695ed1493bb76034226a57b",
	"ec40057b995476650b3db98e9db75738a8cd2f94d863b906150c56aac19caa6b",
	"01d9ff729efd39d83784c0fe59c4ae81a67034cb53c943fb818b9d8ae7fc33e5",
	"00dfb3c696328c76424519a7befe8e0f6c76f947b52767916d24823f735baf2e",
	"461b799b4d9ceea8d580dcb76d11150d535e1639d16003c3fb7e9d1fd13083a8",
	"ee03039479e5228fdc551cbde7079d3412ea186a517ccc63e46e9fcce4fe3a6c",
	"a8cfb543524e7f02b9f045acd543c21c373b4c9b98ac20cec417a6ddb5744e94",
	"932b794bf89c6edaf5d0650c7c4bad9242b25626e37ead5aa75ec8c64e09dd4f",
	"16b10c779ce5cfef59c7710d2e68441ea6facb68e9b5f7d533ae0bb78e28bf57",
	"0f77c76743e7396f9910139f4937d837ae54e21038ac5c0b3fd6ef171a28a7e4",
	"d7e574b7b952f293e80dde905eb509373f3f6cd109a02208b3c1e924080a20ca",
	"45666f8c381e3da675563ff8ba23f83bfac30c34abdde6e5c0975ef9fd700cb9",
	"b24612e454607eb1aba447f816d1a4551ef95fa7247fb7c1f503020a7177f0dd",
	"7e208861856da42c8bb46a7567f8121362d9fb2496f131a4aa9017cf366cdfce",
	"5b646bff6ad1100165037a055601ea02358c0f41050f9dfe3c95dccbd3087be0",
	"746d1dccfed2f0ff1e13c51e2d50d5324375fbd5bf7ca82a8931828d801d43ab",
	"cb98110d4a6bb97d22feadbc6c0d8930c5f8fc508b2fc5b35328d26b88db19ae",
	"60b626a033b55f27d7676c4095eababc7a2c7ede2624b472e97f64f96b8cfc0e",
	"e5b52bc927468df71893eb8197ef820cf76cb0aaf6e8e4fe93ad62d803983104",
	"056541ae5da9961be2b0a5e895e5c5ba153cbb62dd561a427bad0ffd41923199",
	"f8fef05a3fa5c9f3eba41638b247b711a99f960fe73aa2f90136aeb20329b888",
];

//begin rct new functions
//creates a Pedersen commitment from an amount (in scalar form) and a mask
//C = bG + aH where b = mask, a = amount
function commit(amount: string, mask: string) {
	if (
		!valid_hex(mask) ||
		mask.length !== 64 ||
		!valid_hex(amount) ||
		amount.length !== 64
	) {
		throw Error("invalid amount or mask!");
	}
	const C = ge_double_scalarmult_base_vartime(amount, H, mask);
	return C;
}

function zeroCommit(amount: string) {
	if (!valid_hex(amount) || amount.length !== 64) {
		throw Error("invalid amount!");
	}
	const C = ge_double_scalarmult_base_vartime(amount, H, I);
	return C;
}

interface Commit {
	mask: string;
	amount: string;
}

export function decode_rct_ecdh(ecdh: Commit, key: string): Commit {
	const first = hash_to_scalar(key);
	const second = hash_to_scalar(first);
	return {
		mask: sc_sub(ecdh.mask, first),
		amount: sc_sub(ecdh.amount, second),
	};
}

export function encode_rct_ecdh(ecdh: Commit, key: string): Commit {
	const first = hash_to_scalar(key);
	const second = hash_to_scalar(first);
	return {
		mask: sc_add(ecdh.mask, first),
		amount: sc_add(ecdh.amount, second),
	};
}

//switch byte order for hex string
function swapEndian(hex: string) {
	if (hex.length % 2 !== 0) {
		return "length must be a multiple of 2!";
	}
	let data = "";
	for (let i = 1; i <= hex.length / 2; i++) {
		data += hex.substr(0 - 2 * i, 2);
	}
	return data;
}

//switch byte order charwise
function swapEndianC(str: string) {
	let data = "";
	for (let i = 1; i <= str.length; i++) {
		data += str.substr(0 - i, 1);
	}
	return data;
}

//for most uses you'll also want to swapEndian after conversion
//mainly to convert integer "scalars" to usable hexadecimal strings
//uint long long to 32 byte key
function d2h(integer: string | BigInt) {
	let padding = "";
	for (let i = 0; i < 63; i++) {
		padding += "0";
	}
	return (padding + new BigInt(integer).toString(16).toLowerCase()).slice(
		-64,
	);
}

//integer (string) to scalar
export function d2s(integer: string | BigInt) {
	return swapEndian(d2h(integer));
}

//convert integer string to 64bit "binary" little-endian string
function d2b(integer: string | BigInt) {
	let padding = "";
	for (let i = 0; i < 63; i++) {
		padding += "0";
	}
	const a = new BigInt(integer);
	if (a.toString(2).length > 64) {
		throw Error("amount overflows uint64!");
	}
	return swapEndianC((padding + a.toString(2)).slice(-64));
}

//end rct new functions

export function valid_hex(hex: string) {
	const exp = new RegExp("[0-9a-fA-F]{" + hex.length + "}");
	return exp.test(hex);
}

//simple exclusive or function for two hex inputs
function hex_xor(hex1: string, hex2: string) {
	if (
		!hex1 ||
		!hex2 ||
		hex1.length !== hex2.length ||
		hex1.length % 2 !== 0 ||
		hex2.length % 2 !== 0
	) {
		throw Error("Hex string(s) is/are invalid!");
	}
	const bin1 = hextobin(hex1);
	const bin2 = hextobin(hex2);
	const xor = new Uint8Array(bin1.length);
	for (let i = 0; i < xor.length; i++) {
		xor[i] = bin1[i] ^ bin2[i];
	}
	return bintohex(xor);
}

function hextobin(hex: string) {
	if (hex.length % 2 !== 0) throw Error("Hex string has invalid length!");
	const res = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length / 2; ++i) {
		res[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return res;
}

function bintohex(bin: Uint8Array) {
	const out = [];
	for (let i = 0; i < bin.length; ++i) {
		out.push(("0" + bin[i].toString(16)).slice(-2));
	}
	return out.join("");
}

// Generate a 256-bit / 64-char / 32-byte crypto random
function rand_32() {
	return randomBytes(32).toString("hex");
}

// Generate a 64-bit / 16-char / 8-byte crypto random
export function rand_8() {
	return randomBytes(8).toString("hex");
}

function encode_varint(input: number | string) {
	let i = new BigInt(input);
	let out = "";
	// While i >= b10000000
	while (i.compare(0x80) >= 0) {
		// out.append i & b01111111 | b10000000
		out += ("0" + ((i.lowVal() & 0x7f) | 0x80).toString(16)).slice(-2);
		i = i.divide(new BigInt(2).pow(7));
	}
	out += ("0" + i.toJSValue().toString(16)).slice(-2);
	return out;
}

function sc_reduce32(hex: string) {
	const input = hextobin(hex);
	if (input.length !== 32) {
		throw Error("Invalid input length");
	}
	const mem = CNCrypto._malloc(32);
	CNCrypto.HEAPU8.set(input, mem);
	CNCrypto.ccall("sc_reduce32", "void", ["number"], [mem]);
	const output = CNCrypto.HEAPU8.subarray(mem, mem + 32);
	CNCrypto._free(mem);
	return bintohex(output);
}

export function cn_fast_hash(input: string) {
	if (input.length % 2 !== 0 || !valid_hex(input)) {
		throw Error("Input invalid");
	}

	const hasher = new SHA3(256);
	hasher.update(hextobin(input));
	return hasher.digest("hex");
}

function sec_key_to_pub(sec: string) {
	if (sec.length !== 64) {
		throw Error("Invalid sec length");
	}
	return bintohex(nacl.ge_scalarmult_base(hextobin(sec)));
}

//alias
export function ge_scalarmult_base(sec: string) {
	return sec_key_to_pub(sec);
}

export function ge_scalarmult(pub: string, sec: string) {
	if (pub.length !== 64 || sec.length !== 64) {
		throw Error("Invalid input length");
	}
	return bintohex(nacl.ge_scalarmult(hextobin(pub), hextobin(sec)));
}

function pubkeys_to_string(spend: string, view: string, nettype: NetType) {
	const prefix = encode_varint(
		nettype_utils.cryptonoteBase58PrefixForStandardAddressOn(nettype),
	);
	const data = prefix + spend + view;
	const checksum = cn_fast_hash(data);
	return cnBase58.encode(data + checksum.slice(0, ADDRESS_CHECKSUM_SIZE * 2));
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
		nettype_utils.cryptonoteBase58PrefixForIntegratedAddressOn(nettype),
	);
	const data =
		prefix + decoded_address.spend + decoded_address.view + short_pid;
	const checksum = cn_fast_hash(data);
	const encodable__data = data + checksum.slice(0, ADDRESS_CHECKSUM_SIZE * 2);
	//
	return cnBase58.encode(encodable__data);
}

// Generate keypair from seed
function generate_keys(seed: string): Key {
	if (seed.length !== 64) throw Error("Invalid input length!");
	const sec = sc_reduce32(seed);
	const pub = sec_key_to_pub(sec);
	return {
		sec: sec,
		pub: pub,
	};
}

export function random_keypair() {
	return generate_keys(rand_32());
}

// Random 32-byte ec scalar
export function random_scalar() {
	return sc_reduce32(rand_32());
}

// alias
export const skGen = random_scalar;

interface Key {
	pub: string;
	sec: string;
}
interface Account {
	spend: Key;
	view: Key;
	public_addr: string;
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
		nettype_utils.cryptonoteBase58PrefixForStandardAddressOn(nettype),
	);
	const expectedPrefixInt = encode_varint(
		nettype_utils.cryptonoteBase58PrefixForIntegratedAddressOn(nettype),
	);
	const expectedPrefixSub = encode_varint(
		nettype_utils.cryptonoteBase58PrefixForSubAddressOn(nettype),
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

export function is_subaddress(addr: string, nettype: NetType) {
	const decoded = cnBase58.decode(addr);
	const subaddressPrefix = encode_varint(
		nettype_utils.cryptonoteBase58PrefixForSubAddressOn(nettype),
	);
	const prefix = decoded.slice(0, subaddressPrefix.length);
	return prefix === subaddressPrefix;
}

function valid_keys(
	view_pub: string,
	view_sec: string,
	spend_pub: string,
	spend_sec: string,
) {
	const expected_view_pub = sec_key_to_pub(view_sec);
	const expected_spend_pub = sec_key_to_pub(spend_sec);
	return expected_spend_pub === spend_pub && expected_view_pub === view_pub;
}

export function hash_to_scalar(buf: string) {
	const hash = cn_fast_hash(buf);
	const scalar = sc_reduce32(hash);
	return scalar;
}

export function generate_key_derivation(pub: string, sec: string) {
	if (pub.length !== 64 || sec.length !== 64) {
		throw Error("Invalid input length");
	}
	const P = ge_scalarmult(pub, sec);
	return ge_scalarmult(P, d2s("8")); //mul8 to ensure group
}

export function derivation_to_scalar(derivation: string, output_index: number) {
	let buf = "";
	if (derivation.length !== STRUCT_SIZES.EC_POINT * 2) {
		throw Error("Invalid derivation length!");
	}
	buf += derivation;
	const enc = encode_varint(output_index);
	if (enc.length > 10 * 2) {
		throw Error("output_index didn't fit in 64-bit varint");
	}
	buf += enc;
	return hash_to_scalar(buf);
}

function derive_secret_key(derivation: string, out_index: number, sec: string) {
	if (derivation.length !== 64 || sec.length !== 64) {
		throw Error("Invalid input length!");
	}
	const scalar_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	const scalar_b = hextobin(derivation_to_scalar(derivation, out_index));
	CNCrypto.HEAPU8.set(scalar_b, scalar_m);
	const base_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hextobin(sec), base_m);
	const derived_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	CNCrypto.ccall(
		"sc_add",
		"void",
		["number", "number", "number"],
		[derived_m, base_m, scalar_m],
	);
	const res = CNCrypto.HEAPU8.subarray(
		derived_m,
		derived_m + STRUCT_SIZES.EC_SCALAR,
	);
	CNCrypto._free(scalar_m);
	CNCrypto._free(base_m);
	CNCrypto._free(derived_m);
	return bintohex(res);
}

export function derive_public_key(
	derivation: string,
	out_index: number,
	pub: string,
) {
	if (derivation.length !== 64 || pub.length !== 64) {
		throw Error("Invalid input length!");
	}
	const s = derivation_to_scalar(derivation, out_index);
	return bintohex(
		nacl.ge_add(hextobin(pub), hextobin(ge_scalarmult_base(s))),
	);
}

// D' = P - Hs(aR|i)G
export function derive_subaddress_public_key(
	output_key: string,
	derivation: string,
	out_index: number,
) {
	if (output_key.length !== 64 || derivation.length !== 64) {
		throw Error("Invalid input length!");
	}
	const scalar = derivation_to_scalar(derivation, out_index);
	const point = ge_scalarmult_base(scalar);
	return ge_sub(output_key, point);
}

function hash_to_ec(key: string) {
	if (key.length !== KEY_SIZE * 2) {
		throw Error("Invalid input length");
	}
	const h_m = CNCrypto._malloc(HASH_SIZE);
	const point_m = CNCrypto._malloc(STRUCT_SIZES.GE_P2);
	const point2_m = CNCrypto._malloc(STRUCT_SIZES.GE_P1P1);
	const res_m = CNCrypto._malloc(STRUCT_SIZES.GE_P3);
	const hash = hextobin(cn_fast_hash(key));
	CNCrypto.HEAPU8.set(hash, h_m);
	CNCrypto.ccall(
		"ge_fromfe_frombytes_vartime",
		"void",
		["number", "number"],
		[point_m, h_m],
	);
	CNCrypto.ccall(
		"ge_mul8",
		"void",
		["number", "number"],
		[point2_m, point_m],
	);
	CNCrypto.ccall(
		"ge_p1p1_to_p3",
		"void",
		["number", "number"],
		[res_m, point2_m],
	);
	const res = CNCrypto.HEAPU8.subarray(res_m, res_m + STRUCT_SIZES.GE_P3);
	CNCrypto._free(h_m);
	CNCrypto._free(point_m);
	CNCrypto._free(point2_m);
	CNCrypto._free(res_m);
	return bintohex(res);
}

//returns a 32 byte point via "ge_p3_tobytes" rather than a 160 byte "p3", otherwise same as above;
function hash_to_ec_2(key: string) {
	if (key.length !== KEY_SIZE * 2) {
		throw Error("Invalid input length");
	}
	const h_m = CNCrypto._malloc(HASH_SIZE);
	const point_m = CNCrypto._malloc(STRUCT_SIZES.GE_P2);
	const point2_m = CNCrypto._malloc(STRUCT_SIZES.GE_P1P1);
	const res_m = CNCrypto._malloc(STRUCT_SIZES.GE_P3);
	const hash = hextobin(cn_fast_hash(key));
	const res2_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hash, h_m);
	CNCrypto.ccall(
		"ge_fromfe_frombytes_vartime",
		"void",
		["number", "number"],
		[point_m, h_m],
	);
	CNCrypto.ccall(
		"ge_mul8",
		"void",
		["number", "number"],
		[point2_m, point_m],
	);
	CNCrypto.ccall(
		"ge_p1p1_to_p3",
		"void",
		["number", "number"],
		[res_m, point2_m],
	);
	CNCrypto.ccall(
		"ge_p3_tobytes",
		"void",
		["number", "number"],
		[res2_m, res_m],
	);
	const res = CNCrypto.HEAPU8.subarray(res2_m, res2_m + KEY_SIZE);
	CNCrypto._free(h_m);
	CNCrypto._free(point_m);
	CNCrypto._free(point2_m);
	CNCrypto._free(res_m);
	CNCrypto._free(res2_m);
	return bintohex(res);
}
export const hashToPoint = hash_to_ec_2;

export function generate_key_image_2(pub: string, sec: string) {
	if (!pub || !sec || pub.length !== 64 || sec.length !== 64) {
		throw Error("Invalid input length");
	}
	const pub_m = CNCrypto._malloc(KEY_SIZE);
	const sec_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hextobin(pub), pub_m);
	CNCrypto.HEAPU8.set(hextobin(sec), sec_m);
	if (CNCrypto.ccall("sc_check", "number", ["number"], [sec_m]) !== 0) {
		throw Error("sc_check(sec) != 0");
	}
	const point_m = CNCrypto._malloc(STRUCT_SIZES.GE_P3);
	const point2_m = CNCrypto._malloc(STRUCT_SIZES.GE_P2);
	const point_b = hextobin(hash_to_ec(pub));
	CNCrypto.HEAPU8.set(point_b, point_m);
	const image_m = CNCrypto._malloc(STRUCT_SIZES.KEY_IMAGE);
	CNCrypto.ccall(
		"ge_scalarmult",
		"void",
		["number", "number", "number"],
		[point2_m, sec_m, point_m],
	);
	CNCrypto.ccall(
		"ge_tobytes",
		"void",
		["number", "number"],
		[image_m, point2_m],
	);
	const res = CNCrypto.HEAPU8.subarray(
		image_m,
		image_m + STRUCT_SIZES.KEY_IMAGE,
	);
	CNCrypto._free(pub_m);
	CNCrypto._free(sec_m);
	CNCrypto._free(point_m);
	CNCrypto._free(point2_m);
	CNCrypto._free(image_m);
	return bintohex(res);
}

export function generate_key_image(
	tx_pub: string,
	view_sec: string,
	spend_pub: string,
	spend_sec: string,
	output_index: number,
) {
	if (tx_pub.length !== 64) {
		throw Error("Invalid tx_pub length");
	}
	if (view_sec.length !== 64) {
		throw Error("Invalid view_sec length");
	}
	if (spend_pub.length !== 64) {
		throw Error("Invalid spend_pub length");
	}
	if (spend_sec.length !== 64) {
		throw Error("Invalid spend_sec length");
	}
	const recv_derivation = generate_key_derivation(tx_pub, view_sec);
	const ephemeral_pub = derive_public_key(
		recv_derivation,
		output_index,
		spend_pub,
	);
	const ephemeral_sec = derive_secret_key(
		recv_derivation,
		output_index,
		spend_sec,
	);
	const k_image = generate_key_image_2(ephemeral_pub, ephemeral_sec);
	return {
		ephemeral_pub: ephemeral_pub,
		key_image: k_image,
	};
}

function generate_key_image_helper_rct(
	keys: Keys,
	tx_pub_key: string,
	out_index: number,
	enc_mask?: string | null,
) {
	const recv_derivation = generate_key_derivation(tx_pub_key, keys.view.sec);
	if (!recv_derivation) throw Error("Failed to generate key image");
	const mask = enc_mask
		? sc_sub(
				enc_mask,
				hash_to_scalar(
					derivation_to_scalar(recv_derivation, out_index),
				),
		  )
		: I; //decode mask, or d2s(1) if no mask
	const ephemeral_pub = derive_public_key(
		recv_derivation,
		out_index,
		keys.spend.pub,
	);
	if (!ephemeral_pub) throw Error("Failed to generate key image");
	const ephemeral_sec = derive_secret_key(
		recv_derivation,
		out_index,
		keys.spend.sec,
	);
	const key_image = generate_key_image_2(ephemeral_pub, ephemeral_sec);
	return {
		in_ephemeral: {
			pub: ephemeral_pub,
			sec: ephemeral_sec,
			mask: mask,
		},
		key_image,
	};
}

//curve and scalar functions; split out to make their host functions cleaner and more readable
//inverts X coordinate -- this seems correct ^_^ -luigi1111
function ge_neg(point: string) {
	if (point.length !== 64) {
		throw Error("expected 64 char hex string");
	}
	return (
		point.slice(0, 62) +
		((parseInt(point.slice(62, 63), 16) + 8) % 16).toString(16) +
		point.slice(63, 64)
	);
}

export function ge_add(p1: string, p2: string) {
	if (p1.length !== 64 || p2.length !== 64) {
		throw Error("Invalid input length!");
	}
	return bintohex(nacl.ge_add(hextobin(p1), hextobin(p2)));
}

//order matters
export function ge_sub(point1: string, point2: string) {
	const point2n = ge_neg(point2);
	return ge_add(point1, point2n);
}

//adds two scalars together
function sc_add(scalar1: string, scalar2: string) {
	if (scalar1.length !== 64 || scalar2.length !== 64) {
		throw Error("Invalid input length!");
	}
	const scalar1_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	const scalar2_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	CNCrypto.HEAPU8.set(hextobin(scalar1), scalar1_m);
	CNCrypto.HEAPU8.set(hextobin(scalar2), scalar2_m);
	const derived_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	CNCrypto.ccall(
		"sc_add",
		"void",
		["number", "number", "number"],
		[derived_m, scalar1_m, scalar2_m],
	);
	const res = CNCrypto.HEAPU8.subarray(
		derived_m,
		derived_m + STRUCT_SIZES.EC_SCALAR,
	);
	CNCrypto._free(scalar1_m);
	CNCrypto._free(scalar2_m);
	CNCrypto._free(derived_m);
	return bintohex(res);
}

//subtracts one scalar from another
function sc_sub(scalar1: string, scalar2: string) {
	if (scalar1.length !== 64 || scalar2.length !== 64) {
		throw Error("Invalid input length!");
	}
	const scalar1_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	const scalar2_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	CNCrypto.HEAPU8.set(hextobin(scalar1), scalar1_m);
	CNCrypto.HEAPU8.set(hextobin(scalar2), scalar2_m);
	const derived_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	CNCrypto.ccall(
		"sc_sub",
		"void",
		["number", "number", "number"],
		[derived_m, scalar1_m, scalar2_m],
	);
	const res = CNCrypto.HEAPU8.subarray(
		derived_m,
		derived_m + STRUCT_SIZES.EC_SCALAR,
	);
	CNCrypto._free(scalar1_m);
	CNCrypto._free(scalar2_m);
	CNCrypto._free(derived_m);
	return bintohex(res);
}

//res = c - (ab) mod l; argument names copied from the signature implementation
function sc_mulsub(sigc: string, sec: string, k: string) {
	if (
		k.length !== KEY_SIZE * 2 ||
		sigc.length !== KEY_SIZE * 2 ||
		sec.length !== KEY_SIZE * 2 ||
		!valid_hex(k) ||
		!valid_hex(sigc) ||
		!valid_hex(sec)
	) {
		throw Error("bad scalar");
	}
	const sec_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hextobin(sec), sec_m);
	const sigc_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hextobin(sigc), sigc_m);
	const k_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hextobin(k), k_m);
	const res_m = CNCrypto._malloc(KEY_SIZE);

	CNCrypto.ccall(
		"sc_mulsub",
		"void",
		["number", "number", "number", "number"],
		[res_m, sigc_m, sec_m, k_m],
	);
	const res = CNCrypto.HEAPU8.subarray(res_m, res_m + KEY_SIZE);
	CNCrypto._free(k_m);
	CNCrypto._free(sec_m);
	CNCrypto._free(sigc_m);
	CNCrypto._free(res_m);
	return bintohex(res);
}

function ge_double_scalarmult_base_vartime(c: string, P: string, r: string) {
	if (c.length !== 64 || P.length !== 64 || r.length !== 64) {
		throw Error("Invalid input length!");
	}
	return bintohex(
		nacl.ge_double_scalarmult_base_vartime(
			hextobin(c),
			hextobin(P),
			hextobin(r),
		),
	);
}

function ge_double_scalarmult_postcomp_vartime(
	r: string,
	P: string,
	c: string,
	I: string,
) {
	if (
		c.length !== 64 ||
		P.length !== 64 ||
		r.length !== 64 ||
		I.length !== 64
	) {
		throw Error("Invalid input length!");
	}
	const Pb = hash_to_ec_2(P);
	return bintohex(
		nacl.ge_double_scalarmult_postcomp_vartime(
			hextobin(r),
			hextobin(Pb),
			hextobin(c),
			hextobin(I),
		),
	);
}

//begin RCT functions

//xv: vector of secret keys, 1 per ring (nrings)
//pm: matrix of pubkeys, indexed by size first
//iv: vector of indexes, 1 per ring (nrings), can be a string
//size: ring size, default 2
//nrings: number of rings, default 64
//extensible borromean signatures
interface BorromeanSignature {
	s: string[][];
	ee: string;
}

export function genBorromean(
	xv: string[],
	pm: string[][],
	iv: string,
	size: number,
	nrings: number,
) {
	if (xv.length !== nrings) {
		throw Error("wrong xv length " + xv.length);
	}
	if (pm.length !== size) {
		throw Error("wrong pm size " + pm.length);
	}
	for (let i = 0; i < pm.length; i++) {
		if (pm[i].length !== nrings) {
			throw Error("wrong pm[" + i + "] length " + pm[i].length);
		}
	}
	if (iv.length !== nrings) {
		throw Error("wrong iv length " + iv.length);
	}
	for (let i = 0; i < iv.length; i++) {
		if (+iv[i] >= size) {
			throw Error("bad indices value at: " + i + ": " + iv[i]);
		}
	}
	//signature struct
	// in the case of size 2 and nrings 64
	// bb.s = [[64], [64]]

	const bb: BorromeanSignature = {
		s: [],
		ee: "",
	};
	//signature pubkey matrix
	const L: string[][] = [];
	//add needed sub vectors (1 per ring size)
	for (let i = 0; i < size; i++) {
		bb.s[i] = [];
		L[i] = [];
	}
	//compute starting at the secret index to the last row
	let index;
	const alpha = [];
	for (let i = 0; i < nrings; i++) {
		index = parseInt(iv[i]);
		alpha[i] = random_scalar();
		L[index][i] = ge_scalarmult_base(alpha[i]);
		for (let j = index + 1; j < size; j++) {
			bb.s[j][i] = random_scalar();
			const c = hash_to_scalar(L[j - 1][i]);
			L[j][i] = ge_double_scalarmult_base_vartime(
				c,
				pm[j][i],
				bb.s[j][i],
			);
		}
	}
	//hash last row to create ee
	let ltemp = "";
	for (let i = 0; i < nrings; i++) {
		ltemp += L[size - 1][i];
	}
	bb.ee = hash_to_scalar(ltemp);
	//compute the rest from 0 to secret index
	let j: number;
	for (let i = 0; i < nrings; i++) {
		let cc = bb.ee;
		for (j = 0; j < +iv[i]; j++) {
			bb.s[j][i] = random_scalar();
			const LL = ge_double_scalarmult_base_vartime(
				cc,
				pm[j][i],
				bb.s[j][i],
			);
			cc = hash_to_scalar(LL);
		}
		bb.s[j][i] = sc_mulsub(xv[i], cc, alpha[i]);
	}
	return bb;
}

export function verifyBorromean(
	bb: BorromeanSignature,
	P1: string[],
	P2: string[],
) {
	let Lv1 = [];
	let chash;
	let LL;

	let p2 = "";
	for (let ii = 0; ii < 64; ii++) {
		p2 = ge_double_scalarmult_base_vartime(bb.ee, P1[ii], bb.s[0][ii]);
		LL = p2;
		chash = hash_to_scalar(LL);

		p2 = ge_double_scalarmult_base_vartime(chash, P2[ii], bb.s[1][ii]);
		Lv1[ii] = p2;
	}
	const eeComputed = array_hash_to_scalar(Lv1);
	const equalKeys = eeComputed === bb.ee;
	console.log(`[verifyBorromean] Keys equal? ${equalKeys}
		${eeComputed}
		${bb.ee}`);

	return equalKeys;
}

//proveRange
//proveRange gives C, and mask such that \sumCi = C
//	 c.f. http://eprint.iacr.org/2015/1098 section 5.1
//	 and Ci is a commitment to either 0 or s^i, i=0,...,n
//	 thus this proves that "amount" is in [0, s^n] (we assume s to be 4) (2 for now with v2 txes)
//	 mask is a such that C = aG + bH, and b = amount
//commitMaskObj = {C: commit, mask: mask}

interface CommitMask {
	C: string;
	mask: string;
}

interface RangeSignature {
	Ci: string[];
	bsig: BorromeanSignature;
}

function proveRange(
	commitMaskObj: CommitMask,
	amount: string | BigInt,
	nrings: number,
) {
	const size = 2;
	let C = I; //identity
	let mask = Z; //zero scalar
	const indices = d2b(amount); //base 2 for now
	const Ci: string[] = [];

	const ai: string[] = [];
	const PM: string[][] = [];
	for (let i = 0; i < size; i++) {
		PM[i] = [];
	}
	let j;
	//start at index and fill PM left and right -- PM[0] holds Ci
	for (let i = 0; i < nrings; i++) {
		ai[i] = random_scalar();

		j = +indices[i];
		PM[j][i] = ge_scalarmult_base(ai[i]);
		while (j > 0) {
			j--;
			PM[j][i] = ge_add(PM[j + 1][i], H2[i]); //will need to use i*2 for base 4 (or different object)
		}

		j = +indices[i];
		while (j < size - 1) {
			j++;
			PM[j][i] = ge_sub(PM[j - 1][i], H2[i]); //will need to use i*2 for base 4 (or different object)
		}
		mask = sc_add(mask, ai[i]);
	}
	/*
		* some more payload stuff here
		*/
	//copy commitments to sig and sum them to commitment
	for (let i = 0; i < nrings; i++) {
		//if (i < nrings - 1) //for later version
		Ci[i] = PM[0][i];
		C = ge_add(C, PM[0][i]);
	}

	const sig: RangeSignature = {
		Ci,
		bsig: genBorromean(ai, PM, indices, size, nrings),
	};
	//exp: exponent //doesn't exist for now

	commitMaskObj.C = C;
	commitMaskObj.mask = mask;
	return sig;
}

//proveRange and verRange
//proveRange gives C, and mask such that \sumCi = C
//   c.f. http://eprint.iacr.org/2015/1098 section 5.1
//   and Ci is a commitment to either 0 or 2^i, i=0,...,63
//   thus this proves that "amount" is in [0, 2^64]
//   mask is a such that C = aG + bH, and b = amount
//verRange verifies that \sum Ci = C and that each Ci is a commitment to 0 or 2^i

function verRange(C: string, as: RangeSignature, nrings = 64) {
	try {
		let CiH = []; // len 64
		let asCi = []; // len 64
		let Ctmp = identity();
		for (let i = 0; i < nrings; i++) {
			CiH[i] = ge_sub(as.Ci[i], H2[i]);
			asCi[i] = as.Ci[i];
			Ctmp = ge_add(Ctmp, as.Ci[i]);
		}
		const equalKeys = Ctmp === C;
		console.log(`[verRange] Equal keys? ${equalKeys} 
			C: ${C}
			Ctmp: ${Ctmp}`);
		if (!equalKeys) {
			return false;
		}

		if (!verifyBorromean(as.bsig, asCi, CiH)) {
			return false;
		}

		return true;
	} catch (e) {
		console.error(`[verRange]`, e);
		return false;
	}
}

function array_hash_to_scalar(array: string[]) {
	let buf = "";
	for (let i = 0; i < array.length; i++) {
		buf += array[i];
	}
	return hash_to_scalar(buf);
}

// Gen creates a signature which proves that for some column in the keymatrix "pk"
//	 the signer knows a secret key for each row in that column
// we presently only support matrices of 2 rows (pubkey, commitment)
// this is a simplied MLSAG_Gen function to reflect that
// because we don't want to force same secret column for all inputs

interface MGSig {
	ss: string[][];
	cc: string;
}
export function MLSAG_Gen(
	message: string,
	pk: string[][],
	xx: string[],
	kimg: string,
	index: number,
) {
	const cols = pk.length; //ring size
	let i;

	// secret index
	if (index >= cols) {
		throw Error("index out of range");
	}
	const rows = pk[0].length; //number of signature rows (always 2)
	// [pub, com] = 2
	if (rows !== 2) {
		throw Error("wrong row count");
	}
	// check all are len 2
	for (i = 0; i < cols; i++) {
		if (pk[i].length !== rows) {
			throw Error("pk is not rectangular");
		}
	}
	if (xx.length !== rows) {
		throw Error("bad xx size");
	}

	let c_old = "";
	const alpha = [];

	const rv: MGSig = {
		ss: [],
		cc: "",
	};
	for (i = 0; i < cols; i++) {
		rv.ss[i] = [];
	}
	const toHash = []; //holds 6 elements: message, pubkey, dsRow L, dsRow R, commitment, ndsRow L
	toHash[0] = message;

	//secret index (pubkey section)

	alpha[0] = random_scalar(); //need to save alphas for later
	toHash[1] = pk[index][0]; //secret index pubkey

	// this is the keyimg anyway  const H1 = hashToPoint(pk[index][0]) // Hp(K_in)
	//  rv.II[0] = ge_scalarmult(H1, xx[0]) // k_in.Hp(K_in)

	toHash[2] = ge_scalarmult_base(alpha[0]); //dsRow L, a.G
	toHash[3] = generate_key_image_2(pk[index][0], alpha[0]); //dsRow R (key image check)
	//secret index (commitment section)
	alpha[1] = random_scalar();
	toHash[4] = pk[index][1]; //secret index commitment
	toHash[5] = ge_scalarmult_base(alpha[1]); //ndsRow L

	c_old = array_hash_to_scalar(toHash);

	i = (index + 1) % cols;
	if (i === 0) {
		rv.cc = c_old;
	}
	while (i != index) {
		rv.ss[i][0] = random_scalar(); //dsRow ss
		rv.ss[i][1] = random_scalar(); //ndsRow ss

		//!secret index (pubkey section)
		toHash[1] = pk[i][0];
		toHash[2] = ge_double_scalarmult_base_vartime(
			c_old,
			pk[i][0],
			rv.ss[i][0],
		);
		toHash[3] = ge_double_scalarmult_postcomp_vartime(
			rv.ss[i][0],
			pk[i][0],
			c_old,
			kimg,
		);
		//!secret index (commitment section)
		toHash[4] = pk[i][1];
		toHash[5] = ge_double_scalarmult_base_vartime(
			c_old,
			pk[i][1],
			rv.ss[i][1],
		);
		c_old = array_hash_to_scalar(toHash); //hash to get next column c
		i = (i + 1) % cols;
		if (i === 0) {
			rv.cc = c_old;
		}
	}
	for (i = 0; i < rows; i++) {
		rv.ss[index][i] = sc_mulsub(c_old, xx[i], alpha[i]);
	}
	return rv;
}

export function MLSAG_ver(
	message: string,
	pk: string[][],
	rv: MGSig,
	kimg: string,
) {
	// we assume that col, row, rectangular checks are already done correctly
	// in MLSAG_gen
	const cols = pk.length;
	let c_old = rv.cc;
	let i = 0;
	let toHash = [];
	toHash[0] = message;
	while (i < cols) {
		//!secret index (pubkey section)
		toHash[1] = pk[i][0];
		toHash[2] = ge_double_scalarmult_base_vartime(
			c_old,
			pk[i][0],
			rv.ss[i][0],
		);
		toHash[3] = ge_double_scalarmult_postcomp_vartime(
			rv.ss[i][0],
			pk[i][0],
			c_old,
			kimg,
		);

		//!secret index (commitment section)
		toHash[4] = pk[i][1];
		toHash[5] = ge_double_scalarmult_base_vartime(
			c_old,
			pk[i][1],
			rv.ss[i][1],
		);

		c_old = array_hash_to_scalar(toHash);

		i = i + 1;
	}

	const c = sc_sub(c_old, rv.cc);
	console.log(`[MLSAG_ver]
		c_old: ${c_old} 
		rc.cc: ${rv.cc}
		c: ${c}`);

	return Number(c) === 0;
}

//Ring-ct MG sigs
//Prove:
//   c.f. http://eprint.iacr.org/2015/1098 section 4. definition 10.
//   This does the MG sig on the "dest" part of the given key matrix, and
//   the last row is the sum of input commitments from that column - sum output commitments
//   this shows that sum inputs = sum outputs
//Ver:
//   verifies the above sig is created corretly
function proveRctMG(
	message: string,
	pubs: MixCommitment[],
	inSk: SecretCommitment,
	kimg: string,
	mask: string,
	Cout: string,
	index: number,
) {
	const cols = pubs.length;
	if (cols < 3) {
		throw Error("cols must be > 2 (mixin)");
	}

	const PK: string[][] = [];
	//fill pubkey matrix (copy destination, subtract commitments)
	for (let i = 0; i < cols; i++) {
		PK[i] = [];
		PK[i][0] = pubs[i].dest;
		PK[i][1] = ge_sub(pubs[i].mask, Cout);
	}

	const xx = [inSk.x, sc_sub(inSk.a, mask)];
	return MLSAG_Gen(message, PK, xx, kimg, index);
}

//Ring-ct MG sigs
//Prove:
//   c.f. http://eprint.iacr.org/2015/1098 section 4. definition 10.
//   This does the MG sig on the "dest" part of the given key matrix, and
//   the last row is the sum of input commitments from that column - sum output commitments
//   this shows that sum inputs = sum outputs
//Ver:
//   verifies the above sig is created corretly

function verRctMG(
	mg: MGSig,
	pubs: MixCommitment[][],
	outPk: string[],
	txnFeeKey: string,
	message: string,
	kimg: string,
) {
	const cols = pubs.length;
	if (cols < 1) {
		throw Error("Empty pubs");
	}
	const rows = pubs[0].length;

	if (rows < 1) {
		throw Error("Empty pubs");
	}

	for (let i = 0; i < cols; ++i) {
		if (pubs[i].length !== rows) {
			throw Error("Pubs is not rectangular");
		}
	}

	// key matrix of (cols, tmp)

	let M: string[][] = [];
	console.log(pubs);
	//create the matrix to mg sig
	for (let i = 0; i < rows; i++) {
		M[i] = [];
		M[i][0] = pubs[0][i].dest;
		M[i][1] = ge_add(M[i][1] || identity(), pubs[0][i].mask); // start with input commitment
		for (let j = 0; j < outPk.length; j++) {
			M[i][1] = ge_sub(M[i][1], outPk[j]); // subtract all output commitments
		}
		M[i][1] = ge_sub(M[i][1], txnFeeKey); // subtract txnfee
	}

	console.log(
		`[MLSAG_ver input]`,
		JSON.stringify({ message, M, mg, kimg }, null, 1),
	);
	return MLSAG_ver(message, M, mg, kimg);
}

// simple version, assuming only post Rct

function verRctMGSimple(
	message: string,
	mg: MGSig,
	pubs: MixCommitment[],
	C: string,
	kimg: string,
) {
	try {
		const cols = pubs.length;
		const M: string[][] = [];

		for (let i = 0; i < cols; i++) {
			M[i][0] = pubs[i].dest;
			M[i][1] = ge_sub(pubs[i].mask, C);
		}

		return MLSAG_ver(message, M, mg, kimg);
	} catch (error) {
		console.error("[verRctSimple]", error);
		return false;
	}
}

function verBulletProof() {
	throw Error("verBulletProof is not implemented");
}

function get_pre_mlsag_hash(rv: RCTSignatures) {
	let hashes = "";
	hashes += rv.message;
	hashes += cn_fast_hash(serialize_rct_base(rv));
	const buf = serialize_range_proofs(rv);
	hashes += cn_fast_hash(buf);
	return cn_fast_hash(hashes);
}

function serialize_range_proofs(rv: RCTSignatures) {
	let buf = "";

	for (let i = 0; i < rv.p.rangeSigs.length; i++) {
		for (let j = 0; j < rv.p.rangeSigs[i].bsig.s.length; j++) {
			for (let l = 0; l < rv.p.rangeSigs[i].bsig.s[j].length; l++) {
				buf += rv.p.rangeSigs[i].bsig.s[j][l];
			}
		}
		buf += rv.p.rangeSigs[i].bsig.ee;
		for (let j = 0; j < rv.p.rangeSigs[i].Ci.length; j++) {
			buf += rv.p.rangeSigs[i].Ci[j];
		}
	}
	return buf;
}

//message is normal prefix hash
//inSk is vector of x,a
//kimg is vector of kimg
//destinations is vector of pubkeys (we skip and proxy outAmounts instead)
//inAmounts is vector of strings
//outAmounts is vector of strings
//mixRing is matrix of pubkey, commit (dest, mask)
//amountKeys is vector of scalars
//indices is vector
//txnFee is string, with its endian not swapped (e.g d2s is not called before passing it in as an argument)
//to this function

interface RCTSignatures {
	type: number;
	message: string;
	outPk: string[];
	p: {
		rangeSigs: RangeSignature[];
		MGs: MGSig[];
	};
	ecdhInfo: Commit[];
	txnFee: string;
	pseudoOuts: string[];
}
export function genRct(
	message: string,
	inSk: SecretCommitment[],
	kimg: string[],
	inAmounts: (BigInt | string)[],
	outAmounts: (BigInt | string)[],
	mixRing: MixCommitment[][],
	amountKeys: string[],
	indices: number[],
	txnFee: string,
) {
	if (outAmounts.length !== amountKeys.length) {
		throw Error("different number of amounts/amount_keys");
	}
	for (let i = 0; i < mixRing.length; i++) {
		if (mixRing[i].length <= indices[i]) {
			throw Error("bad mixRing/index size");
		}
	}
	if (mixRing.length !== inSk.length) {
		throw Error("mismatched mixRing/inSk");
	}

	if (indices.length !== inSk.length) {
		throw Error("mismatched indices/inSk");
	}

	const rv: RCTSignatures = {
		type: inSk.length === 1 ? RCTTypeFull : RCTTypeSimple,
		message,
		outPk: [],
		p: {
			rangeSigs: [],
			MGs: [],
		},
		ecdhInfo: [],
		txnFee,
		pseudoOuts: [],
	};

	let sumout = Z;
	const cmObj = {
		C: "",
		mask: "",
	};

	const nrings = 64; //for base 2/current
	let i;
	//compute range proofs, etc
	for (i = 0; i < outAmounts.length; i++) {
		const teststart = new Date().getTime();
		rv.p.rangeSigs[i] = proveRange(cmObj, outAmounts[i], nrings);
		const testfinish = new Date().getTime() - teststart;
		console.log("Time take for range proof " + i + ": " + testfinish);
		rv.outPk[i] = cmObj.C;
		sumout = sc_add(sumout, cmObj.mask);
		rv.ecdhInfo[i] = encode_rct_ecdh(
			{ mask: cmObj.mask, amount: d2s(outAmounts[i]) },
			amountKeys[i],
		);
	}

	//simple
	if (rv.type === 2) {
		if (inAmounts.length !== inSk.length) {
			throw Error("mismatched inAmounts/inSk");
		}

		const ai = [];
		let sumpouts = Z;
		//create pseudoOuts
		for (i = 0; i < inAmounts.length - 1; i++) {
			ai[i] = random_scalar();
			sumpouts = sc_add(sumpouts, ai[i]);
			rv.pseudoOuts[i] = commit(d2s(inAmounts[i]), ai[i]);
		}
		ai[i] = sc_sub(sumout, sumpouts);
		rv.pseudoOuts[i] = commit(d2s(inAmounts[i]), ai[i]);
		const full_message = get_pre_mlsag_hash(rv);
		for (i = 0; i < inAmounts.length; i++) {
			rv.p.MGs.push(
				proveRctMG(
					full_message,
					mixRing[i],
					inSk[i],
					kimg[i],
					ai[i],
					rv.pseudoOuts[i],
					indices[i],
				),
			);
		}
	} else {
		let sumC = I;
		//get sum of output commitments to use in MLSAG
		for (i = 0; i < rv.outPk.length; i++) {
			sumC = ge_add(sumC, rv.outPk[i]);
		}
		sumC = ge_add(sumC, ge_scalarmult(H, d2s(rv.txnFee)));
		const full_message = get_pre_mlsag_hash(rv);
		rv.p.MGs.push(
			proveRctMG(
				full_message,
				mixRing[0],
				inSk[0],
				kimg[0],
				sumout,
				sumC,
				indices[0],
			),
		);
	}
	return rv;
}

export function verRct(
	rv: RCTSignatures,
	semantics: boolean,
	mixRing: MixCommitment[][],
	kimg: string,
) {
	if (rv.type === 0x03) {
		throw Error("Bulletproof validation not implemented");
	}

	// where RCTTypeFull is 0x01 and  RCTTypeFullBulletproof is 0x03
	if (rv.type !== 0x01 && rv.type !== 0x03) {
		throw Error("verRct called on non-full rctSig");
	}
	if (semantics) {
		//RCTTypeFullBulletproof checks not implemented
		// RCTTypeFull checks
		if (rv.outPk.length !== rv.p.rangeSigs.length) {
			throw Error("Mismatched sizes of outPk and rv.p.rangeSigs");
		}
		if (rv.outPk.length !== rv.ecdhInfo.length) {
			throw Error("Mismatched sizes of outPk and rv.ecdhInfo");
		}
		if (rv.p.MGs.length !== 1) {
			throw Error("full rctSig has not one MG");
		}
	} else {
		// semantics check is early, we don't have the MGs resolved yet
	}
	try {
		if (semantics) {
			const results = [];
			for (let i = 0; i < rv.outPk.length; i++) {
				// might want to parallelize this like its done in the c++ codebase
				// via some abstraction library to support browser + node
				if (rv.p.rangeSigs.length === 0) {
					results[i] = verBulletProof(rv.p.bulletproofs[i]);
				} else {
					// mask -> C if public
					results[i] = verRange(rv.outPk[i], rv.p.rangeSigs[i]);
				}
			}

			for (let i = 0; i < rv.outPk.length; i++) {
				if (!results[i]) {
					console.error(
						"Range proof verification failed for output",
						i,
					);
					return false;
				}
			}
		} else {
			// compute txn fee
			const txnFeeKey = ge_scalarmult(H, d2s(rv.txnFee));
			const mgVerd = verRctMG(
				rv.p.MGs[0],
				mixRing,
				rv.outPk,
				txnFeeKey,
				get_pre_mlsag_hash(rv),
				kimg,
			);
			console.log("mg sig verified?", mgVerd);
			if (!mgVerd) {
				console.error("MG Signature verification failed");
				return false;
			}
		}
		return true;
	} catch (e) {
		console.error("Error in verRct: ", e);
		return false;
	}
}

//ver RingCT simple
//assumes only post-rct style inputs (at least for max anonymity)
export function verRctSimple(
	rv: RCTSignatures,
	semantics: boolean,
	mixRing: MixCommitment[][],
	kimgs: string[],
) {
	try {
		if (rv.type === 0x04) {
			throw Error("Simple Bulletproof validation not implemented");
		}

		if (rv.type !== 0x02 && rv.type !== 0x04) {
			throw Error("verRctSimple called on non simple rctSig");
		}

		if (semantics) {
			if (rv.type == 0x04) {
				throw Error("Simple Bulletproof validation not implemented");
			} else {
				if (rv.outPk.length !== rv.p.rangeSigs.length) {
					throw Error("Mismatched sizes of outPk and rv.p.rangeSigs");
				}
				if (rv.pseudoOuts.length !== rv.p.MGs.length) {
					throw Error(
						"Mismatched sizes of rv.pseudoOuts and rv.p.MGs",
					);
				}
				// originally the check is rv.p.pseudoOuts.length, but this'll throw
				// until p.pseudoOuts is added as a property to the rv object
				if (rv.p.pseudoOuts) {
					throw Error("rv.p.pseudoOuts must be empty");
				}
			}
		} else {
			if (rv.type === 0x04) {
				throw Error("Simple Bulletproof validation not implemented");
			} else {
				// semantics check is early, and mixRing/MGs aren't resolved yet
				if (rv.pseudoOuts.length !== mixRing.length) {
					throw Error(
						"Mismatched sizes of rv.pseudoOuts and mixRing",
					);
				}
			}
		}

		// if bulletproof, then use rv.p.pseudoOuts, otherwise use rv.pseudoOuts
		const pseudoOuts = rv.type === 0x04 ? rv.p.pseudoOuts : rv.pseudoOuts;

		if (semantics) {
			let sumOutpks = identity();
			for (let i = 0; i < rv.outPk.length; i++) {
				sumOutpks = ge_add(sumOutpks, rv.outPk[i]); // add all of the output commitments
			}

			const txnFeeKey = ge_scalarmult(H, d2s(rv.txnFee));
			sumOutpks = ge_add(txnFeeKey, sumOutpks); // add txnfeekey

			let sumPseudoOuts = identity();
			for (let i = 0; i < pseudoOuts.length; i++) {
				sumPseudoOuts = ge_add(sumPseudoOuts, pseudoOuts[i]); // sum up all of the pseudoOuts
			}

			if (sumOutpks !== sumPseudoOuts) {
				console.error("Sum check failed");
				return false;
			}

			const results = [];
			for (let i = 0; i < rv.outPk.length; i++) {
				// might want to parallelize this like its done in the c++ codebase
				// via some abstraction library to support browser + node
				if (rv.p.rangeSigs.length === 0) {
					results[i] = verBulletProof(rv.p.bulletproofs[i]);
				} else {
					// mask -> C if public
					results[i] = verRange(rv.outPk[i], rv.p.rangeSigs[i]);
				}
			}

			for (let i = 0; i < results.length; i++) {
				if (!results[i]) {
					console.error(
						"Range proof verification failed for output",
						i,
					);
					return false;
				}
			}
		} else {
			const message = get_pre_mlsag_hash(rv);
			const results = [];
			for (let i = 0; i < mixRing.length; i++) {
				results[i] = verRctMGSimple(
					message,
					rv.p.MGs[i],
					mixRing[i],
					pseudoOuts[i],
					kimgs[i],
				);
			}

			for (let i = 0; i < results.length; i++) {
				if (!results[i]) {
					console.error(
						"Range proof verification failed for output",
						i,
					);
					return false;
				}
			}
		}

		return true;
	} catch (error) {
		console.log("[verRctSimple]", error);
		return false;
	}
}

//decodeRct: (c.f. http://eprint.iacr.org/2015/1098 section 5.1.1)
//   uses the attached ecdh info to find the amounts represented by each output commitment
//   must know the destination private key to find the correct amount, else will return a random number

export function decodeRct(rv: RCTSignatures, sk: string, i: number) {
	// where RCTTypeFull is 0x01 and  RCTTypeFullBulletproof is 0x03
	if (rv.type !== 0x01 && rv.type !== 0x03) {
		throw Error("verRct called on non-full rctSig");
	}
	if (i >= rv.ecdhInfo.length) {
		throw Error("Bad index");
	}
	if (rv.outPk.length !== rv.ecdhInfo.length) {
		throw Error("Mismatched sizes of rv.outPk and rv.ecdhInfo");
	}

	// mask amount and mask
	const ecdh_info = rv.ecdhInfo[i];
	const { mask, amount } = decode_rct_ecdh(ecdh_info, sk);

	const C = rv.outPk[i];
	const Ctmp = ge_double_scalarmult_base_vartime(amount, H, mask);

	console.log("[decodeRct]", C, Ctmp);
	if (C !== Ctmp) {
		throw Error(
			"warning, amount decoded incorrectly, will be unable to spend",
		);
	}
	return { amount, mask };
}

export function decodeRctSimple(rv: RCTSignatures, sk: string, i: number) {
	if (rv.type !== 0x02 && rv.type !== 0x04) {
		throw Error("verRct called on full rctSig");
	}
	if (i >= rv.ecdhInfo.length) {
		throw Error("Bad index");
	}
	if (rv.outPk.length !== rv.ecdhInfo.length) {
		throw Error("Mismatched sizes of rv.outPk and rv.ecdhInfo");
	}

	// mask amount and mask
	const ecdh_info = rv.ecdhInfo[i];
	const { mask, amount } = decode_rct_ecdh(ecdh_info, sk);

	const C = rv.outPk[i];
	const Ctmp = ge_double_scalarmult_base_vartime(amount, H, mask);

	console.log("[decodeRctSimple]", C, Ctmp);
	if (C !== Ctmp) {
		throw Error(
			"warning, amount decoded incorrectly, will be unable to spend",
		);
	}
	return { amount, mask };
}

//end RCT functions

function add_pub_key_to_extra(extra: string, pubkey: string) {
	if (pubkey.length !== 64) throw Error("Invalid pubkey length");
	// Append pubkey tag and pubkey
	extra += TX_EXTRA_TAGS.PUBKEY + pubkey;
	return extra;
}

function add_nonce_to_extra(extra: string, nonce: string) {
	// Append extra nonce
	if (nonce.length % 2 !== 0) {
		throw Error("Invalid extra nonce");
	}
	if (nonce.length / 2 > TX_EXTRA_NONCE_MAX_COUNT) {
		throw Error(
			"Extra nonce must be at most " +
				TX_EXTRA_NONCE_MAX_COUNT +
				" bytes",
		);
	}
	// Add nonce tag
	extra += TX_EXTRA_TAGS.NONCE;
	// Encode length of nonce
	extra += ("0" + (nonce.length / 2).toString(16)).slice(-2);
	// Write nonce
	extra += nonce;
	return extra;
}

function get_payment_id_nonce(payment_id: string, pid_encrypt: boolean) {
	if (payment_id.length !== 64 && payment_id.length !== 16) {
		throw Error("Invalid payment id");
	}
	let res = "";
	if (pid_encrypt) {
		res += TX_EXTRA_NONCE_TAGS.ENCRYPTED_PAYMENT_ID;
	} else {
		res += TX_EXTRA_NONCE_TAGS.PAYMENT_ID;
	}
	res += payment_id;
	return res;
}

function abs_to_rel_offsets(offsets: string[]) {
	if (offsets.length === 0) return offsets;
	for (let i = offsets.length - 1; i >= 1; --i) {
		offsets[i] = new BigInt(offsets[i]).subtract(offsets[i - 1]).toString();
	}
	return offsets;
}

function get_tx_prefix_hash(tx: SignedTransaction) {
	const prefix = serialize_tx(tx, true);
	return cn_fast_hash(prefix);
}

export function serialize_tx(tx: SignedTransaction, headeronly?: boolean) {
	//tx: {
	//	version: uint64,
	//	unlock_time: uint64,
	//	extra: hex,
	//	vin: [{amount: uint64, k_image: hex, key_offsets: [uint64,..]},...],
	//	vout: [{amount: uint64, target: {key: hex}},...],
	//	signatures: [[s,s,...],...]
	//}

	if (!tx.signatures) {
		throw Error("This transaction does not contain pre rct signatures");
	}

	let buf = "";
	buf += encode_varint(tx.version);
	buf += encode_varint(tx.unlock_time);
	buf += encode_varint(tx.vin.length);
	let i, j;
	for (i = 0; i < tx.vin.length; i++) {
		const vin = tx.vin[i];
		switch (vin.type) {
			case "input_to_key":
				buf += "02";
				buf += encode_varint(vin.amount);
				buf += encode_varint(vin.key_offsets.length);
				for (j = 0; j < vin.key_offsets.length; j++) {
					buf += encode_varint(vin.key_offsets[j]);
				}
				buf += vin.k_image;
				break;
			default:
				throw Error("Unhandled vin type: " + vin.type);
		}
	}
	buf += encode_varint(tx.vout.length);
	for (i = 0; i < tx.vout.length; i++) {
		const vout = tx.vout[i];
		buf += encode_varint(vout.amount);
		switch (vout.target.type) {
			case "txout_to_key":
				buf += "02";
				buf += vout.target.key;
				break;
			default:
				throw Error("Unhandled txout target type: " + vout.target.type);
		}
	}
	if (!valid_hex(tx.extra)) {
		throw Error("Tx extra has invalid hex");
	}
	buf += encode_varint(tx.extra.length / 2);
	buf += tx.extra;
	if (!headeronly) {
		if (tx.vin.length !== tx.signatures.length) {
			throw Error("Signatures length != vin length");
		}
		for (i = 0; i < tx.vin.length; i++) {
			for (j = 0; j < tx.signatures[i].length; j++) {
				buf += tx.signatures[i][j];
			}
		}
	}
	return buf;
}

// RCT only
export function serialize_rct_tx_with_hash(tx: SignedTransaction) {
	if (!tx.rct_signatures) {
		throw Error("This transaction does not contain rct_signatures");
	}

	let hashes = "";
	let buf = "";
	buf += serialize_tx(tx, true);
	hashes += cn_fast_hash(buf);
	const buf2 = serialize_rct_base(tx.rct_signatures);
	hashes += cn_fast_hash(buf2);
	buf += buf2;
	let buf3 = serialize_range_proofs(tx.rct_signatures);
	//add MGs
	for (let i = 0; i < tx.rct_signatures.p.MGs.length; i++) {
		for (let j = 0; j < tx.rct_signatures.p.MGs[i].ss.length; j++) {
			buf3 += tx.rct_signatures.p.MGs[i].ss[j][0];
			buf3 += tx.rct_signatures.p.MGs[i].ss[j][1];
		}
		buf3 += tx.rct_signatures.p.MGs[i].cc;
	}
	hashes += cn_fast_hash(buf3);
	buf += buf3;
	const hash = cn_fast_hash(hashes);
	return {
		raw: buf,
		hash: hash,
	};
}

function serialize_rct_base(rv: RCTSignatures) {
	let buf = "";
	buf += encode_varint(rv.type);
	buf += encode_varint(rv.txnFee);
	if (rv.type === 2) {
		for (let i = 0; i < rv.pseudoOuts.length; i++) {
			buf += rv.pseudoOuts[i];
		}
	}
	if (rv.ecdhInfo.length !== rv.outPk.length) {
		throw Error("mismatched outPk/ecdhInfo!");
	}
	for (let i = 0; i < rv.ecdhInfo.length; i++) {
		buf += rv.ecdhInfo[i].mask;
		buf += rv.ecdhInfo[i].amount;
	}
	for (let i = 0; i < rv.outPk.length; i++) {
		buf += rv.outPk[i];
	}
	return buf;
}

function generate_ring_signature(
	prefix_hash: string,
	k_image: string,
	keys: string[],
	sec: string,
	real_index: number,
) {
	if (k_image.length !== STRUCT_SIZES.KEY_IMAGE * 2) {
		throw Error("invalid key image length");
	}
	if (sec.length !== KEY_SIZE * 2) {
		throw Error("Invalid secret key length");
	}
	if (prefix_hash.length !== HASH_SIZE * 2 || !valid_hex(prefix_hash)) {
		throw Error("Invalid prefix hash");
	}
	if (real_index >= keys.length || real_index < 0) {
		throw Error("real_index is invalid");
	}
	const _ge_tobytes = CNCrypto.cwrap("ge_tobytes", "void", [
		"number",
		"number",
	]);
	const _ge_p3_tobytes = CNCrypto.cwrap("ge_p3_tobytes", "void", [
		"number",
		"number",
	]);
	const _ge_scalarmult_base = CNCrypto.cwrap("ge_scalarmult_base", "void", [
		"number",
		"number",
	]);
	const _ge_scalarmult = CNCrypto.cwrap("ge_scalarmult", "void", [
		"number",
		"number",
		"number",
	]);
	const _sc_add = CNCrypto.cwrap("sc_add", "void", [
		"number",
		"number",
		"number",
	]);
	const _sc_sub = CNCrypto.cwrap("sc_sub", "void", [
		"number",
		"number",
		"number",
	]);
	const _sc_mulsub = CNCrypto.cwrap("sc_mulsub", "void", [
		"number",
		"number",
		"number",
		"number",
	]);
	const _sc_0 = CNCrypto.cwrap("sc_0", "void", ["number"]);
	const _ge_double_scalarmult_base_vartime = CNCrypto.cwrap(
		"ge_double_scalarmult_base_vartime",
		"void",
		["number", "number", "number", "number"],
	);
	const _ge_double_scalarmult_precomp_vartime = CNCrypto.cwrap(
		"ge_double_scalarmult_precomp_vartime",
		"void",
		["number", "number", "number", "number", "number"],
	);
	const _ge_frombytes_vartime = CNCrypto.cwrap(
		"ge_frombytes_vartime",
		"number",
		["number", "number"],
	);
	const _ge_dsm_precomp = CNCrypto.cwrap("ge_dsm_precomp", "void", [
		"number",
		"number",
	]);

	const buf_size = STRUCT_SIZES.EC_POINT * 2 * keys.length;
	const buf_m = CNCrypto._malloc(buf_size);
	const sig_size = STRUCT_SIZES.SIGNATURE * keys.length;
	const sig_m = CNCrypto._malloc(sig_size);

	// Struct pointer helper functions
	function buf_a(i: number) {
		return buf_m + STRUCT_SIZES.EC_POINT * (2 * i);
	}
	function buf_b(i: number) {
		return buf_m + STRUCT_SIZES.EC_POINT * (2 * i + 1);
	}
	function sig_c(i: number) {
		return sig_m + STRUCT_SIZES.EC_SCALAR * (2 * i);
	}
	function sig_r(i: number) {
		return sig_m + STRUCT_SIZES.EC_SCALAR * (2 * i + 1);
	}
	const image_m = CNCrypto._malloc(STRUCT_SIZES.KEY_IMAGE);
	CNCrypto.HEAPU8.set(hextobin(k_image), image_m);
	let i;
	const image_unp_m = CNCrypto._malloc(STRUCT_SIZES.GE_P3);
	const image_pre_m = CNCrypto._malloc(STRUCT_SIZES.GE_DSMP);
	const sum_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	const k_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	const h_m = CNCrypto._malloc(STRUCT_SIZES.EC_SCALAR);
	const tmp2_m = CNCrypto._malloc(STRUCT_SIZES.GE_P2);
	const tmp3_m = CNCrypto._malloc(STRUCT_SIZES.GE_P3);
	const pub_m = CNCrypto._malloc(KEY_SIZE);
	const sec_m = CNCrypto._malloc(KEY_SIZE);
	CNCrypto.HEAPU8.set(hextobin(sec), sec_m);
	if (_ge_frombytes_vartime(image_unp_m, image_m) != 0) {
		throw Error("failed to call ge_frombytes_vartime");
	}
	_ge_dsm_precomp(image_pre_m, image_unp_m);
	_sc_0(sum_m);
	for (i = 0; i < keys.length; i++) {
		if (i === real_index) {
			// Real key
			const rand = random_scalar();
			CNCrypto.HEAPU8.set(hextobin(rand), k_m);
			_ge_scalarmult_base(tmp3_m, k_m);
			_ge_p3_tobytes(buf_a(i), tmp3_m);
			const ec = hash_to_ec(keys[i]);
			CNCrypto.HEAPU8.set(hextobin(ec), tmp3_m);
			_ge_scalarmult(tmp2_m, k_m, tmp3_m);
			_ge_tobytes(buf_b(i), tmp2_m);
		} else {
			CNCrypto.HEAPU8.set(hextobin(random_scalar()), sig_c(i));
			CNCrypto.HEAPU8.set(hextobin(random_scalar()), sig_r(i));
			CNCrypto.HEAPU8.set(hextobin(keys[i]), pub_m);
			if (
				CNCrypto.ccall(
					"ge_frombytes_vartime",
					"void",
					["number", "number"],
					[tmp3_m, pub_m],
				) !== 0
			) {
				throw Error("Failed to call ge_frombytes_vartime");
			}
			_ge_double_scalarmult_base_vartime(
				tmp2_m,
				sig_c(i),
				tmp3_m,
				sig_r(i),
			);
			_ge_tobytes(buf_a(i), tmp2_m);
			const ec = hash_to_ec(keys[i]);
			CNCrypto.HEAPU8.set(hextobin(ec), tmp3_m);
			_ge_double_scalarmult_precomp_vartime(
				tmp2_m,
				sig_r(i),
				tmp3_m,
				sig_c(i),
				image_pre_m,
			);
			_ge_tobytes(buf_b(i), tmp2_m);
			_sc_add(sum_m, sum_m, sig_c(i));
		}
	}
	const buf_bin = CNCrypto.HEAPU8.subarray(buf_m, buf_m + buf_size);
	const scalar = hash_to_scalar(prefix_hash + bintohex(buf_bin));
	CNCrypto.HEAPU8.set(hextobin(scalar), h_m);
	_sc_sub(sig_c(real_index), h_m, sum_m);
	_sc_mulsub(sig_r(real_index), sig_c(real_index), sec_m, k_m);
	const sig_data = bintohex(
		CNCrypto.HEAPU8.subarray(sig_m, sig_m + sig_size),
	);
	const sigs = [];
	for (let k = 0; k < keys.length; k++) {
		sigs.push(
			sig_data.slice(
				STRUCT_SIZES.SIGNATURE * 2 * k,
				STRUCT_SIZES.SIGNATURE * 2 * (k + 1),
			),
		);
	}
	CNCrypto._free(image_m);
	CNCrypto._free(image_unp_m);
	CNCrypto._free(image_pre_m);
	CNCrypto._free(sum_m);
	CNCrypto._free(k_m);
	CNCrypto._free(h_m);
	CNCrypto._free(tmp2_m);
	CNCrypto._free(tmp3_m);
	CNCrypto._free(buf_m);
	CNCrypto._free(sig_m);
	CNCrypto._free(pub_m);
	CNCrypto._free(sec_m);
	return sigs;
}

interface TransactionInput {
	type: string;
	amount: string;
	k_image: string;
	key_offsets: string[];
}

interface TransactionOutput {
	amount: string;
	target: {
		type: string;
		key: string;
	};
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
		const mixRing: MixCommitment[][] = [];
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

			mixRing[i] = sourcesWithKeyImgAndKeys[i].outputs.map(o => ({
				dest: o.key,
				mask: o.commit,
			}));

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

interface Keys {
	view: Key;
	spend: Key;
}

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

export function estimateRctSize(
	inputs: number,
	mixin: number,
	outputs: number,
) {
	let size = 0;
	// tx prefix
	// first few bytes
	size += 1 + 6;
	size += inputs * (1 + 6 + (mixin + 1) * 3 + 32); // original C implementation is *2+32 but author advised to change 2 to 3 as key offsets are variable size and this constitutes a best guess
	// vout
	size += outputs * (6 + 32);
	// extra
	size += 40;
	// rct signatures
	// type
	size += 1;
	// rangeSigs
	size += (2 * 64 * 32 + 32 + 64 * 32) * outputs;
	// MGs
	size += inputs * (32 * (mixin + 1) + 32);
	// mixRing - not serialized, can be reconstructed
	/* size += 2 * 32 * (mixin+1) * inputs; */
	// pseudoOuts
	size += 32 * inputs;
	// ecdhInfo
	size += 2 * 32 * outputs;
	// outPk - only commitment is saved
	size += 32 * outputs;
	// txnFee
	size += 4;
	// const logStr = `estimated rct tx size for ${inputs} at mixin ${mixin} and ${outputs} : ${size}  (${((32 * inputs/*+1*/) + 2 * 32 * (mixin+1) * inputs + 32 * outputs)}) saved)`
	// console.log(logStr)

	return size;
}
