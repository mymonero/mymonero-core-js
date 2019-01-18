// Copyright (c) 2014-2019, MyMonero.com
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
//
const MyMoneroBridgeClass_Base = require('./MyMoneroBridgeClass_Base')
const MyMoneroBridge_utils = require('./MyMoneroBridge_utils')
//
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
class MyMoneroCoreBridgeClass extends MyMoneroBridgeClass_Base
{
	constructor(this_Module)
	{
		super(this_Module);
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
		return MyMoneroBridge_utils.ret_val_boolstring_to_bool(ret.retVal);
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
		return MyMoneroBridge_utils.ret_val_boolstring_to_bool(ret.retVal);
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
			isSubaddress: MyMoneroBridge_utils.ret_val_boolstring_to_bool(ret.isSubaddress)
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
		return MyMoneroBridge_utils.ret_val_boolstring_to_bool(ret.retVal);
	}

	mnemonic_from_seed(
		seed_string,
		wordset_name
	) {
		const args =
		{
			seed_string: seed_string,
			wordset_name: MyMoneroBridge_utils.api_safe_wordset_name(wordset_name)
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
			isValid: MyMoneroBridge_utils.ret_val_boolstring_to_bool(ret.isValid),
			isInViewOnlyMode: MyMoneroBridge_utils.ret_val_boolstring_to_bool(ret.isInViewOnlyMode),
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
			req_params.use_dust = MyMoneroBridge_utils.ret_val_boolstring_to_bool(req_params.use_dust)
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
	encrypt_payment_id(payment_id, public_key, secret_key)
	{
		const args =
		{
			payment_id: payment_id,
			public_key: public_key,
			secret_key: secret_key
		};
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.encrypt_payment_id(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			return { err_msg: ret.err_msg };
		}
		return ret.retVal;
	}
}
//
module.exports = MyMoneroCoreBridgeClass;