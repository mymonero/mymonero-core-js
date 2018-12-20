//
//  emscr_async_bridge_index.cpp
//  Copyright (c) 2014-2018, MyMonero.com
//
//  All rights reserved.
//
//  Redistribution and use in source and binary forms, with or without modification, are
//  permitted provided that the following conditions are met:
//
//  1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
//  2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
//  3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
//  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
//  MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
//  THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
//  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
//  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
//  STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
//  THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//
//
#include "emscr_async_send_bridge.hpp"
//
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/foreach.hpp>
#include <emscripten.h>
#include <unordered_map>
#include <memory>
//
#include "string_tools.h"
//
#include "monero_fork_rules.hpp"
#include "monero_send_routine.hpp"
#include "serial_bridge_utils.hpp"
#include "monero_address_utils.hpp"
//
#include "wallet_errors.h"
using namespace tools;
//
//
using namespace std;
using namespace boost;
using namespace monero_send_routine;
//
using namespace serial_bridge_utils;
using namespace emscr_async_bridge;
//
// Runtime - Memory container - To ensure values stick around until end of async process
enum _Send_Task_ValsState
{
	WAIT_FOR_STEP1,
	WAIT_FOR_STEP2,
	WAIT_FOR_FINISH
};
struct Send_Task_AsyncContext
{
	string task_id;
	//
	string from_address_string;
	string sec_viewKey_string;
	string sec_spendKey_string;
	string to_address_string;
	optional<string> payment_id_string;
	uint64_t sending_amount;
	bool is_sweeping;
	uint32_t simple_priority;
	uint64_t unlock_time;
	cryptonote::network_type nettype;
	//
	vector<SpendableOutput> unspent_outs;
	uint64_t fee_per_b;
	//
	// cached
	secret_key sec_viewKey;
	secret_key sec_spendKey;
	public_key pub_spendKey;
	//
	// re-entry params
	optional<uint64_t> passedIn_attemptAt_fee;
	size_t constructionAttempt;
	//
	_Send_Task_ValsState valsState;
	//
	// step1_retVals held for step2 - making them optl for increased safety
	optional<uint64_t> step1_retVals__final_total_wo_fee;
	optional<uint64_t> step1_retVals__change_amount;
	optional<uint64_t> step1_retVals__using_fee;
	optional<uint32_t> step1_retVals__mixin;
	vector<SpendableOutput> step1_retVals__using_outs;
	//
	// step2_retVals held for submit tx - optl for increased safety
	optional<string> step2_retVals__signed_serialized_tx_string;
	optional<string> step2_retVals__tx_hash_string;
	optional<string> step2_retVals__tx_key_string;
	optional<string> step2_retVals__tx_pub_key_string;
};
//
typedef std::unordered_map<string, Send_Task_AsyncContext *> context_map;
static context_map _heap_vals_ptrs_by_task_id;
static context_map::iterator _heap_vals_iter_for(const string &task_id)
{
    auto found = _heap_vals_ptrs_by_task_id.find(task_id);
    if (found == _heap_vals_ptrs_by_task_id.end()) {
		send_app_handler__error_msg(task_id, "Code fault: no waiting heap vals container ptr found");
    }
    return found;
}
static Send_Task_AsyncContext *_heap_vals_ptr_for(const string &task_id) 
{
    auto iter = _heap_vals_iter_for(task_id);
    //
    return iter != _heap_vals_ptrs_by_task_id.end() ? iter->second : nullptr;
}
void _delete_and_remove_heap_vals_ptr_for(const string &task_id)
{
	auto iter = _heap_vals_iter_for(task_id);
	if (iter != _heap_vals_ptrs_by_task_id.end()) {
		delete iter->second;
		_heap_vals_ptrs_by_task_id.erase(iter);
	} else {
		THROW_WALLET_EXCEPTION_IF(false, error::wallet_internal_error, "Expected _heap_vals_ptr_for(task_id)");
	}
}
//
// To-JS fn decls - Status updates and routine completions
static void send_app_handler__status_update(const string &task_id, SendFunds_ProcessStep code)
{
	boost::property_tree::ptree root;
	root.put("code", code); // not 64bit so sendable in JSON
	root.put("msg", std::move(err_msg_from_err_code__send_funds_step(code)));
	auto ret_json_string = ret_json_from_root(root);
	//
	EM_ASM_(
		{
			const JS__task_id = Module.UTF8ToString($0);
			const JS__req_params_string = Module.UTF8ToString($1);
			const JS__req_params = JSON.parse(JS__req_params_string);
			Module.fromCpp__send_funds__status_update(JS__task_id, JS__req_params); // Module must implement this!
		},
		task_id.c_str(),
		ret_json_string.c_str()
	);
}
void emscr_async_bridge::send_app_handler__error_json(const string &task_id, const string &ret_json_string)
{
	EM_ASM_(
		{
			const JS__task_id = Module.UTF8ToString($0);
			const JS__req_params_string = Module.UTF8ToString($1);
			const JS__req_params = JSON.parse(JS__req_params_string);
			Module.fromCpp__send_funds__error(JS__task_id, JS__req_params); // Module must implement this!
		},
		task_id.c_str(),
		ret_json_string.c_str()
	);
	_delete_and_remove_heap_vals_ptr_for(task_id); // having finished
}
void emscr_async_bridge::send_app_handler__error_msg(const string &task_id, const string &err_msg)
{
	send_app_handler__error_json(task_id, error_ret_json_from_message(std::move(err_msg)));
}
void emscr_async_bridge::send_app_handler__error_code(
	const string &task_id,
	CreateTransactionErrorCode err_code,
	// for display / information purposes on errCode=needMoreMoneyThanFound during step1:
	uint64_t spendable_balance, // (effectively but not the same as spendable_balance)
	uint64_t required_balance // for display / information purposes on errCode=needMoreMoneyThanFound during step1
) {
	boost::property_tree::ptree root;
	root.put(ret_json_key__any__err_code(), err_code);
	root.put(ret_json_key__any__err_msg(), err_msg_from_err_code__create_transaction(err_code));
	// The following will be set if errCode==needMoreMoneyThanFound
	root.put(ret_json_key__send__spendable_balance(), std::move(RetVals_Transforms::str_from(spendable_balance)));
	root.put(ret_json_key__send__required_balance(), std::move(RetVals_Transforms::str_from(required_balance)));
	//
	send_app_handler__error_json(task_id, ret_json_from_root(root));
}
//
void send_app_handler__success(const string &task_id, const SendFunds_Success_RetVals &success_retVals)
{
	boost::property_tree::ptree root;
	root.put(ret_json_key__send__used_fee(), std::move(RetVals_Transforms::str_from(success_retVals.used_fee)));
	root.put(ret_json_key__send__total_sent(), std::move(RetVals_Transforms::str_from(success_retVals.total_sent)));
	root.put(ret_json_key__send__mixin(), success_retVals.mixin); // this is a uint32 so it can be sent in JSON
	if (success_retVals.final_payment_id) {
		root.put(ret_json_key__send__final_payment_id(), std::move(*(success_retVals.final_payment_id)));
	}
	root.put(ret_json_key__send__serialized_signed_tx(), std::move(success_retVals.signed_serialized_tx_string));
	root.put(ret_json_key__send__tx_hash(), std::move(success_retVals.tx_hash_string));
	root.put(ret_json_key__send__tx_key(), std::move(success_retVals.tx_key_string));
	root.put(ret_json_key__send__tx_pub_key(), std::move(success_retVals.tx_pub_key_string));
	//
	EM_ASM_(
		{
			const JS__task_id = Module.UTF8ToString($0);
			const JS__req_params_string = Module.UTF8ToString($1);
			const JS__req_params = JSON.parse(JS__req_params_string);
			Module.fromCpp__send_funds__success(JS__task_id, JS__req_params); // Module must implement this!
		},
		task_id.c_str(),
		ret_json_from_root(root).c_str()
	);
	_delete_and_remove_heap_vals_ptr_for(task_id); // having finished
}
//
// From-JS function decls
void emscr_async_bridge::send_funds(const string &args_string)
{
	boost::property_tree::ptree json_root;
	if (!parsed_json_root(args_string, json_root)) {
		// it will already have thrown an exception .. but let's throw another one here (and not try to send an error response bc we dont have a task_id)
		THROW_WALLET_EXCEPTION_IF(false, error::wallet_internal_error, "Invalid JSON");
//		send_app_handler__error(error_ret_json_from_message("Invalid JSON"));
		return;
	}
	auto optl__task_id = json_root.get_optional<string>("task_id");
	THROW_WALLET_EXCEPTION_IF(optl__task_id == none, error::wallet_internal_error, "Code fault: expected task_id (send_funds)");
	const string &task_id = *optl__task_id;
    if (_heap_vals_ptrs_by_task_id.find(task_id) != _heap_vals_ptrs_by_task_id.end()) {
		send_app_handler__error_msg(task_id, "Code fault: existing waiting heap vals container ptr found with that task id");
		return;
    }
	auto from_address_string = json_root.get<string>("from_address_string");
	auto sec_viewKey_string = json_root.get<string>("sec_viewKey_string");
	auto sec_spendKey_string = json_root.get<string>("sec_spendKey_string");
	auto pub_spendKey_string = json_root.get<string>("pub_spendKey_string");
	//
	uint64_t _raw_sending_amount = stoull(json_root.get<string>("sending_amount"));
	auto is_sweeping = json_root.get<bool>("is_sweeping");
	optional<string> unlock_time_string = json_root.get_optional<string>("unlock_time");
	uint64_t unlock_time = 0;
	if (unlock_time_string) {
		unlock_time = stoull(*unlock_time_string);
	}
	auto nettype = nettype_from_string(json_root.get<string>("nettype_string")); 
	//
	uint64_t sending_amount = is_sweeping ? 0 : _raw_sending_amount;
	crypto::secret_key sec_viewKey{};
	crypto::secret_key sec_spendKey{};
	crypto::public_key pub_spendKey{};
	{
		bool r = false;
		r = epee::string_tools::hex_to_pod(sec_viewKey_string, sec_viewKey);
		if (!r) {
			send_app_handler__error_msg(task_id, "Invalid secret view key");
			return;
		}
		r = epee::string_tools::hex_to_pod(sec_spendKey_string, sec_spendKey);
		if (!r) {
			send_app_handler__error_msg(task_id, "Invalid sec spend key");
			return;
		}
		r = epee::string_tools::hex_to_pod(pub_spendKey_string, pub_spendKey);
		if (!r) {
			send_app_handler__error_msg(task_id, "Invalid public spend key");
			return;
		}
	}
	vector<SpendableOutput> unspent_outs; // to be set after getting unspent outs
	vector<SpendableOutput> using_outs; // to be set after step1
	Send_Task_AsyncContext *ptrTo_taskAsyncContext = new Send_Task_AsyncContext{
		task_id,
		//
		from_address_string,
		sec_viewKey_string,
		sec_spendKey_string,
		json_root.get<string>("to_address_string"),
		json_root.get_optional<string>("payment_id_string"),
		sending_amount,
		is_sweeping,
		(uint32_t)stoul(json_root.get<string>("priority")),
		unlock_time,
		nettype,
		//
		unspent_outs, // this gets pushed to after getting unspent outs
		0, // fee_per_b - this gets set after getting unspent outs
		//
		// cached
		sec_viewKey,
		sec_spendKey,
		pub_spendKey,
		//
		// re-entry param initialization/prep
		none, // passedIn_attemptAt_fee
		0, // (re-)construction attempt,
		//
		WAIT_FOR_STEP1,
		//
		// step1 vals init
		none, // final_total_wo_fee
		none, // change_amount
		none, // using_fee
		none, // mixin
		using_outs,
		//
		// step2 vals init
		none, // signed_serialized_tx_string
		none, // tx_hash_string
		none, // tx_key_string
		none // tx_pub_key_string
	};
	// exception will be thrown if oom but JIC, since null ptrs are somehow legal in WASM
	if (!ptrTo_taskAsyncContext) {
		send_app_handler__error_msg(task_id, "Out of memory (heap vals container)");
		return;
	}
	_heap_vals_ptrs_by_task_id[task_id] = ptrTo_taskAsyncContext; // store for later lookup
	//
	send_app_handler__status_update(task_id, fetchingLatestBalance);
	//
	auto req_params = new__req_params__get_unspent_outs(from_address_string, sec_viewKey_string);
	boost::property_tree::ptree req_params_root;
	req_params_root.put("address", req_params.address);
	req_params_root.put("view_key", req_params.view_key);
	req_params_root.put("amount", req_params.amount); 
	req_params_root.put("dust_threshold", req_params.dust_threshold); 
	req_params_root.put("use_dust", req_params.use_dust);
	req_params_root.put("mixin", req_params.mixin);
	stringstream req_params_ss;
	boost::property_tree::write_json(req_params_ss, req_params_root, false/*pretty*/);
	EM_ASM_(
		{
			const JS__task_id = Module.UTF8ToString($0);
			const JS__req_params_string = Module.UTF8ToString($1);
			const JS__req_params = JSON.parse(JS__req_params_string);
			Module.fromCpp__send_funds__get_unspent_outs(JS__task_id, JS__req_params); // Module must implement this!
		},
		task_id.c_str(),
		req_params_ss.str().c_str()
	);
	// now wait for JS to call returning bridged function
}
//
void emscr_async_bridge::send_cb_I__got_unspent_outs(const string &args_string)
{
	boost::property_tree::ptree json_root;
	if (!parsed_json_root(args_string, json_root)) {
		// it will already have thrown an exception .. but let's throw another one here (and not try to send an error response bc we dont have a task_id)
		THROW_WALLET_EXCEPTION_IF(false, error::wallet_internal_error, "Invalid JSON");
//		send_app_handler__error(error_ret_json_from_message("Invalid JSON"));
		return;
	}
	auto optl__task_id = json_root.get_optional<string>("task_id");
	THROW_WALLET_EXCEPTION_IF(optl__task_id == none, error::wallet_internal_error, "Code fault: expected task_id (send_funds)");
	const string &task_id = *optl__task_id;
	//
	auto optl__err_msg = json_root.get_optional<string>("err_msg");
	if (optl__err_msg != none && (*optl__err_msg).size() > 0) { // if args_string actually contains a server error, call error fn with it - this must be done so that the heap alloc'd vals container can be freed
		stringstream err_msg_ss;
		err_msg_ss << "An error occurred while getting your latest balance: " << *(optl__err_msg);
		send_app_handler__error_msg(task_id, err_msg_ss.str());
		return;
	}
	Send_Task_AsyncContext *ptrTo_taskAsyncContext = _heap_vals_ptr_for(task_id);
	if (!ptrTo_taskAsyncContext) { // an error will have been returned already - just bail.
		return;
	}
	//
	auto parsed_res = new__parsed_res__get_unspent_outs(
		json_root.get_child("res"),
		ptrTo_taskAsyncContext->sec_viewKey,
		ptrTo_taskAsyncContext->sec_spendKey,
		ptrTo_taskAsyncContext->pub_spendKey
	);
	if (parsed_res.err_msg != none) {
		send_app_handler__error_msg(task_id, std::move(*(parsed_res.err_msg)));
		return;
	}
	THROW_WALLET_EXCEPTION_IF(ptrTo_taskAsyncContext->unspent_outs.size() != 0, error::wallet_internal_error, "Expected 0 ptrTo_taskAsyncContext->unspent_outs in cb I");
	ptrTo_taskAsyncContext->unspent_outs = std::move(*(parsed_res.unspent_outs)); // move structs from stack's vector to heap's vector
	ptrTo_taskAsyncContext->fee_per_b = *(parsed_res.per_byte_fee); 
	_reenterable_construct_and_send_tx(task_id);
}
void emscr_async_bridge::_reenterable_construct_and_send_tx(const string &task_id)
{
	Send_Task_AsyncContext *ptrTo_taskAsyncContext = _heap_vals_ptr_for(task_id);
	if (!ptrTo_taskAsyncContext) { // an error will have been returned already - just bail.
		return;
	}
	send_app_handler__status_update(task_id, calculatingFee);
	//
	Send_Step1_RetVals step1_retVals;
	monero_transfer_utils::send_step1__prepare_params_for_get_decoys(
		step1_retVals,
		//
		ptrTo_taskAsyncContext->payment_id_string,
		ptrTo_taskAsyncContext->sending_amount,
		ptrTo_taskAsyncContext->is_sweeping,
		ptrTo_taskAsyncContext->simple_priority,
		[] (uint8_t version, int64_t early_blocks) -> bool
		{
			return lightwallet_hardcoded__use_fork_rules(version, early_blocks);
		},
		ptrTo_taskAsyncContext->unspent_outs,
		ptrTo_taskAsyncContext->fee_per_b,
		//
		ptrTo_taskAsyncContext->passedIn_attemptAt_fee // use this for passing step2 "must-reconstruct" return values back in, i.e. re-entry; when none, defaults to attempt at network min
		// ^- and this will be 'none' as initial value
	);
	if (step1_retVals.errCode != noError) {
		send_app_handler__error_code(task_id, step1_retVals.errCode, step1_retVals.spendable_balance, step1_retVals.required_balance);
		return;
	}
	THROW_WALLET_EXCEPTION_IF(ptrTo_taskAsyncContext->valsState != WAIT_FOR_STEP1, error::wallet_internal_error, "Expected valsState of WAIT_FOR_STEP1"); // just for addtl safety
	// now store step1_retVals for step2
	ptrTo_taskAsyncContext->step1_retVals__final_total_wo_fee = step1_retVals.final_total_wo_fee;
	ptrTo_taskAsyncContext->step1_retVals__using_fee = step1_retVals.using_fee;
	ptrTo_taskAsyncContext->step1_retVals__change_amount = step1_retVals.change_amount;
	ptrTo_taskAsyncContext->step1_retVals__mixin = step1_retVals.mixin;
	THROW_WALLET_EXCEPTION_IF(ptrTo_taskAsyncContext->step1_retVals__using_outs.size() != 0, error::wallet_internal_error, "Expected 0 using_outs");
	ptrTo_taskAsyncContext->step1_retVals__using_outs = std::move(step1_retVals.using_outs); // move structs from stack's vector to heap's vector
	ptrTo_taskAsyncContext->valsState = WAIT_FOR_STEP2;
	//
	send_app_handler__status_update(task_id, fetchingDecoyOutputs);
	//
	auto req_params = new__req_params__get_random_outs(ptrTo_taskAsyncContext->step1_retVals__using_outs); // use the one on the heap, since we've moved the one from step1_retVals
	boost::property_tree::ptree req_params_root;
	boost::property_tree::ptree amounts_ptree;
	BOOST_FOREACH(const string &amount_string, req_params.amounts)
	{
		property_tree::ptree amount_child;
		amount_child.put("", amount_string);
		amounts_ptree.push_back(std::make_pair("", amount_child));
	}
	req_params_root.add_child("amounts", amounts_ptree);
	req_params_root.put("count", req_params.count);
	stringstream req_params_ss;
	boost::property_tree::write_json(req_params_ss, req_params_root, false/*pretty*/);
	EM_ASM_(
		{
			const JS__task_id = Module.UTF8ToString($0);
			const JS__req_params_string = Module.UTF8ToString($1);
			const JS__req_params = JSON.parse(JS__req_params_string);
			Module.fromCpp__send_funds__get_random_outs(JS__task_id, JS__req_params); // Module must implement this!
		},
		task_id.c_str(),
		req_params_ss.str().c_str()
	);
}
void emscr_async_bridge::send_cb_II__got_random_outs(const string &args_string)
{
	boost::property_tree::ptree json_root;
	if (!parsed_json_root(args_string, json_root)) {
		// it will already have thrown an exception .. but let's throw another one here (and not try to send an error response bc we dont have a task_id)
		THROW_WALLET_EXCEPTION_IF(false, error::wallet_internal_error, "Invalid JSON");
//		send_app_handler__error(error_ret_json_from_message("Invalid JSON"));
		return;
	}
	auto optl__task_id = json_root.get_optional<string>("task_id");
	THROW_WALLET_EXCEPTION_IF(optl__task_id == none, error::wallet_internal_error, "Code fault: expected task_id (send_funds)");
	const string &task_id = *optl__task_id;
	//
	auto optl__err_msg = json_root.get_optional<string>("err_msg");
	if (optl__err_msg != none && (*optl__err_msg).size() > 0) { // if args_string actually contains a server error, call error fn with it - this must be done so that the heap alloc'd vals container can be freed
		stringstream err_msg_ss;
		err_msg_ss << "An error occurred while getting decoy outputs: " << *(optl__err_msg);
		send_app_handler__error_msg(task_id, err_msg_ss.str());
		return;
	}
	Send_Task_AsyncContext *ptrTo_taskAsyncContext = _heap_vals_ptr_for(task_id);
	if (!ptrTo_taskAsyncContext) { // an error will have been returned already - just bail.
		return;
	}
	auto parsed_res = new__parsed_res__get_random_outs(json_root.get_child("res"));
	if (parsed_res.err_msg != none) {
		send_app_handler__error_msg(task_id, std::move(*(parsed_res.err_msg)));
		return;
	}
	THROW_WALLET_EXCEPTION_IF(ptrTo_taskAsyncContext->step1_retVals__using_outs.size() == 0, error::wallet_internal_error, "Expected non-0 using_outs");
	Send_Step2_RetVals step2_retVals;
	monero_transfer_utils::send_step2__try_create_transaction(
		step2_retVals,
		//
		ptrTo_taskAsyncContext->from_address_string,
		ptrTo_taskAsyncContext->sec_viewKey_string,
		ptrTo_taskAsyncContext->sec_spendKey_string,
		ptrTo_taskAsyncContext->to_address_string,
		ptrTo_taskAsyncContext->payment_id_string,
		*(ptrTo_taskAsyncContext->step1_retVals__final_total_wo_fee),
		*(ptrTo_taskAsyncContext->step1_retVals__change_amount),
		*(ptrTo_taskAsyncContext->step1_retVals__using_fee),
		ptrTo_taskAsyncContext->simple_priority,
		ptrTo_taskAsyncContext->step1_retVals__using_outs,
		ptrTo_taskAsyncContext->fee_per_b,
		*(parsed_res.mix_outs),
		[] (uint8_t version, int64_t early_blocks) -> bool
		{
			return lightwallet_hardcoded__use_fork_rules(version, early_blocks);
		},
		ptrTo_taskAsyncContext->unlock_time,
		ptrTo_taskAsyncContext->nettype
	);
	if (step2_retVals.errCode != noError) {
		send_app_handler__error_code(task_id, step2_retVals.errCode);
		return;
	}
	if (step2_retVals.tx_must_be_reconstructed) {
		// this will update status back to .calculatingFee
		if (ptrTo_taskAsyncContext->constructionAttempt > 15) { // just going to avoid an infinite loop here or particularly long stack
			send_app_handler__error_msg(task_id, "Unable to construct a transaction with sufficient fee for unknown reason.");
			return;
		}
		ptrTo_taskAsyncContext->valsState = WAIT_FOR_STEP1; // must reset this
		//
		ptrTo_taskAsyncContext->constructionAttempt += 1; // increment for re-entry
		ptrTo_taskAsyncContext->passedIn_attemptAt_fee = step2_retVals.fee_actually_needed; // -> reconstruction attempt's step1's passedIn_attemptAt_fee
		// reset step1 vals for correctness: (otherwise we end up, for example, with duplicate outs added)
		ptrTo_taskAsyncContext->step1_retVals__final_total_wo_fee = none;
		ptrTo_taskAsyncContext->step1_retVals__change_amount = none;
		ptrTo_taskAsyncContext->step1_retVals__using_fee = none;
		ptrTo_taskAsyncContext->step1_retVals__mixin = none;
		ptrTo_taskAsyncContext->step1_retVals__using_outs.clear(); // critical!
		// and let's reset step2 just for clarity/explicitness, though we don't expect them to have values yet:
		ptrTo_taskAsyncContext->step2_retVals__signed_serialized_tx_string = none;
		ptrTo_taskAsyncContext->step2_retVals__tx_hash_string = none;
		ptrTo_taskAsyncContext->step2_retVals__tx_key_string = none;
		ptrTo_taskAsyncContext->step2_retVals__tx_pub_key_string = none;
		//
		_reenterable_construct_and_send_tx(task_id);
		return;
	}
	THROW_WALLET_EXCEPTION_IF(ptrTo_taskAsyncContext->valsState != WAIT_FOR_STEP2, error::wallet_internal_error, "Expected valsState of WAIT_FOR_STEP2"); // just for addtl safety
	// move step2 vals onto heap for later:
	ptrTo_taskAsyncContext->step2_retVals__signed_serialized_tx_string = *(step2_retVals.signed_serialized_tx_string);
	ptrTo_taskAsyncContext->step2_retVals__tx_hash_string = *(step2_retVals.tx_hash_string);
	ptrTo_taskAsyncContext->step2_retVals__tx_key_string = *(step2_retVals.tx_key_string);
	ptrTo_taskAsyncContext->step2_retVals__tx_pub_key_string = *(step2_retVals.tx_pub_key_string);
	//
	ptrTo_taskAsyncContext->valsState = WAIT_FOR_FINISH;
	//
	send_app_handler__status_update(task_id, submittingTransaction);
	//
	auto req_params = LightwalletAPI_Req_SubmitRawTx{
		ptrTo_taskAsyncContext->from_address_string,
		ptrTo_taskAsyncContext->sec_viewKey_string,
		*(step2_retVals.signed_serialized_tx_string)
	};
	boost::property_tree::ptree req_params_root;
	boost::property_tree::ptree amounts_ptree;
	req_params_root.put("address", std::move(req_params.address));
	req_params_root.put("view_key", std::move(req_params.view_key));
	req_params_root.put("tx", std::move(req_params.tx));
	stringstream req_params_ss;
	boost::property_tree::write_json(req_params_ss, req_params_root, false/*pretty*/);
	auto req_params_string = req_params_ss.str();
	EM_ASM_(
		{
			const JS__task_id = Module.UTF8ToString($0);
			const JS__req_params_string = Module.UTF8ToString($1);
			const JS__req_params = JSON.parse(JS__req_params_string);
			Module.fromCpp__send_funds__submit_raw_tx(JS__task_id, JS__req_params); // Module must implement this!
		},
		task_id.c_str(),
		req_params_ss.str().c_str()
	);
}
void emscr_async_bridge::send_cb_III__submitted_tx(const string &args_string)
{
	boost::property_tree::ptree json_root;
	if (!parsed_json_root(args_string, json_root)) {
		// it will already have thrown an exception .. but let's throw another one here (and not try to send an error response bc we dont have a task_id)
		THROW_WALLET_EXCEPTION_IF(false, error::wallet_internal_error, "Invalid JSON");
//		send_app_handler__error(error_ret_json_from_message("Invalid JSON"));
		return;
	}
	auto optl__task_id = json_root.get_optional<string>("task_id");
	THROW_WALLET_EXCEPTION_IF(optl__task_id == none, error::wallet_internal_error, "Code fault: expected task_id (send_funds)");
	const string &task_id = *optl__task_id;
	//
	auto optl__err_msg = json_root.get_optional<string>("err_msg");
	if (optl__err_msg != none && (*optl__err_msg).size() > 0) { // if args_string actually contains a server error, call error fn with it - this must be done so that the heap alloc'd vals container can be freed
		stringstream err_msg_ss;
		err_msg_ss << "An error occurred while getting submitting your transaction: " << *(optl__err_msg);
		send_app_handler__error_msg(task_id, err_msg_ss.str());
		return;
	}
	Send_Task_AsyncContext *ptrTo_taskAsyncContext = _heap_vals_ptr_for(task_id);
	if (!ptrTo_taskAsyncContext) { // an error will have been returned already - just bail.
		return;
	}
	THROW_WALLET_EXCEPTION_IF(ptrTo_taskAsyncContext->valsState != WAIT_FOR_FINISH, error::wallet_internal_error, "Expected valsState of WAIT_FOR_FINISH"); // just for addtl safety
	// not actually expecting anything in a success response, so no need to parse it
	//
	SendFunds_Success_RetVals success_retVals;
	success_retVals.used_fee = *(ptrTo_taskAsyncContext->step1_retVals__using_fee); // NOTE: not the same thing as step2_retVals.fee_actually_needed
	success_retVals.total_sent = *(ptrTo_taskAsyncContext->step1_retVals__final_total_wo_fee) + *(ptrTo_taskAsyncContext->step1_retVals__using_fee);
	success_retVals.mixin = *(ptrTo_taskAsyncContext->step1_retVals__mixin);
	{
		optional<string> returning__payment_id = ptrTo_taskAsyncContext->payment_id_string; // separated from submit_raw_tx_fn so that it can be captured w/o capturing all of args
		if (returning__payment_id == none) {
			auto decoded = monero::address_utils::decodedAddress(ptrTo_taskAsyncContext->to_address_string, ptrTo_taskAsyncContext->nettype);
			if (decoded.did_error) { // would be very strange...
				send_app_handler__error_msg(task_id, std::move(*(decoded.err_string)));
				return;
			}
			if (decoded.paymentID_string != none) {
				returning__payment_id = std::move(*(decoded.paymentID_string)); // just preserving this as an original return value - this can probably eventually be removed
			}
		}
		success_retVals.final_payment_id = returning__payment_id;
	}
	success_retVals.signed_serialized_tx_string = *(ptrTo_taskAsyncContext->step2_retVals__signed_serialized_tx_string);
	success_retVals.tx_hash_string = *(ptrTo_taskAsyncContext->step2_retVals__tx_hash_string);
	success_retVals.tx_key_string = *(ptrTo_taskAsyncContext->step2_retVals__tx_key_string);
	success_retVals.tx_pub_key_string = *(ptrTo_taskAsyncContext->step2_retVals__tx_pub_key_string);
	//
	send_app_handler__success(task_id, success_retVals);
}
