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
const MyMoneroCoreBridgeEssentialsClass = require('./MyMoneroCoreBridgeEssentialsClass')
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
class MyMoneroCoreBridgeClass extends MyMoneroCoreBridgeEssentialsClass
{
	constructor(this_Module)
	{
		super(this_Module);
		//
		this._register_async_cb_fns__send_funds();
	}
	//
	// 
	generate_key_derivation(
		pub,
		sec
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
			throw ret.err_msg;
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
		const ret_string = this.Module.decodeRctSimple(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg;
		}
		return { // calling these out so as to provide a stable ret val interface
			amount: ret.amount, // string
			mask: ret.mask,
		};
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
			throw ret.err_msg;
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
		function freeAllCBHandlersForTask()
		{
			delete self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__get_unspent_outs(task_id)]
			delete self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__get_random_outs(task_id)]
			delete self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__submit_raw_tx(task_id)]
			delete self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__status_update(task_id)]
			delete self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__error(task_id)]
			delete self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__success(task_id)]
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
				const ret_string = self.Module.send_cb_I__got_unspent_outs(JSON.stringify(args))
				const ret = JSON.parse(ret_string);
				if (typeof ret.err_msg !== 'undefined' && ret.err_msg) { // this is actually an exception
					self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__error(task_id)]({ 
						err_msg: ret.err_msg 
					});
					// ^-- this will clean up cb handlers too
					return;
				} else {
					// TODO: assert Object.keys(ret).length == 0
				}
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
				const ret_string = self.Module.send_cb_II__got_random_outs(JSON.stringify(args))
				const ret = JSON.parse(ret_string);
				if (typeof ret.err_msg !== 'undefined' && ret.err_msg) { // this is actually an exception
					self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__error(task_id)]({ 
						err_msg: ret.err_msg 
					});
					// ^-- this will clean up cb handlers too
					return;
				} else {
					// TODO: assert Object.keys(ret).length == 0
				}
			});
		};
		self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__submit_raw_tx(task_id)] = function(req_params)
		{
			fn_args.submit_raw_tx_fn(req_params, function(err_msg, res)
			{
				const args = self.__new_cb_args_with(task_id, err_msg, res);
				const ret_string = self.Module.send_cb_III__submitted_tx(JSON.stringify(args))
				const ret = JSON.parse(ret_string);
				if (typeof ret.err_msg !== 'undefined' && ret.err_msg) { // this is actually an exception
					self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__error(task_id)]({ 
						err_msg: ret.err_msg 
					});
					// ^-- this will clean up cb handlers too
					return;
				} else {
					// TODO: assert Object.keys(ret).length == 0
				}
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
			freeAllCBHandlersForTask(); // since we're done with the task
		};
		self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__success(task_id)] = function(params)
		{
			params.mixin = parseInt(params.mixin)
			//
			fn_args.success_fn(params);
			freeAllCBHandlersForTask(); // since we're done with the task
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
		const ret_string = this.Module.send_funds(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) { // this is actually an exception
			self._cb_handlers__send_funds[self.__key_for_fromCpp__send_funds__error(task_id)]({ 
				err_msg: ret.err_msg 
			});
			// ^-- this will clean up cb handlers too
			return;
		} else {
			// TODO: assert Object.keys(ret).length == 0
		}
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
			throw ret.err_msg;
		}
		return ret.retVal;
	}
	send_step1__prepare_params_for_get_decoys(
			is_sweeping,
			sending_amount, // this may be 0 if sweeping
			fee_per_b,
			fee_mask,
			priority,
			unspent_outputs,
			optl__payment_id_string, // this may be nil
			optl__passedIn_attemptAt_fee,
			optl__fork_version,
		) {
			var sanitary__unspent_outputs = [];
			for (let i in unspent_outputs) {
				const sanitary__output = bridge_sanitized__spendable_out(unspent_outputs[i])
				sanitary__unspent_outputs.push(sanitary__output);
			}
			const args =
			{
				sending_amount: sending_amount.toString(),
				is_sweeping: "" + is_sweeping, // bool -> string
				priority: "" + priority,
				fee_per_b: fee_per_b.toString(),
				fee_mask: fee_mask.toString(),
				unspent_outs: sanitary__unspent_outputs // outs, not outputs
			};
			if (typeof optl__payment_id_string !== "undefined" && optl__payment_id_string && optl__payment_id_string != "") {
				args.payment_id_string = optl__payment_id_string;
			}
			if (typeof optl__passedIn_attemptAt_fee !== "undefined" && optl__passedIn_attemptAt_fee && optl__passedIn_attemptAt_fee != "") {
				args.passedIn_attemptAt_fee = optl__passedIn_attemptAt_fee.toString(); // ought to be a string but in case it's a JSBigInt…
			}
			if (typeof optl__fork_version !== "undefined" && optl__fork_version && optl__fork_version != "") {
				args.fork_version = optl__fork_version.toString();
			}
			const args_str = JSON.stringify(args);
			const ret_string = this.Module.send_step1__prepare_params_for_get_decoys(args_str);
			const ret = JSON.parse(ret_string);
			// special case: err_code of needMoreMoneyThanFound; rewrite err_msg
			if (ret.err_code == "90" || ret.err_code == 90) { // declared in mymonero-core-cpp/src/monero_transfer_utils.hpp
				return { 
					required_balance: ret.required_balance,
					spendable_balance: ret.spendable_balance,
					err_msg: `Spendable balance too low. Have ${
						monero_amount_format_utils.formatMoney(new JSBigInt(ret.spendable_balance))
					} ${monero_config.coinSymbol}; need ${
						monero_amount_format_utils.formatMoney(new JSBigInt(ret.required_balance))
					} ${monero_config.coinSymbol}.` 
				};
			}
			if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
				return { err_msg: ret.err_msg };
			}
			return { // calling these out to set an interface
				mixin: parseInt(ret.mixin), // for the server API request to RandomOuts
				using_fee: ret.using_fee, // string; can be passed to step2
				change_amount: ret.change_amount, // string for step2
				using_outs: ret.using_outs, // this can be passed straight to step2
				final_total_wo_fee: ret.final_total_wo_fee // aka sending_amount for step2
			};
		}
	send_step2__try_create_transaction( // send only IPC-safe vals - no JSBigInts
			from_address_string,
			sec_keys,
			to_address_string,
			using_outs,
			mix_outs,
			fake_outputs_count,
			final_total_wo_fee,
			change_amount,
			fee_amount,
			payment_id,
			priority,
			fee_per_b, // not kib - if fee_per_kb, /= 1024
			fee_mask,
			unlock_time,
			nettype,
			optl__fork_version
		) {
			unlock_time = unlock_time || 0;
			mix_outs = mix_outs || [];
			// NOTE: we also do this check in the C++... may as well remove it from here
			if (mix_outs.length !== using_outs.length && fake_outputs_count !== 0) {
				return { 
					err_msg: "Wrong number of mix outs provided (" +
						using_outs.length + " using_outs, " +
						mix_outs.length + " mix outs)"
				};
			}
			for (var i = 0; i < mix_outs.length; i++) {
				if ((mix_outs[i].outputs || []).length < fake_outputs_count) {
					return { err_msg: "Not enough outputs to mix with" };
				}
			}
			//
			// Now we need to convert all non-JSON-serializable objects such as JSBigInts to strings etc - not that there should be any!
			// - and all numbers to strings - especially those which may be uint64_t on the receiving side
			var sanitary__using_outs = [];
			for (let i in using_outs) {
				const sanitary__output = bridge_sanitized__spendable_out(using_outs[i])
				sanitary__using_outs.push(sanitary__output);
			}
			var sanitary__mix_outs = [];
			for (let i in mix_outs) {
				const sanitary__mix_outs_and_amount =
				{
					amount: mix_outs[i].amount.toString(), // it should be a string, but in case it's not
					outputs: [] 
				};
				if (mix_outs[i].outputs && typeof mix_outs[i].outputs !== 'undefined') {
					for (let j in mix_outs[i].outputs) {
						const sanitary__mix_out =
						{
							global_index: "" + mix_outs[i].outputs[j].global_index, // number to string
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
				final_total_wo_fee: final_total_wo_fee.toString(),
				change_amount: change_amount.toString(),
				fee_amount: fee_amount.toString(),
				priority: "" + priority,
				fee_per_b: fee_per_b.toString(),
				fee_mask: fee_mask.toString(),
				using_outs: sanitary__using_outs,
				mix_outs: sanitary__mix_outs,
				unlock_time: "" + unlock_time, // bridge is expecting a string
				nettype_string: nettype_utils.nettype_to_API_string(nettype),
			};
			if (typeof payment_id !== "undefined" && payment_id) {
				args.payment_id_string = payment_id;
			}
			if (typeof optl__fork_version !== "undefined" && optl__fork_version && optl__fork_version != "") {
				args.fork_version = optl__fork_version.toString();
			}
			const args_str = JSON.stringify(args);
			const ret_string = this.Module.send_step2__try_create_transaction(args_str);
			const ret = JSON.parse(ret_string);
			//
			if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
				return { err_msg: ret.err_msg, tx_must_be_reconstructed: false };
			}
			if (ret.tx_must_be_reconstructed == "true" || ret.tx_must_be_reconstructed == true) {
				if (typeof ret.fee_actually_needed == 'undefined' || !ret.fee_actually_needed) {
					throw "tx_must_be_reconstructed; expected non-nil fee_actually_needed"
				}
				return {
					tx_must_be_reconstructed: ret.tx_must_be_reconstructed, // if true, re-do procedure from step1 except for requesting UnspentOuts (that can be done oncet)
					fee_actually_needed: ret.fee_actually_needed // can be passed back to step1
				}
			}
			return { // calling these out to set an interface
				tx_must_be_reconstructed: false, // in case caller is not checking for nil
				signed_serialized_tx: ret.serialized_signed_tx, // this name change should be fixed to serialized_signed_tx
				tx_hash: ret.tx_hash,
				tx_key: ret.tx_key
			};
		}
}
//
module.exports = MyMoneroCoreBridgeClass;