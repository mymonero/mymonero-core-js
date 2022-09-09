
// v--- These should maybe be injected into a context and supplied to currencyConfig for future platforms
const JSBigInt = require("@mymonero/mymonero-bigint").BigInteger;
const nettype_utils = require("@mymonero/mymonero-nettype");
//
const MyMoneroCoreBridgeEssentialsClass = require('./MyMoneroCoreBridgeEssentialsClass')
const MyMoneroBridge_utils = require('@mymonero/mymonero-bridge-utils')
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
