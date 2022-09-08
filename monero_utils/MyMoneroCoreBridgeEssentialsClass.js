// Original Author: Lucas Jones
// Modified to remove jQuery dep and support modular inclusion of deps by Paul Shapiro (2016)
// Modified to add RingCT support by luigi1111 (2017)
//
// v--- These should maybe be injected into a context and supplied to currencyConfig for future platforms
const JSBigInt = require("@mymonero/mymonero-bigint").BigInteger;
const nettype_utils = require("@mymonero/mymonero-nettype");
const MyMoneroBridge_utils = require('@mymonero/mymonero-bridge-utils')
//
class MyMoneroCoreBridgeEssentialsClass
{
	constructor(this_Module)
	{
		this.Module = this_Module;
	}
	//
	//
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
	__new_task_id()
	{
		return Math.random().toString(36).substr(2, 9); // doesn't have to be super random
	}
	//
	//
	is_subaddress(addr, nettype) {
		const args =
		{
			address: addr,
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		return this.Module.is_subaddress(args.addr, args.nettype_string);
	}

	is_integrated_address(addr, nettype) {
		const args =
		{
			address: addr,
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		return this.Module.is_integrated_address(args.addr, args.nettype_string);
	}

	new_payment_id() {
		return this.Module.new_payment_id();
	}

	new__int_addr_from_addr_and_short_pid(address, short_pid, nettype) {
		if (!short_pid || short_pid.length != 16) {
			throw "expected valid short_pid";
		}
		const args =
		{
			address: address,
			short_pid: short_pid,
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		return this.Module.new_integrated_address(args.address, args.short_pid, args.nettype_string);
	}

	decode_address(address, nettype)
	{
		const args =
		{
			address: address,
			nettype_string: nettype_utils.nettype_to_API_string(nettype)
		};
		const ret_string  = this.Module.decode_address(args.address, args.nettype_string);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg;
		}
		return {
			spend: ret.publicSpendKey,
			view: ret.publicViewKey,
			intPaymentId: ret.paymentId, // may be undefined
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
		const ret_string = this.Module.newly_created_wallet(args.locale_language_code, args.nettype_string);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg
		}
		return { // calling these out so as to provide a stable ret val interface
			mnemonic_string: ret.mnemonic,
			mnemonic_language: ret.mnemonicLanguage,
			sec_seed_string: ret.seed,
			address_string: ret.address,
			pub_viewKey_string: ret.publicViewKey,
			sec_viewKey_string: ret.privateViewKey,
			pub_spendKey_string: ret.publicSpendKey,
			sec_spendKey_string: ret.privateSpendKey
		};
	}

	are_equal_mnemonics(a, b) {
		const args =
		{
			a: a,
			b: b
		};
		return this.Module.are_equal_mnemonics(args.a, args.b);
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
		const ret_string = this.Module.mnemonic_from_seed(args.seed_string, args.wordset_name);
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
		const ret_string = this.Module.seed_and_keys_from_mnemonic(args.mnemonic_string, args.nettype_string);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg
		}
		return { // calling these out so as to provide a stable ret val interface
			sec_seed_string: ret.sec_seed,
			mnemonic_language: ret.mnemonicLanguage,
			address_string: ret.address,
			pub_viewKey_string: ret.publicViewKey,
			sec_viewKey_string: ret.privateViewKey,
			pub_spendKey_string: ret.publicSpendKey,
			sec_spendKey_string: ret.privateSpendKey
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
		const ret_string = this.Module.validate_components_for_login(args.address_string, args.sec_viewKey_string, args.sec_spendKey_string, args.seed_string, args.nettype_string);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg
		}
		return { // calling these out so as to provide a stable ret val interface
			isValid: MyMoneroBridge_utils.ret_val_boolstring_to_bool(ret.isValid),
			isInViewOnlyMode: MyMoneroBridge_utils.ret_val_boolstring_to_bool(ret.isViewOnly),
			pub_viewKey_string: ret.publicViewKey,
			pub_spendKey_string: ret.publicSpendKey
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
		const ret_string = this.Module.address_and_keys_from_seed(args.seed_string, args.nettype_string);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg
		}
		return { // calling these out so as to provide a stable ret val interface
			address_string: ret.address,
			pub_viewKey_string: ret.publicViewKey,
			sec_viewKey_string: ret.privateViewKey,
			pub_spendKey_string: ret.publicSpendKey,
			sec_spendKey_string: ret.privateSpendKey
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
		const ret_string = this.Module.generate_key_image(args.tx_pub_key, args.sec_viewKey_string, args.pub_spendKey_string, args.sec_spendKey_string, args.out_index);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg;
		}
		return ret.retVal;
	}
	estimated_tx_network_fee(fee_per_kb__string, priority, optl__fee_per_b_string, optl__fork_version) // this is until we switch the server over to fee per b
	{ // TODO update this API to take object rather than arg list
		const args =
		{
			fee_per_b: typeof optl__fee_per_b_string !== undefined && optl__fee_per_b_string != null 
				? optl__fee_per_b_string 
				: (new JSBigInt(fee_per_kb__string)).divide(1024).toString()/*kib -> b*/, 
			priority: "" + priority,
		};
		if (typeof optl__fork_version !== 'undefined' && optl__fork_version !== null) {
			args.fork_version = "" + optl__fork_version
		} else {
			// default to 0 which means use the latest fork rules
			args.fork_version = "0"
			
		}
		const ret_string = this.Module.estimated_tx_network_fee(args.priority, args.fee_per_b, args.fork_version);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg; // TODO: maybe return this somehow
		}
		return ret.retVal; // this is a string - pass it to new JSBigInt(…)
	}
}
//
module.exports = MyMoneroCoreBridgeEssentialsClass
