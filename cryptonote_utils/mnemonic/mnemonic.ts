/*
mnemonic.js : Converts between 4-byte aligned strings and a human-readable
sequence of words. Uses 1626 common words taken from wikipedia article:
http://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Contemporary_poetry
Originally written in python special for Electrum (lightweight Bitcoin client).
This version has been reimplemented in javascript and placed in public domain.
*/
/* This file has been modified to export its various functions and properties */

// should probably check for process here instead

type ModifiedWindow = Window & {
	IsElectronRendererProcess: boolean;
	msCrypto: Window["crypto"];
};

const isNodeJSOrElectronRenderer =
	!window || (window as ModifiedWindow).IsElectronRendererProcess;

import { Crc32 } from "../crc32";
import nodeJS__crypto from "crypto";
import mnemonic_words from "./mnemonic_words.json";

export const mn_default_wordset = "english";

export function mn_get_checksum_index(words: string[], prefix_len: number) {
	let trimmed_words = "";
	for (let i = 0; i < words.length; i++) {
		trimmed_words += words[i].slice(0, prefix_len);
	}
	const checksum = Crc32.run(trimmed_words);
	const index = checksum % words.length;
	return index;
}

export function mn_encode(str: string, wordset_name: keyof typeof mn_words) {
	"use strict";
	wordset_name = wordset_name || mn_default_wordset;
	let wordset = mn_words[wordset_name];
	let out: string[] = [];
	let n = wordset.words.length;
	for (let j = 0; j < str.length; j += 8) {
		str =
			str.slice(0, j) +
			mn_swap_endian_4byte(str.slice(j, j + 8)) +
			str.slice(j + 8);
	}
	for (let i = 0; i < str.length; i += 8) {
		let x = parseInt(str.substr(i, 8), 16);
		let w1 = x % n;
		let w2 = (Math.floor(x / n) + w1) % n;
		let w3 = (Math.floor(Math.floor(x / n) / n) + w2) % n;
		out = out.concat([
			wordset.words[w1],
			wordset.words[w2],
			wordset.words[w3],
		]);
	}
	if (wordset.prefix_len > 0) {
		out.push(out[mn_get_checksum_index(out, wordset.prefix_len)]);
	}
	return out.join(" ");
}

export function mn_swap_endian_4byte(str: string) {
	if (str.length !== 8) throw "Invalid input length: " + str.length;
	return (
		str.slice(6, 8) + str.slice(4, 6) + str.slice(2, 4) + str.slice(0, 2)
	);
}

export function mn_decode(str: string, wordset_name: keyof typeof mn_words) {
	"use strict";
	wordset_name = wordset_name || mn_default_wordset;
	let wordset = mn_words[wordset_name];
	let out = "";
	let n = wordset.words.length;
	let wlist = str.toLowerCase().split(" ");
	let checksum_word = "";
	if (wlist.length < 12)
		throw "You've entered too few words, please try again";
	if (
		(wordset.prefix_len === 0 && wlist.length % 3 !== 0) ||
		(wordset.prefix_len > 0 && wlist.length % 3 === 2)
	)
		throw "You've entered too few words, please try again";
	if (wordset.prefix_len > 0 && wlist.length % 3 === 0)
		throw "You seem to be missing the last word in your private key, please try again";
	if (wordset.prefix_len > 0) {
		// Pop checksum from mnemonic
		const popped_word = wlist.pop();
		if (!popped_word) {
			throw Error("No words left to pop");
		}
		checksum_word = popped_word;
	}
	// Decode mnemonic
	for (let i = 0; i < wlist.length; i += 3) {
		let w1, w2, w3;
		if (wordset.prefix_len === 0) {
			w1 = wordset.words.indexOf(wlist[i]);
			w2 = wordset.words.indexOf(wlist[i + 1]);
			w3 = wordset.words.indexOf(wlist[i + 2]);
		} else {
			w1 = wordset.trunc_words.indexOf(
				wlist[i].slice(0, wordset.prefix_len),
			);
			w2 = wordset.trunc_words.indexOf(
				wlist[i + 1].slice(0, wordset.prefix_len),
			);
			w3 = wordset.trunc_words.indexOf(
				wlist[i + 2].slice(0, wordset.prefix_len),
			);
		}
		if (w1 === -1 || w2 === -1 || w3 === -1) {
			throw "invalid word in mnemonic";
		}
		let x = w1 + n * ((n - w1 + w2) % n) + n * n * ((n - w2 + w3) % n);
		if (x % n != w1)
			throw "Something went wrong when decoding your private key, please try again";
		out += mn_swap_endian_4byte(("0000000" + x.toString(16)).slice(-8));
	}
	// Verify checksum
	if (wordset.prefix_len > 0) {
		let index = mn_get_checksum_index(wlist, wordset.prefix_len);
		let expected_checksum_word = wlist[index];
		if (
			expected_checksum_word.slice(0, wordset.prefix_len) !==
			checksum_word.slice(0, wordset.prefix_len)
		) {
			throw "Your private key could not be verified, please try again";
		}
	}
	return out;
}

export function mn_random(bits: number) {
	if (bits % 32 !== 0)
		throw "Something weird went wrong: Invalid number of bits - " + bits;
	if (isNodeJSOrElectronRenderer == false) {
		// browser implementation
		const array = new Uint32Array(bits / 32);

		let i = 0;

		function arr_is_zero() {
			for (let j = 0; j < bits / 32; ++j) {
				if (array[j] !== 0) return false;
			}
			return true;
		}

		const windowCryptoExists =
			typeof window !== "undefined" &&
			window.crypto &&
			window.crypto.getRandomValues;

		const windowMsCryptoExists =
			typeof window !== "undefined" &&
			typeof (window as ModifiedWindow).msCrypto === "object" &&
			typeof (window as ModifiedWindow).msCrypto.getRandomValues ===
				"function";

		do {
			/// Doing this in the loop is chunky, blame Microsoft and the in-flux status of the window.crypto standard

			if (windowCryptoExists) {
				window.crypto.getRandomValues(array);
			} else if (windowMsCryptoExists) {
				(window as ModifiedWindow).msCrypto.getRandomValues(array);
			} else {
				throw "Unfortunately MyMonero only runs on browsers that support the JavaScript Crypto API";
			}

			++i;
		} while (i < 5 && arr_is_zero());
		if (arr_is_zero()) {
			throw "Something went wrong and we could not securely generate random data for your account";
		}
		// Convert to hex
		let out = "";
		for (let j = 0; j < bits / 32; ++j) {
			out += ("0000000" + array[j].toString(16)).slice(-8);
		}

		return out;
	} else {
		// node.js implementation
		//			v---- Declared above
		const buffer = nodeJS__crypto.randomBytes(bits / 8); // assuming 8 bits in byte
		const hexString = buffer.toString("hex");
		//
		return hexString;
	}
}

function generate_full_memonic_word_list() {
	type Words = typeof mnemonic_words;
	type LangName = keyof Words;
	type Lang = (Words)[LangName];
	type TruncMergedWords = {
		[langName in LangName]: Lang & { trunc_words: string }
	};

	return Object.entries(mnemonic_words).reduce<TruncMergedWords>(
		(acc, [langName, lang]: [LangName, Lang]) => {
			if (lang.prefix_len === 0) {
				return acc;
			}

			const trunc_words = lang.words.reduce(
				(acc, curWord) => [...acc, curWord.slice(0, lang.prefix_len)],
				[],
			);

			return {
				...acc,
				[langName]: {
					...lang,
					trunc_words,
				},
			};
		},
		mnemonic_words as TruncMergedWords,
	);
}

export const mn_words = generate_full_memonic_word_list();
