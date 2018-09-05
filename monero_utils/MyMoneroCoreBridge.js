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
const JSBigInt = require("../cryptonote_utils/biginteger").BigInteger;
const nettype_utils = require("../cryptonote_utils/nettype");
const monero_config = require('./monero_config');
const currency_amount_format_utils = require("../cryptonote_utils/money_format_utils")(monero_config);
//
function ret_val_boolstring_to_bool(boolstring)
{
	if (typeof boolstring !== "string") {
		throw "ret_val_boolstring_to_bool expected string input"
	}
	if (boolstring === "true") {
		return true
	} else if (boolstring === "false") {
		return false
	}
	throw "ret_val_boolstring_to_bool given illegal input"
}
function api_safe_wordset_name(wordset_name)
{
	return wordset_name.charAt(0).toUpperCase() + wordset_name.substr(1) // capitalizes first letter
}
//
class MyMoneroCoreBridge
{
	constructor(Module)
	{
		this.Module = Module;
	}
	//
	//
	is_subaddress(addr, nettype) {
		const args =
		{
			address: addr,
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.is_subaddress(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return ret_val_boolstring_to_bool(ret.retVal);
	}

	is_integrated_address(addr, nettype) {
		const args =
		{
			address: addr,
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.is_integrated_address(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return ret_val_boolstring_to_bool(ret.retVal);
	}

	new_payment_id() {
		const args = {};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.new_payment_id(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return ret.retVal;
	}

	new__int_addr_from_addr_and_short_pid(
		address,
		short_pid,
		nettype
	) {
		if (!short_pid || short_pid.length != 16) {
			return { err_msg: "expected valid short_pid" };
		}
		const args =
		{
			address: address,
			short_pid: short_pid,
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.new_integrated_address(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return ret.retVal;
	}

	new_fake_address_for_rct_tx(nettype)
	{ // TODO: possibly support sending random_scalar from JS to emscripten to avoid emscripten random
		const args = { nettype_string: nettype_utils.nettype_to_API_string(nettype) };
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.new_fake_address_for_rct_tx(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return ret.retVal;
	}

	decode_address(address, nettype)
	{
		const args =
		{
			address: address,
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.decode_address(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return {
			spend: ret.pub_spendKey_string,
			view: ret.pub_viewKey_string,
			intPaymentId: ret.paymentID_string, // may be undefined
			isSubaddress: ret_val_boolstring_to_bool(ret.isSubaddress)
		}
	}

	newly_created_wallet(
		locale_language_code,
		nettype
	) {
		const args =
		{
			locale_language_code: locale_language_code, // NOTE: this function takes the locale, not the wordset name
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.newly_created_wallet(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return { // calling these out so as to provide a stable ret val interface
			mnemonic_string: ret.mnemonic_string,
			mnemonic_language: ret.mnemonic_language,
			sec_seed_string: ret.sec_seed_string,
			address_string: ret.address_string,
			pub_viewKey_string: ret.pub_viewKey_string,
			sec_viewKey_string: ret.sec_viewKey_string,
			pub_spendKey_string: ret.pub_spendKey_string,
			sec_spendKey_string: ret.sec_spendKey_string
		};
	}

	are_equal_mnemonics(a, b) {
		const args =
		{
			a: a,
			b: b
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.are_equal_mnemonics(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return ret_val_boolstring_to_bool(ret.retVal);
	}

	mnemonic_from_seed(
		seed_string,
		wordset_name
	) {
		const args =
		{
			seed_string: seed_string,
			wordset_name: api_safe_wordset_name(wordset_name)
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.mnemonic_from_seed(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg } // TODO: maybe return this somehow
		}
		return ret.retVal;
	}

	seed_and_keys_from_mnemonic(
		mnemonic_string,
		nettype
	) {
		const args =
		{
			mnemonic_string: mnemonic_string,
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.seed_and_keys_from_mnemonic(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return { // calling these out so as to provide a stable ret val interface
			sec_seed_string: ret.sec_seed_string,
			mnemonic_language: ret.mnemonic_language,
			address_string: ret.address_string,
			pub_viewKey_string: ret.pub_viewKey_string,
			sec_viewKey_string: ret.sec_viewKey_string,
			pub_spendKey_string: ret.pub_spendKey_string,
			sec_spendKey_string: ret.sec_spendKey_string
		};
	}

	validate_components_for_login(
		address_string,
		sec_viewKey_string,
		sec_spendKey_string,
		seed_string,
		nettype
	) {
		const args =
		{
			address_string: address_string,
			sec_viewKey_string: sec_viewKey_string,
			sec_spendKey_string: sec_spendKey_string,
			seed_string: seed_string,
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.validate_components_for_login(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return { // calling these out so as to provide a stable ret val interface
			isValid: ret_val_boolstring_to_bool(ret.isValid),
			isInViewOnlyMode: ret_val_boolstring_to_bool(ret.isInViewOnlyMode),
			pub_viewKey_string: ret.pub_viewKey_string,
			pub_spendKey_string: ret.pub_spendKey_string
		};
	}

	generate_key_image(
		tx_pub,
		view_sec,
		spend_pub,
		spend_sec,
		output_index
	) {
		if (tx_pub.length !== 64) {
			return { err_msg: "Invalid tx_pub length" };
		}
		if (view_sec.length !== 64) {
			return { err_msg: "Invalid view_sec length" };
		}
		if (spend_pub.length !== 64) {
			return { err_msg: "Invalid spend_pub length" };
		}
		if (spend_sec.length !== 64) {
			return { err_msg: "Invalid spend_sec length" };
		}
		const args =
		{
			sec_viewKey_string: view_sec,
			sec_spendKey_string: spend_sec,
			pub_spendKey_string: spend_pub,
			tx_pub_key: tx_pub,
			out_index: "" + output_index
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.generate_key_image(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg };
		}
		return ret.retVal;
	}

	create_signed_transaction(
		from_address_string,
		sec_keys,
		to_address_string,
		outputs,
		mix_outs,
		fake_outputs_count,
		serialized__sending_amount,
		serialized__change_amount,
		serialized__fee_amount, // string amount
		payment_id,
		unlock_time,
		rct,
		nettype
	) {
		return this.create_signed_transaction__nonIPCsafe(
			from_address_string,
			sec_keys,
			to_address_string,
			outputs,
			mix_outs,
			fake_outputs_count,
			new JSBigInt(serialized__sending_amount),
			new JSBigInt(serialized__change_amount),
			new JSBigInt(serialized__fee_amount), // only to be deserialized again is a bit silly but this at least exposes a JSBigInt API for others
			payment_id,
			unlock_time,
			rct,
			nettype
		);
	}

	create_signed_transaction__nonIPCsafe( // you can use this function to pass JSBigInts
		from_address_string,
		sec_keys,
		to_address_string,
		outputs,
		mix_outs,
		fake_outputs_count,
		sending_amount,
		change_amount,
		fee_amount,
		payment_id,
		unlock_time,
		rct,
		nettype
	) {
		unlock_time = unlock_time || 0;
		mix_outs = mix_outs || [];
		if (rct != true) {
			return { err_msg: "Expected rct=true" }
		}
		if (mix_outs.length !== outputs.length && fake_outputs_count !== 0) {
			return { err_msg: "Wrong number of mix outs provided (" +
				outputs.length +
				" outputs, " +
				mix_outs.length +
				" mix outs)" };
		}
		for (var i = 0; i < mix_outs.length; i++) {
			if ((mix_outs[i].outputs || []).length < fake_outputs_count) {
				return { err_msg: "Not enough outputs to mix with" };
			}
		}
		//
		// Now we need to convert all non-JSON-serializable objects such as JSBigInts to strings etc
		var sanitary__outputs = [];
		for (let i in outputs) {
			const sanitary__output = 
			{
				amount: outputs[i].amount.toString(),
				public_key: outputs[i].public_key,
				global_index: "" + outputs[i].global_index,
				index: "" + outputs[i].index,
				tx_pub_key: outputs[i].tx_pub_key
			};
			if (outputs[i].rct && typeof outputs[i].rct !== 'undefined') {
				sanitary__output.rct = outputs[i].rct;
			}
			sanitary__outputs.push(sanitary__output);
		}
		var sanitary__mix_outs = [];
		for (let i in mix_outs) {
			const sanitary__mix_outs_and_amount =
			{
				amount: "" + mix_outs[i].amount,
				outputs: [] 
			};
			if (mix_outs[i].outputs && typeof mix_outs[i].outputs !== 'undefined') {
				for (let j in mix_outs[i].outputs) {
					const sanitary__mix_out =
					{
						global_index: "" + mix_outs[i].outputs[j].global_index,
						public_key: mix_outs[i].outputs[j].public_key
					};
					if (mix_outs[i].outputs[j].rct && typeof mix_outs[i].outputs[j].rct !== 'undefined') {
						sanitary__mix_out.rct = mix_outs[i].outputs[j].rct;
					}
					sanitary__mix_outs_and_amount.outputs.push(sanitary__mix_out);
				}
			}
			sanitary__mix_outs.push(sanitary__mix_outs_and_amount);
		}
		const args =
		{
			from_address_string: from_address_string,
			sec_viewKey_string: sec_keys.view,
			sec_spendKey_string: sec_keys.spend,
			to_address_string: to_address_string,
			sending_amount: sending_amount.toString(),
			change_amount: change_amount.toString(),
			fee_amount: fee_amount.toString(),
			outputs: sanitary__outputs,
			mix_outs: sanitary__mix_outs,
			unlock_time: "" + unlock_time, // bridge is expecting a string
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		if (typeof payment_id !== "undefined" && payment_id) {
			args.payment_id_string = payment_id;
		}
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.create_transaction(args_str);
		const ret = JSON.parse(ret_string);
		//
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg };
		}
		return { // calling these out to set an interface
			signed_serialized_tx: ret.serialized_signed_tx,
			tx_hash: ret.tx_hash,
			tx_key: ret.tx_key
		};
	}
}
//
module.exports = function(options)
{
	options = options || {}
	//
	return new Promise(function(resolve) {
		const ENVIRONMENT_IS_WEB = typeof window==="object";
		const ENVIRONMENT_IS_WORKER = typeof importScripts==="function";
		const ENVIRONMENT_IS_NODE = typeof process==="object" && process.browser !== true && typeof require==="function" && ENVIRONMENT_IS_WORKER == false; // we want this to be true for Electron but not for a WebView
		const ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
		var _Module_template =
		{
			locateFile: function(filename, scriptDirectory)
			{
				// if (options["locateFile"]) {
				// 	return options["locateFile"](filename, scriptDirectory)
				// }
				var this_scriptDirectory = scriptDirectory
				const lastChar = this_scriptDirectory.charAt(this_scriptDirectory.length - 1)
				if (lastChar == "/") { 
					this_scriptDirectory = this_scriptDirectory.substring(0, this_scriptDirectory.length - 1) // remove trailing "/"
				}
				const scriptDirectory_pathComponents = this_scriptDirectory.split("/")
				const lastPathComponent = scriptDirectory_pathComponents[scriptDirectory_pathComponents.length - 1]
				var pathTo_cryptonoteUtilsDir; // add trailing slash to this
				if (lastPathComponent == "monero_utils") { // typical node or electron-main process
					pathTo_cryptonoteUtilsDir = scriptDirectory_pathComponents.join("/") + "/"
				} else if (ENVIRONMENT_IS_WEB) { // this will still match on electron-renderer, so the path must be patched up…
					if (typeof __dirname !== undefined && __dirname !== "/") { // looks like node running in browser.. assuming Electron-renderer
						// have to check != "/" b/c webpack (I think) replaces __dirname
						pathTo_cryptonoteUtilsDir = "file://" + __dirname + "/" // prepending "file://" because it's going to try to stream it
					} else { // actual web browser
						pathTo_cryptonoteUtilsDir = this_scriptDirectory + "/mymonero_core_js/monero_utils/" // this works for the MyMonero browser build, and is quite general, at least
					}
				} else {
					throw "Undefined pathTo_cryptonoteUtilsDir. Please pass locateFile() to cryptonote_utils init."
				}
				const fullPath = pathTo_cryptonoteUtilsDir + filename
				//
				return fullPath
			}
		}
		// if (ENVIRONMENT_IS_WEB && ENVIRONMENT_IS_NODE) { // that means it's probably electron-renderer
		// 	const fs = require("fs");
		// 	const path = require("path");
		// 	const filepath = path.normalize(path.join(__dirname, "MyMoneroCoreCpp.wasm"));
		// 	const wasmBinary = fs.readFileSync(filepath)
		// 	console.log("wasmBinary", wasmBinary)
		// 	_Module_template["wasmBinary"] = wasmBinary
		// }
		require("./MyMoneroCoreCpp")(_Module_template).ready.then(function(thisModule) 
		{
			const instance = new MyMoneroCoreBridge(thisModule);
			resolve(instance);
		});
	});
};