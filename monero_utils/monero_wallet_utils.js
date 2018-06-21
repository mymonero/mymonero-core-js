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
const mnemonic = require("../cryptonote_utils/mnemonic");
const monero_utils = require("./monero_cryptonote_utils_instance");
const monero_config = require("./monero_config");
//
//
////////////////////////////////////////////////////////////////////////////////
// Mnemonic wordset utilities - Exposing available names
//
const wordsetNamesByWordsetName = {};
const allWordsetNames = Object.keys(mnemonic.mn_words);
for (let wordsetName of allWordsetNames) {
	wordsetNamesByWordsetName[wordsetName] = wordsetName;
}
exports.WordsetNamesByWordsetName = wordsetNamesByWordsetName;
exports.AllWordsetNames = allWordsetNames;
//
//
// Mnemonic wordset utilities - Comparison
// TODO: perhaps move this to mnemonic.js
function AreEqualMnemonics(a, b, a__wordsetName, b__wordsetName) {
	if (a__wordsetName !== b__wordsetName) {
		return false;
	}
	const wordsetName = a__wordsetName;
	const wordset = mnemonic.mn_words[wordsetName];
	const prefix_len = wordset.prefix_len;
	// since mnemonics can be entered with only the first N letters, we must check equality of mnemonics by prefix
	let a__mnemonicString_words = a.split(" ");
	let b__mnemonicString_words = b.split(" ");
	if (a__mnemonicString_words.length != b__mnemonicString_words.length) {
		return false;
	}
	let numberOf_mnemonicString_words = a__mnemonicString_words.length;
	for (var i = 0; i < numberOf_mnemonicString_words; i++) {
		let a__word = a__mnemonicString_words[i];
		let b__word = b__mnemonicString_words[i];
		// ... We're assuming that a and b are already valid mneminics
		const a_prefix = a__word.slice(0, prefix_len);
		const b_prefix = b__word.slice(0, prefix_len);
		if (a_prefix !== b_prefix) {
			return false;
		}
	}
	return true;
}
exports.AreEqualMnemonics = AreEqualMnemonics;
//
////////////////////////////////////////////////////////////////////////////////
// Mnemonic wordset utilities - Wordset name detection by mnemonic contents
// TODO: perhaps move this to mnemonic.js
function WordsetNameAccordingToMnemonicString(
	mnemonicString, // throws
) {
	const mnemonicString_words = mnemonicString.split(" ");
	if (mnemonicString_words.length == 0) {
		throw "Invalid mnemonic";
	}
	var wholeMnemonicSuspectedAsWordsetNamed = null; // to derive
	for (let mnemonicString_word of mnemonicString_words) {
		var thisWordIsInWordsetNamed = null; // to derive
		for (let wordsetName of allWordsetNames) {
			if (wordsetName === "electrum") {
				continue; // skip because it conflicts with 'english'
			}
			const wordset = mnemonic.mn_words[wordsetName];
			const prefix_len = wordset.prefix_len;
			if (mnemonicString_word.length < prefix_len) {
				throw "Please enter more than " +
					(prefix_len - 1) +
					" letters per word";
			}
			const wordsetWords = wordset.words;
			for (let wordsetWord of wordsetWords) {
				if (wordsetWord.indexOf(mnemonicString_word) == 0) {
					// we can safely check prefix b/c we've checked mnemonicString_word is of at least min length
					thisWordIsInWordsetNamed = wordsetName;
					break; // done looking; exit interior then exterior loops
				}
			}
			if (thisWordIsInWordsetNamed != null) {
				// just found
				break; // also exit
			}
			// haven't found it yet; keep looking
		}
		if (thisWordIsInWordsetNamed === null) {
			// didn't find this word in any of the mnemonic wordsets
			throw "Unrecognized mnemonic language";
		}
		if (wholeMnemonicSuspectedAsWordsetNamed === null) {
			// haven't found it yet
			wholeMnemonicSuspectedAsWordsetNamed = thisWordIsInWordsetNamed;
		} else if (
			thisWordIsInWordsetNamed !== wholeMnemonicSuspectedAsWordsetNamed
		) {
			throw "Ambiguous mnemonic language"; // multiple wordset names detected
		} else {
			// nothing to do but keep verifying the rest of the words that it's the same suspsected wordset
		}
	}
	if (wholeMnemonicSuspectedAsWordsetNamed === null) {
		// this might be redundant, but for logical rigor……
		throw "Unrecognized mnemonic language";
	}
	//
	return wholeMnemonicSuspectedAsWordsetNamed;
}
exports.WordsetNameAccordingToMnemonicString = WordsetNameAccordingToMnemonicString;
//
//
////////////////////////////////////////////////////////////////////////////////
// Mnemonic wordset utilities - By locale
//
const mnemonicWordsetNamesByAppLocaleNames = {
	English: "english",
	Japanese: "japanese",
	Spanish: "spanish",
	Portuguese: "portuguese",
	// NOTE: no support for 'electrum' wordset here
};
exports.MnemonicWordsetNamesByAppLocaleNames = mnemonicWordsetNamesByAppLocaleNames;
//
exports.DefaultWalletMnemonicWordsetName =
	mnemonicWordsetNamesByAppLocaleNames.English;
//
//
////////////////////////////////////////////////////////////////////////////////
// Wallet creation:
//
function NewlyCreatedWallet(mnemonic_wordsetName, nettype) {
	const seed = monero_utils.random_scalar(); // to generate a 32-byte (25-word) but reduced seed
	const mnemonicString = mnemonic.mn_encode(seed, mnemonic_wordsetName);
	const keys = monero_utils.create_address(seed, nettype);
	//
	return {
		seed: seed,
		mnemonicString: mnemonicString,
		keys: keys,
	};
}
exports.NewlyCreatedWallet = NewlyCreatedWallet;
//
//
////////////////////////////////////////////////////////////////////////////////
// Wallet login:
//
function MnemonicStringFromSeed(account_seed, mnemonic_wordsetName) {
	const mnemonicString = mnemonic.mn_encode(
		account_seed,
		mnemonic_wordsetName,
	);
	//
	return mnemonicString;
}
exports.MnemonicStringFromSeed = MnemonicStringFromSeed;
//
function SeedAndKeysFromMnemonic_sync(
	mnemonicString,
	mnemonic_wordsetName,
	nettype,
) {
	// -> {err_str?, seed?, keys?}
	mnemonicString = mnemonicString.toLowerCase() || "";
	try {
		var seed = null;
		var keys = null;
		switch (mnemonic_wordsetName) {
			case "english":
				try {
					seed = mnemonic.mn_decode(mnemonicString);
				} catch (e) {
					// Try decoding as an electrum seed, on failure throw the original exception
					try {
						seed = mnemonic.mn_decode(mnemonicString, "electrum");
					} catch (ee) {
						throw e;
					}
				}
				break;
			default:
				seed = mnemonic.mn_decode(mnemonicString, mnemonic_wordsetName);
				break;
		}
		if (seed === null) {
			return { err_str: "Unable to derive seed", seed: null, keys: null };
		}
		keys = monero_utils.create_address(seed, nettype);
		if (keys === null) {
			return {
				err_str: "Unable to derive keys from seed",
				seed: seed,
				keys: null,
			};
		}
		return { err_str: null, seed: seed, keys: keys };
	} catch (e) {
		console.error("Invalid mnemonic!");
		return {
			err_str: typeof e === "string" ? e : "" + e,
			seed: null,
			keys: null,
		};
	}
}
exports.SeedAndKeysFromMnemonic_sync = SeedAndKeysFromMnemonic_sync;

function SeedAndKeysFromMnemonic(
	mnemonicString,
	mnemonic_wordsetName,
	nettype,
	fn, // made available via callback not because it's async but for convenience
) {
	// fn: (err?, seed?, keys?)
	const payload = SeedAndKeysFromMnemonic_sync(
		mnemonicString,
		mnemonic_wordsetName,
		nettype,
	);
	const err = payload.err_str ? new Error(payload.err_str) : null;
	const seed = payload.seed;
	const keys = payload.keys;
	fn(err, seed, keys);
}
exports.SeedAndKeysFromMnemonic = SeedAndKeysFromMnemonic;
//
function VerifiedComponentsForLogIn_sync(
	address,
	nettype,
	view_key,
	spend_key_orUndefinedForViewOnly,
	seed_orUndefined,
	wasAGeneratedWallet,
) {
	var spend_key =
		typeof spend_key_orUndefinedForViewOnly !== "undefined" &&
		spend_key_orUndefinedForViewOnly != null &&
		spend_key_orUndefinedForViewOnly != ""
			? spend_key_orUndefinedForViewOnly
			: null;
	var isInViewOnlyMode = spend_key == null;
	if (
		!view_key ||
		view_key.length !== 64 ||
		(isInViewOnlyMode ? false : spend_key.length !== 64)
	) {
		return { err_str: "invalid secret key length" };
	}
	if (
		!monero_utils.valid_hex(view_key) ||
		(isInViewOnlyMode ? false : !monero_utils.valid_hex(spend_key))
	) {
		return { err_str: "invalid hex formatting" };
	}
	var public_keys;
	try {
		public_keys = monero_utils.decode_address(address, nettype);
	} catch (e) {
		return { err_str: "invalid address" };
	}
	var expected_view_pub;
	try {
		expected_view_pub = monero_utils.sec_key_to_pub(view_key);
	} catch (e) {
		return { err_str: "invalid view key" };
	}
	var expected_spend_pub;
	if (spend_key.length === 64) {
		try {
			expected_spend_pub = monero_utils.sec_key_to_pub(spend_key);
		} catch (e) {
			return { err_str: "invalid spend key" };
		}
	}
	if (public_keys.view !== expected_view_pub) {
		return { err_str: "invalid view key" };
	}
	if (!isInViewOnlyMode && public_keys.spend !== expected_spend_pub) {
		return { err_str: "invalid spend key" };
	}
	const private_keys = {
		view: view_key,
		spend: spend_key,
	};
	var account_seed = null; // default
	if (
		typeof seed_orUndefined !== "undefined" &&
		seed_orUndefined &&
		seed_orUndefined.length != 0
	) {
		var expected_account;
		try {
			expected_account = monero_utils.create_address(
				seed_orUndefined,
				nettype,
			);
		} catch (e) {
			return { err_str: "invalid seed" };
		}
		if (
			expected_account.view.sec !== view_key ||
			expected_account.spend.sec !== spend_key ||
			expected_account.public_addr !== address
		) {
			return { err_str: "invalid seed" };
		}
		account_seed = seed_orUndefined;
	}
	const payload = {
		err_str: null, // err
		address: address,
		account_seed: account_seed !== "" ? account_seed : null,
		public_keys: public_keys,
		private_keys: private_keys,
		isInViewOnlyMode: isInViewOnlyMode,
	};
	return payload;
}
exports.VerifiedComponentsForLogIn_sync = VerifiedComponentsForLogIn_sync;
//
function VerifiedComponentsForLogIn(
	address,
	nettype,
	view_key,
	spend_key_orUndefinedForViewOnly,
	seed_orUndefined,
	wasAGeneratedWallet,
	fn,
) {
	// fn: (err?, address, account_seed, public_keys, private_keys, isInViewOnlyMode) -> Void
	const payload = VerifiedComponentsForLogIn_sync(
		address,
		nettype,
		view_key,
		spend_key_orUndefinedForViewOnly,
		seed_orUndefined,
		wasAGeneratedWallet,
	);
	fn(
		payload.err_str ? new Error(payload.err_str) : null,
		payload.address,
		payload.account_seed,
		payload.public_keys,
		payload.private_keys,
		payload.isInViewOnlyMode,
	);
}
exports.VerifiedComponentsForLogIn = VerifiedComponentsForLogIn;
