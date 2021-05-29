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
class MyMoneroCoreBridgeEssentialsClass extends MyMoneroBridgeClass_Base
{
	constructor(this_Module)
	{
		super(this_Module);
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
			// it will default to 0 which means use the latest fork rules
		}
		const args_str = JSON.stringify(args);
		const ret_string = this.Module.estimated_tx_network_fee(args_str);
		const ret = JSON.parse(ret_string);
		if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
			throw ret.err_msg; // TODO: maybe return this somehow
		}
		return ret.retVal; // this is a string - pass it to new JSBigInt(…)
	}
}
//
module.exports = MyMoneroCoreBridgeEssentialsClass