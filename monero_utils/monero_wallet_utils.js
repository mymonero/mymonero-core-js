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

"use strict";
//
const monero_utils = require("./monero_cryptonote_utils_instance");
//
//
////////////////////////////////////////////////////////////////////////////////
// Wallet login:
// TODO: deprecate all
function MnemonicStringFromSeed(account_seed, mnemonic_wordsetName) {
	// TODO: possibly deprecate this function as it now merely wraps another
	return monero_utils.mnemonic_from_seed(account_seed, mnemonic_wordsetName);
}
exports.MnemonicStringFromSeed = MnemonicStringFromSeed;
//
function SeedAndKeysFromMnemonic_sync(
	mnemonicString,
	nettype
) {
	// -> {err_str?, seed?, keys?}
	mnemonicString = mnemonicString.toLowerCase() || "";
	try {
		const ret = monero_utils.seed_and_keys_from_mnemonic(
			mnemonicString,
			nettype
		);
		return {
			err_str: null,
			mnemonic_language: ret.mnemonic_language,
			seed: ret.sec_seed_string,
			keys: {
				public_addr: ret.address_string,
				view: { 
					sec: ret.sec_viewKey_string, 
					pub: ret.pub_viewKey_string
				},
				spend: {
					sec: ret.sec_spendKey_string, 
					pub: ret.pub_spendKey_string
				}
			}
		};
	} catch (e) {
		console.error("Invalid mnemonic!");
		return {
			err_str: typeof e === "string" ? e : "" + e,
			mnemonic_language: null,
			seed: null,
			keys: null,
		};
	}
}
exports.SeedAndKeysFromMnemonic_sync = SeedAndKeysFromMnemonic_sync;

function SeedAndKeysFromMnemonic(
	mnemonicString,
	nettype,
	fn, // made available via callback not because it's async but for convenience
) {
	// fn: (err?, seed?, keys?)
	const payload = SeedAndKeysFromMnemonic_sync(
		mnemonicString,
		nettype,
	);
	fn(
		payload.err_str ? new Error(payload.err_str) : null, 
		payload.mnemonic_language, 
		payload.seed, 
		payload.keys
	);
}
exports.SeedAndKeysFromMnemonic = SeedAndKeysFromMnemonic;
//
function VerifiedComponentsForLogIn_sync(
	address,
	nettype,
	view_key,
	spend_key__orZero,
	seed__orZero,
) {
	var spend_key__orEmpty = spend_key__orZero || "";
	var seed__orEmpty = seed__orZero || "";
	try {
		const ret = monero_utils.validate_components_for_login(
			address,
			view_key,
			spend_key__orEmpty,
			seed__orEmpty,
			nettype
		);
		if (ret.isValid == false) { // actually don't think we're expecting this..
			return {
				err_str: "Invalid input"
			}
		}
		return {
			err_str: null,
			public_keys: {
				view: ret.pub_viewKey_string,
				spend: ret.pub_spendKey_string
			},
			isInViewOnlyMode: ret.isInViewOnlyMode // should be true "if(spend_key__orZero)"
		};
	} catch (e) {
		return {
			err_str: typeof e === "string" ? e : "" + e
		};
	}
}
exports.VerifiedComponentsForLogIn_sync = VerifiedComponentsForLogIn_sync;
//
function VerifiedComponentsForLogIn(
	address,
	nettype,
	view_key,
	spend_key_orUndef,
	seed_orUndef,
	fn,
) {
	// fn: (err?, address, account_seed, public_keys, private_keys, isInViewOnlyMode) -> Void
	const payload = VerifiedComponentsForLogIn_sync(
		address,
		nettype,
		view_key,
		spend_key_orUndef,
		seed_orUndef
	);
	fn(
		payload.err_str ? new Error(payload.err_str) : null,
		payload.public_keys,
		payload.isInViewOnlyMode,
	);
}
exports.VerifiedComponentsForLogIn = VerifiedComponentsForLogIn;
