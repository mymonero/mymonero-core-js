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

import { config } from "./monero_config";
import { NetType } from "cryptonote_utils/nettype";
import { possibleOAAddress } from "./sending_funds/internal_libs/open_alias_lite";
import { Omit } from "types";
import { decode_address } from "cryptonote_utils";

export enum URITypes {
	addressAsFirstPathComponent = 1,
	addressAsAuthority = 2,
}

// we can stricten this typing using
// a discriminate union later
// since the TURITypes determines the nullity of the value
type FundRequestPayload = {
	address: string;
	payment_id?: string | null;
	amount?: string | null;
	amountCcySymbol?: string | null;
	description?: string | null;
	message?: string | null;
	uriType: URITypes;
};

export function encodeFundRequest(args: FundRequestPayload) {
	const address = args.address;
	if (!address) {
		throw Error("missing address");
	}

	let mutable_uri = config.coinUriPrefix;

	const uriType = args.uriType;
	if (uriType === URITypes.addressAsAuthority) {
		mutable_uri += "//"; // use for inserting a // so data detectors pick it up…
	} else if (uriType === URITypes.addressAsFirstPathComponent) {
		// nothing to do
	} else {
		throw Error("Illegal args.uriType");
	}

	mutable_uri += address;
	let queryParamStart = true;

	type ParamName =
		| "tx_amount"
		| "tx_amount_ccy"
		| "tx_description"
		| "tx_payment_id"
		| "tx_message";

	function addParam(name: ParamName, value?: string | null) {
		if (!value) {
			return;
		}
		if (queryParamStart) {
			queryParamStart = false;
		}

		mutable_uri += queryParamStart ? "?" : "&";
		mutable_uri += name + "=" + encodeURIComponent(value);
	}

	addParam("tx_amount", args.amount);

	const shouldAddCcySym =
		(args.amountCcySymbol || "").toLowerCase() !==
		config.coinSymbol.toLowerCase();
	if (shouldAddCcySym) {
		addParam("tx_amount_ccy", args.amountCcySymbol);
	}

	addParam("tx_description", args.description);
	addParam("tx_payment_id", args.payment_id);
	addParam("tx_message", args.message);

	return mutable_uri;
}

type DecodeFundRequestPayload = Omit<FundRequestPayload, "uriType">;

export function decodeFundRequest(
	str: string,
	nettype: NetType,
): DecodeFundRequestPayload {
	// detect no-scheme moneroAddr and possible OA addr - if has no monero: prefix

	if (!str.startsWith(config.coinUriPrefix)) {
		if (str.includes("?")) {
			// fairly sure this is correct.. (just an extra failsafe/filter)
			throw Error("Unrecognized URI format");
		}

		if (possibleOAAddress(str)) {
			return {
				address: str,
			};
		}

		try {
			decode_address(str, nettype);
		} catch (e) {
			throw Error("No Monero request info");
		}

		// then it looks like a monero address
		return {
			address: str,
		};
	}

	const url = new window.URL(str);

	const protocol = url.protocol;
	if (protocol !== config.coinUriPrefix) {
		throw Error("Request URI has non-Monero protocol");
	}

	// it seems that if the URL has // in it, pathname will be empty, but host will contain the address instead
	let target_address = url.pathname || url.host || url.hostname;

	if (target_address.startsWith("//")) {
		target_address = target_address.slice("//".length); // strip prefixing "//" in case URL had protocol:// instead of protocol:
	}

	const searchParams = url.searchParams;

	const payload: DecodeFundRequestPayload = {
		address: target_address,
	};

	const keyPrefixToTrim = "tx_";
	(searchParams as any).forEach((value: string, key: string) => {
		const index = key.startsWith(keyPrefixToTrim)
			? key.slice(keyPrefixToTrim.length, key.length)
			: key;

		payload[index as keyof DecodeFundRequestPayload] = value;
	});

	return payload;
}
