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
const monero_amount_format_utils = require("../cryptonote_utils/money_format_utils")(monero_config);
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
	// convert all lowercase, legacy values to core-cpp compatible
	if (wordset_name == "english") {
		return "English"
	} else if (wordset_name == "spanish") {
		return "Español"
	} else if (wordset_name == "portuguese") {
		return "Português"
	} else if (wordset_name == "japanese") {
		return "日本語"
	}
	return wordset_name // must be a value returned by core-cpp
}
function bridge_sanitized__spendable_out(raw__out)
{
	const sanitary__output = 
	{
		amount: raw__out.amount.toString(),
		public_key: raw__out.public_key,
		global_index: "" + raw__out.global_index,
		index: "" + raw__out.index,
		tx_pub_key: raw__out.tx_pub_key
	};
	if (raw__out.rct && typeof raw__out.rct !== 'undefined') {
		sanitary__output.rct = raw__out.rct;
	}
	return sanitary__output;
}
//
class MyMoneroCoreBridge
{
	constructor(this_Module)
	{
		this.Module = this_Module;
		//
		this._register_async_cb_fns__send_funds();
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
			throw ret.err_msg;
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
			throw ret.err_msg;
		}
		return ret_val_boolstring_to_bool(ret.retVal);
	}

	new_payment_id() {
		const args = {};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.new_payment_id(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg;
		}
		return ret.retVal;
	}

	new__int_addr_from_addr_and_short_pid(
		address,
		short_pid,
		nettype
	) {
		if (!short_pid || short_pid.length != 16) {
			throw "expected valid short_pid";
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
			throw ret.err_msg;
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
			throw ret.err_msg;
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
			throw ret.err_msg
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
			throw ret.err_msg
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
			throw ret.err_msg // TODO: maybe return this somehow
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
			throw ret.err_msg
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
			throw ret.err_msg
		}
		return { // calling these out so as to provide a stable ret val interface
			isValid: ret_val_boolstring_to_bool(ret.isValid),
			isInViewOnlyMode: ret_val_boolstring_to_bool(ret.isInViewOnlyMode),
			pub_viewKey_string: ret.pub_viewKey_string,
			pub_spendKey_string: ret.pub_spendKey_string
		};
	}

	address_and_keys_from_seed(
		seed_string,
		nettype
	) {
		const args =
		{
			seed_string: seed_string,
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.address_and_keys_from_seed(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg
		}
		return { // calling these out so as to provide a stable ret val interface
			address_string: ret.address_string,
			pub_viewKey_string: ret.pub_viewKey_string,
			sec_viewKey_string: ret.sec_viewKey_string,
			pub_spendKey_string: ret.pub_spendKey_string,
			sec_spendKey_string: ret.sec_spendKey_string
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
			throw "Invalid tx_pub length";
		}
		if (view_sec.length !== 64) {
			throw "Invalid view_sec length";
		}
		if (spend_pub.length !== 64) {
			throw "Invalid spend_pub length";
		}
		if (spend_sec.length !== 64) {
			throw "Invalid spend_sec length";
		}
		if (typeof output_index === 'undefined' || output_index === "" || output_index === null) {
			throw "Missing output_index";
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
			throw ret.err_msg;
		}
		return ret.retVal;
	}

	generate_key_derivation(
		pub,
		sec,
	) {
		const args =
		{
			pub: pub,
			sec: sec,
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.generate_key_derivation(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg;
		}
		return ret.retVal;
	}
	derive_public_key(derivation, out_index, pub) // TODO: fix legacy interface here by moving out_index to last arg pos
	{
		if (typeof pub === 'undefined' || pub === "" || pub === null) {
			throw "Missing pub arg (arg pos idx 2)";
		}
		if (typeof out_index === 'undefined' || out_index === "" || out_index === null) {
			throw "Missing out_index arg (arg pos idx 1)";
		}
		const args =
		{
			pub: pub,
			derivation: derivation, 
			out_index: ""+out_index,
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.derive_public_key(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg;
		}
		return ret.retVal;
	}
	derive_subaddress_public_key(
		output_key,
		derivation, 
		out_index
	) {
		if (typeof out_index === 'undefined' || out_index === "" || out_index === null) {
			throw "Missing out_index arg (arg pos idx 2)";
		}
		const args =
		{
			output_key: output_key,
			derivation: derivation,
			out_index: "" + out_index, // must be passed as string
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.derive_subaddress_public_key(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg;
		}
		return ret.retVal;		
	}
	derivation_to_scalar(derivation, output_index)
	{
		const args =
		{
			derivation: derivation,
			output_index: output_index,
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.derivation_to_scalar(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg };
		}
		return ret.retVal;
	}
	decodeRct(rv, sk, i)
	{
		const ecdhInfo = []; // should obvs be plural but just keeping exact names in-tact
		for (var j = 0 ; j < rv.outPk.length ; j++) {
			var this_ecdhInfo = rv.ecdhInfo[j];
  			ecdhInfo.push({
				mask: this_ecdhInfo.mask,
				amount: this_ecdhInfo.amount
			})
		}
		const outPk = [];
		for (var j = 0 ; j < rv.outPk.length ; j++) {
			var this_outPk_mask = null;
			var this_outPk = rv.outPk[j];
			if (typeof this_outPk === 'string') {
				this_outPk_mask = this_outPk;
			} else if (typeof this_outPk === "object") {
				this_outPk_mask = this_outPk.mask; 
			}
			if (this_outPk_mask == null) {
				throw "Couldn't locate outPk mask value";
			}
  			outPk.push({
				mask: this_outPk_mask
			})
		}
		const args =
		{
			i: "" + i,  // must be passed as string
			sk: sk,
			rv: {
				type: "" + rv.type/*must be string*/, // e.g. 1, 3 ... corresponding to rct::RCTType* in rctSigs.cpp
				ecdhInfo: ecdhInfo,
				outPk: outPk
			}
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.decodeRct(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg
		}
		return { // calling these out so as to provide a stable ret val interface
			amount: ret.amount, // string
			mask: ret.mask,
		};
	}
	decodeRctSimple(rv, sk, i)
	{
		const ecdhInfo = []; // should obvs be plural but just keeping exact names in-tact
		for (var j = 0 ; j < rv.outPk.length ; j++) {
			var this_ecdhInfo = rv.ecdhInfo[j];
  			ecdhInfo.push({
				mask: this_ecdhInfo.mask,
				amount: this_ecdhInfo.amount
			})
		}
		const outPk = [];
		for (var j = 0 ; j < rv.outPk.length ; j++) {
			var this_outPk_mask = null;
			var this_outPk = rv.outPk[j];
			if (typeof this_outPk === 'string') {
				this_outPk_mask = this_outPk;
			} else if (typeof this_outPk === "object") {
				this_outPk_mask = this_outPk.mask; 
			}
			if (this_outPk_mask == null) {
				return { err_msg: "Couldn't locate outPk mask value" }
			}
  			outPk.push({
				mask: this_outPk_mask
			})
		}
		const args =
		{
			i: "" + i,  // must be passed as string
			sk: sk,
			rv: {
				type: "" + rv.type/*must be string*/, // e.g. 1, 3 ... corresponding to rct::RCTType* in rctSigs.cpp
				ecdhInfo: ecdhInfo,
				outPk: outPk
			}
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.decodeRctSimple(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return { // calling these out so as to provide a stable ret val interface
			amount: ret.amount, // string
			mask: ret.mask,
		};
	}
	estimated_tx_network_fee(fee_per_kb__string, priority, optl__fee_per_b_string) // this is until we switch the server over to fee per b
	{ // TODO update this API to take object rather than arg list
		const args =
		{
			fee_per_b: typeof optl__fee_per_b_string !== undefined && optl__fee_per_b_string != null 
				? optl__fee_per_b_string 
				: (new JSBigInt(fee_per_kb__string)).divide(1024).toString()/*kib -> b*/, 
			priority: "" + priority,
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.estimated_tx_network_fee(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg; // TODO: maybe return this somehow
		}
		return ret.retVal; // this is a string - pass it to new JSBigInt(…)
	}
	estimate_rct_tx_size(n_inputs, mixin, n_outputs, extra_size, bulletproof)
	{
		const args =
		{
			n_inputs,
			mixin,
			n_outputs,
			extra_size,
			bulletproof
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.estimate_rct_tx_size(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg }
		}
		return parseInt(ret.retVal, 10);
	}
	//
	// Send
	__key_for_fromCpp__send_funds__get_unspent_outs(task_id)
	{
		return `fromCpp__send_funds__get_unspent_outs-${task_id}`
	}
	__key_for_fromCpp__send_funds__get_random_outs(task_id)
	{
		return `fromCpp__send_funds__get_random_outs-${task_id}`
	}
	__key_for_fromCpp__send_funds__submit_raw_tx(task_id)
	{
		return `fromCpp__send_funds__submit_raw_tx-${task_id}`
	}
	__key_for_fromCpp__send_funds__status_update(task_id)
	{
		return `fromCpp__send_funds__status_update-${task_id}`
	}
	__key_for_fromCpp__send_funds__error(task_id)
	{
		return `fromCpp__send_funds__error-${task_id}`
	}
	__key_for_fromCpp__send_funds__success(task_id)
	{
		return `fromCpp__send_funds__success-${task_id}`
	}
	__new_cb_args_with(task_id, err_msg, res)
	{
		const args = 
		{
			task_id: task_id
		};
		if (typeof err_msg !== 'undefined' && err_msg) {
			args.err_msg = err_msg; // errors must be sent back so that C++ can free heap vals container
		} else {
			args.res = res;
		}
		return args;
	}
	_register_async_cb_fns__send_funds()
	{
		const self = this
		self.Module.fromCpp__send_funds__get_unspent_outs = function(task_id, req_params)
		{
			self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__get_unspent_outs(task_id)](req_params);
		};
		self.Module.fromCpp__send_funds__get_random_outs = function(task_id, req_params)
		{
			self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__get_random_outs(task_id)](req_params);
		};
		self.Module.fromCpp__send_funds__submit_raw_tx = function(task_id, req_params)
		{
			self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__submit_raw_tx(task_id)](req_params);
		};
		self.Module.fromCpp__send_funds__status_update = function(task_id, params)
		{
			self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__status_update(task_id)](params);
		};
		self.Module.fromCpp__send_funds__error = function(task_id, params)
		{
			self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__error(task_id)](params);
		};
		self.Module.fromCpp__send_funds__success = function(task_id, params)
		{
			self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__success(task_id)](params);
		};
	}
	__new_task_id()
	{
		return Math.random().toString(36).substr(2, 9); // doesn't have to be super random
	}
	async__send_funds(fn_args)
	{
		const self = this;
		const task_id = self.__new_task_id();
		// register cb handler fns to wait for calls with thi task id
		if (typeof self._cb_handlers__send_funds == 'undefined' || !self._cb_handlers__send_funds) {
			self._cb_handlers__send_funds = {}
		}
		self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__get_unspent_outs(task_id)] = function(req_params)
		{
			// convert bridge-strings to native primitive types
			req_params.use_dust = ret_val_boolstring_to_bool(req_params.use_dust)
			req_params.mixin = parseInt(req_params.mixin)
			//
			fn_args.get_unspent_outs_fn(req_params, function(err_msg, res)
			{
				const args = self.__new_cb_args_with(task_id, err_msg, res);
				self.Module.send_cb_I__got_unspent_outs(JSON.stringify(args))
			});
		};
		self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__get_random_outs(task_id)] = function(req_params)
		{
			// convert bridge-strings to native primitive types
			req_params.count = parseInt(req_params.count)
			//
			fn_args.get_random_outs_fn(req_params, function(err_msg, res)
			{
				const args = self.__new_cb_args_with(task_id, err_msg, res);
				self.Module.send_cb_II__got_random_outs(JSON.stringify(args))
			});
		};
		self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__submit_raw_tx(task_id)] = function(req_params)
		{
			fn_args.submit_raw_tx_fn(req_params, function(err_msg, res)
			{
				const args = self.__new_cb_args_with(task_id, err_msg, res);
				self.Module.send_cb_III__submitted_tx(JSON.stringify(args))
			})
		};
		self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__status_update(task_id)] = function(params)
		{
			params.code = parseInt(params.code)
			//
			fn_args.status_update_fn(params);
		};
		self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__error(task_id)] = function(params)
		{
			fn_args.error_fn(params);
		};
		self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__success(task_id)] = function(params)
		{
			params.mixin = parseInt(params.mixin)
			//
			fn_args.success_fn(params);
		};
		const args = 
		{
			task_id: task_id,
			is_sweeping: fn_args.is_sweeping,
			sending_amount: "" + fn_args.sending_amount,
			from_address_string: fn_args.from_address_string,
			sec_viewKey_string: fn_args.sec_viewKey_string,
			sec_spendKey_string: fn_args.sec_spendKey_string,
			pub_spendKey_string: fn_args.pub_spendKey_string,
			to_address_string: fn_args.to_address_string,
			priority: "" + fn_args.priority,
			nettype_string: nettype_utils.nettype_to_API_string(fn_args.nettype)
		};
		if (typeof fn_args.payment_id_string !== 'undefined' && fn_args.payment_id_string) {
			args.payment_id_string = fn_args.payment_id_string;
		}
		if (typeof fn_args.unlock_time !== 'undefined' && fn_args.unlock_time !== null) {
			args.unlock_time = "" + fn_args.unlock_time; // bridge is expecting a string
		}
		const args_str = JSON.stringify(args, null, '')
		this.Module.send_funds(args_str);
	}
}
//
module.exports = function(options)
{
	options = options || {}
	//
	const ENVIRONMENT_IS_WEB = typeof window==="object";
	const ENVIRONMENT_IS_WORKER = typeof importScripts==="function";
	const ENVIRONMENT_IS_NODE = typeof process==="object" && process.browser !== true && typeof require==="function" && ENVIRONMENT_IS_WORKER == false; // we want this to be true for Electron but not for a WebView
	const ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
	//
	if ((typeof options.asmjs === 'undefined' || options.asmjs === null) && (typeof options.wasm === 'undefined' || options.wasm === null)) {
		var use_asmjs = false;
		if (ENVIRONMENT_IS_WEB) {
			var hasWebAssembly = false
			try {
				if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
					const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
					if (module instanceof WebAssembly.Module) {
						var isInstance = new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
						if (isInstance) {
							// TODO: add ios 11 mobile safari bug check to hasWebAssembly
						}
						// until then…
						hasWebAssembly = isInstance
					}
				}
			} catch (e) {
				// avoiding empty block statement warning..
				hasWebAssembly = false // to be clear
			}
			use_asmjs = hasWebAssembly != true
		}
		options.asmjs = use_asmjs;
	}
	//
	function locateFile(filename, scriptDirectory)
	{
		// if (options["locateFile"]) {
		// 	return options["locateFile"](filename, scriptDirectory)
		// }
		var this_scriptDirectory = scriptDirectory
		const lastChar = this_scriptDirectory.charAt(this_scriptDirectory.length - 1)
		if (lastChar == "/" || lastChar == "\\") { 
			// ^-- this is not a '\\' on Windows because emscripten actually appends a '/'
			this_scriptDirectory = this_scriptDirectory.substring(0, this_scriptDirectory.length - 1) // remove trailing "/"
		}
		var fullPath = null; // add trailing slash to this
		if (ENVIRONMENT_IS_NODE) {
			const path = require('path')
			const lastPathComponent = path.basename(this_scriptDirectory)
			if (lastPathComponent == "monero_utils") { // typical node or electron-main process
				fullPath = path.format({
					dir: this_scriptDirectory,
					base: filename
				})
			} else {
				console.warn("MyMoneroCoreBridge/locateFile() on node.js didn't find \"monero_utils\" (or possibly MyMoneroCoreBridge.js) itself in the expected location in the following path. The function may need to be expanded but it might in normal situations be likely to be another bug." ,  pathTo_cryptonoteUtilsDir)
			}
		} else if (ENVIRONMENT_IS_WEB) {
			var pathTo_cryptonoteUtilsDir;
			if (typeof __dirname !== undefined && __dirname !== "/") { // looks like node running in browser.. (but not going to assume it's electron-renderer since that should be taken care of by monero_utils.js itself)
				// but just in case it is... here's an attempt to support it
				// have to check != "/" b/c webpack (I think) replaces __dirname
				pathTo_cryptonoteUtilsDir = "file://" + __dirname + "/" // prepending "file://" because it's going to try to stream it
			} else { // actual web browser
				pathTo_cryptonoteUtilsDir = this_scriptDirectory + "/mymonero_core_js/monero_utils/" // this works for the MyMonero browser build, and is quite general, at least
			}
			fullPath = pathTo_cryptonoteUtilsDir + filename
		}
		if (fullPath == null) {
			throw "Unable to derive fullPath. Please pass locateFile() to cryptonote_utils init."
		}
		//
		return fullPath
	}
	return new Promise(function(resolve, reject) {
		var Module_template = {}
		if (options.asmjs != true || options.wasm == true) { // wasm
			console.log("Using wasm: ", true)
			//
			Module_template["locateFile"] = locateFile
			//
			// NOTE: This requires src/module-post.js to be included as post-js in CMakeLists.txt under a wasm build
			require("./MyMoneroCoreCpp_WASM")(Module_template).ready.then(function(thisModule) 
			{
				const instance = new MyMoneroCoreBridge(thisModule);
				resolve(instance);
			}).catch(function(e) {
				console.error("Error loading MyMoneroCoreCpp_WASM:", e);
				reject(e);
			});
		} else { // this is synchronous so we can resolve immediately
			console.log("Using wasm: ", false)
			//
			var scriptDirectory=""; // this was extracted from emscripten - it could get factored if anything else would ever need it
			if (ENVIRONMENT_IS_NODE) {
				scriptDirectory=__dirname+"/";
			} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
				if (ENVIRONMENT_IS_WORKER) {
					scriptDirectory = self.location.href
				} else if (document.currentScript) {
					scriptDirectory = document.currentScript.src
				}
				var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
				if(_scriptDir){
					scriptDirectory = _scriptDir
				}
				if (scriptDirectory.indexOf("blob:") !== 0) {
					scriptDirectory = scriptDirectory.substr(0,scriptDirectory.lastIndexOf("/")+1)
				} else {
					scriptDirectory = ""
				}
			}
			var read_fn;
			if (ENVIRONMENT_IS_NODE) {
				read_fn = function(filepath)
				{
					return require("fs").readFileSync(require("path").normalize(filepath)).toString()
				};
			} else if (ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER) {
				read_fn = function(url)
				{ // it's an option to move this over to fetch, but, fetch requires a polyfill for these older browsers anyway - making fetch an automatic dep just for asmjs fallback - and the github/fetch polyfill does not appear to actually support mode (for 'same-origin' policy) anyway - probably not worth it yet 
					var xhr = new XMLHttpRequest()
					xhr.open("GET", url, false)
					xhr.send(null)
					//
					return xhr.responseText
				};
			} else {
				throw "Unsupported environment - please implement file reading for asmjs fallback case"
			}
			const filepath = locateFile('MyMoneroCoreCpp_ASMJS.asm.js', scriptDirectory)
			const content = read_fn(filepath)
			// TODO: verify content - for now, relying on same-origin and tls/ssl
			var Module = {}
			try {
				eval(content) // I do not believe this is a safety concern, because content is server-controlled; https://humanwhocodes.com/blog/2013/06/25/eval-isnt-evil-just-misunderstood/
			} catch (e) {
				reject(e)
				return
			}
			setTimeout(function()
			{ // "delaying even 1ms is enough to allow compilation memory to be reclaimed"
				Module_template['asm'] = Module['asm']
				Module = null
				resolve(new MyMoneroCoreBridge(require("./MyMoneroCoreCpp_ASMJS")(Module_template)))
			}, 1) 
		}
	});
};