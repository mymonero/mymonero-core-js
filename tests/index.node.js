"use strict";
const mymonero = require("../");
// const assert = require("assert");

var public_key =
	"904e49462268d771cc1649084c35aa1296bfb214880fe2e7f373620a3e2ba597";
var private_key =
	"52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d";

var nettype = mymonero.nettype_utils.network_type.MAINNET;

var monero_utils;

async function t1()
{
	try {
		var decoded = (await mymonero.monero_utils_promise).decode_address(
			"49qwWM9y7j1fvaBK684Y5sMbN8MZ3XwDLcSaqcKwjh5W9kn9qFigPBNBwzdq6TCAm2gKxQWrdZuEZQBMjQodi9cNRHuCbTr",
			nettype,
		);
		console.log("decoded", decoded)
	} catch (e) {
		console.log(e)
	}


	try {
		var tx_size = (await mymonero.monero_utils_promise).estimate_rct_tx_size(
			2, // inputs 
			6, 
			2, // outputs
			0, //optl__extra_size, 
			false // optl__bulletproof
		);
		console.log("estimate_rct_tx_size", tx_size)
	} catch (e) {
		console.log(e)
	}

	try {
		var fee = new mymonero.JSBigInt((await mymonero.monero_utils_promise).calculate_fee(
			"9000000", 13762, 4
			// fee_per_kb__string, num_bytes, fee_multiplier
		));
		console.log("calculate_fee", mymonero.monero_amount_format_utils.formatMoneyFull(fee), "XMR")
	} catch (e) {
		console.log(e)
	}

	try {
		var fee = new mymonero.JSBigInt((await mymonero.monero_utils_promise).estimated_tx_network_fee(
			"9000000", 2
			// fee_per_kb__string, priority
		));
		console.log("estimated_tx_network_fee", mymonero.monero_amount_format_utils.formatMoneyFull(fee), "XMR")
	} catch (e) {
		console.log(e)
	}


}
t1()
