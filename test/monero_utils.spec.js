"use strict";
const mymonero = require("../");
const assert = require("assert");

var public_key =
	"904e49462268d771cc1649084c35aa1296bfb214880fe2e7f373620a3e2ba597";
var private_key =
	"52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d";

var nettype = mymonero.nettype_utils.network_type.MAINNET;

describe("cryptonote_utils tests", function() {

	it("create_address aka address_and_keys_from_seed", async function() {
		const monero_utils = await require("../monero_utils/MyMoneroCoreBridge")({})
		var decoded = monero_utils.address_and_keys_from_seed("9c973aa296b79bbf452781dd3d32ad7f", nettype);
		assert.strictEqual(
			decoded.address_string,
			"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg",
		);
	});

	it("decode mainnet primary address", async function() {
		const monero_utils = await require("../monero_utils/MyMoneroCoreBridge")({})
		var decoded = monero_utils.decode_address(
			"49qwWM9y7j1fvaBK684Y5sMbN8MZ3XwDLcSaqcKwjh5W9kn9qFigPBNBwzdq6TCAm2gKxQWrdZuEZQBMjQodi9cNRHuCbTr",
			nettype,
		);
		var expected = {
			isSubaddress: false,
			intPaymentId: undefined,
			spend:
				"d8f1e81ecbe25ce8b596d426fb02fe7b1d4bb8d14c06b3d3e371a60eeea99534",
			view:
				"576f0e61e250d941746ed147f602b5eb1ea250ca385b028a935e166e18f74bd7",
		};
		assert.deepStrictEqual(decoded, expected);
	});

	it("decode mainnet integrated address", async function() {
		const monero_utils = await require("../monero_utils/MyMoneroCoreBridge")({})
		var decoded = monero_utils.decode_address(
			"4KYcX9yTizXfvaBK684Y5sMbN8MZ3XwDLcSaqcKwjh5W9kn9qFigPBNBwzdq6TCAm2gKxQWrdZuEZQBMjQodi9cNd3mZpgrjXBKMx9ee7c",
			nettype,
		);
		var expected = {
			spend:
				"d8f1e81ecbe25ce8b596d426fb02fe7b1d4bb8d14c06b3d3e371a60eeea99534",
			view:
				"576f0e61e250d941746ed147f602b5eb1ea250ca385b028a935e166e18f74bd7",
			isSubaddress: false,
			intPaymentId: "83eab71fbee84eb9",
		};
		assert.deepStrictEqual(decoded, expected);
	});

});
