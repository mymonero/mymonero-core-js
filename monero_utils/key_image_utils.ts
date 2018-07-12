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

const monero_utils = require("./monero_cryptonote_utils_instance");

// Managed caches - Can be used by apps which can't send a mutable_keyImagesByCacheKey

export type KeyImageCache = { [cacheIndex: string]: string };
export type KeyImageCacheMap = { [address: string]: KeyImageCache };

const keyImagesByWalletId: KeyImageCacheMap = {};

/**
 * @description Performs a memoized computation of a key image
 * @param {KeyImageCache} keyImageCache
 * @param {string} txPubKey
 * @param {number} outIndex
 * @param {string} address
 * @param {string} privViewKey
 * @param {string} pubSpendKey
 * @param {string} privSpendKey
 * @returns
 */
export function genKeyImage(
	keyImageCache: KeyImageCache,
	txPubKey: string,
	outIndex: number,
	address: string,
	privViewKey: string,
	pubSpendKey: string,
	privSpendKey: string,
) {
	const cacheIndex = `${txPubKey}:${address}:${outIndex}`;
	const cachedKeyImage = keyImageCache[cacheIndex];

	if (cachedKeyImage) {
		return cachedKeyImage;
	}

	const { key_image } = monero_utils.generate_key_image(
		txPubKey,
		privViewKey,
		pubSpendKey,
		privSpendKey,
		outIndex,
	);

	// cache the computed key image
	keyImageCache[cacheIndex] = key_image;

	return key_image;
}

/**
 *
 * @description Get a key image cache, that's mapped by address
 * @export
 * @param {string} address
 */
export function getKeyImageCache(address: string) {
	const cacheId = parseAddress(address);

	let cache = keyImagesByWalletId[cacheId];
	if (!cache) {
		cache = {};
		keyImagesByWalletId[cacheId] = cache;
	}
	return cache;
}

/**
 * @description Clears a key image cache that's mapped by the users address
 *
 *
 * IMPORTANT: Ensure you call this method when you want to clear your wallet from
 * memory or delete it, or else you could leak key images and public addresses.
 * @export
 * @param {string} address
 */
export function clearKeyImageCache(address: string) {
	const cacheId = parseAddress(address);

	delete keyImagesByWalletId[cacheId];

	const cache = keyImagesByWalletId[cacheId];

	if (cache) {
		throw "Key image cache still exists after deletion";
	}
}

/**
 * @description Normalize an address before using it to access the key image cache map as a key
 * @param {string} address
 */
function parseAddress(address: string) {
	// NOTE: making the assumption that public_address is unique enough to identify a wallet for caching....
	// FIXME: with subaddresses, is that still the case? would we need to split them up by subaddr anyway?
	if (!address) {
		throw "Address does not exist";
	}

	return address.toString();
}
