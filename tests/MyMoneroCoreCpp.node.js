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

"use strict";
//
function tests(Module)
{
	console.log("Module", Module)
	//
	{
		console.time("send_step1__prepare_params_for_get_decoys")
		const args_str = '{"is_sweeping":"false","payment_id_string":"d2f602b240fbe624","sending_amount":"200000000","fee_per_b":"24658","priority":"1","unspent_outs":[{"amount":"3000000000","public_key":"41be1978f58cabf69a9bed5b6cb3c8d588621ef9b67602328da42a213ee42271","index":"1","global_index":"7611174","rct":"86a2c9f1f8e66848cd99bfda7a14d4ac6c3525d06947e21e4e55fe42a368507eb5b234ccdd70beca8b1fc8de4f2ceb1374e0f1fd8810849e7f11316c2cc063060008ffa5ac9827b776993468df21af8c963d12148622354f950cbe1369a92a0c","tx_id":"5334971","tx_hash":"9d37c7fdeab91abfd1e7e120f5c49eac17b7ac04a97a0c93b51c172115df21ea","tx_pub_key":"bd703d7f37995cc7071fb4d2929594b5e2a4c27d2b7c68a9064500ca7bc638b8"}]}'
		const ret_string = Module.send_step1__prepare_params_for_get_decoys(args_str)
		console.log("send_step1__prepare_params_for_get_decoys ret", ret_string)
		console.timeEnd("send_step1__prepare_params_for_get_decoys")
	}
	{
		console.time("send_step2__try_create_transaction")
		const args_str = '{"final_total_wo_fee":"200000000","change_amount":"2733719296","fee_amount":"66280704","using_outs":[{"amount":"3000000000","public_key":"41be1978f58cabf69a9bed5b6cb3c8d588621ef9b67602328da42a213ee42271","rct":"86a2c9f1f8e66848cd99bfda7a14d4ac6c3525d06947e21e4e55fe42a368507eb5b234ccdd70beca8b1fc8de4f2ceb1374e0f1fd8810849e7f11316c2cc063060008ffa5ac9827b776993468df21af8c963d12148622354f950cbe1369a92a0c","global_index":"7611174","index":"1","tx_pub_key":"bd703d7f37995cc7071fb4d2929594b5e2a4c27d2b7c68a9064500ca7bc638b8"}],"payment_id_string":"d2f602b240fbe624","nettype_string":"MAINNET","to_address_string":"4APbcAKxZ2KPVPMnqa5cPtJK25tr7maE7LrJe67vzumiCtWwjDBvYnHZr18wFexJpih71Mxsjv8b7EpQftpB9NjPPXmZxHN","from_address_string":"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg","sec_viewKey_string":"7bea1907940afdd480eff7c4bcadb478a0fbb626df9e3ed74ae801e18f53e104","sec_spendKey_string":"4e6d43cd03812b803c6f3206689f5fcc910005fc7e91d50d79b0776dbefcd803","fee_per_b":"24658","unlock_time":"0","priority":"1","mix_outs":[{"amount":"0","outputs":[{"global_index":"7453099","public_key":"31f3a7fec0f6f09067e826b6c2904fd4b1684d7893dcf08c5b5d22e317e148bb","rct":"ea6bcb193a25ce2787dd6abaaeef1ee0c924b323c6a5873db1406261e86145fc"},{"global_index":"7500097","public_key":"f9d923500671da05a1bf44b932b872f0c4a3c88e6b3d4bf774c8be915e25f42b","rct":"dcae4267a6c382bcd71fd1af4d2cbceb3749d576d7a3acc473dd579ea9231a52"},{"global_index":"7548483","public_key":"839cbbb73685654b93e824c4843e745e8d5f7742e83494932307bf300641c480","rct":"aa99d492f1d6f1b20dcd95b8fff8f67a219043d0d94b4551759016b4888573e7"},{"global_index":"7554755","public_key":"b8860f0697988c8cefd7b4285fbb8bec463f136c2b9a9cadb3e57cebee10717f","rct":"327f9b07bee9c4c25b5a990123cd2444228e5704ebe32016cd632866710279b5"},{"global_index":"7561477","public_key":"561d734cb90bc4a64d49d37f85ea85575243e2ed749a3d6dcb4d27aa6bec6e88","rct":"b5393e038df95b94bfda62b44a29141cac9e356127270af97193460d51949841"},{"global_index":"7567062","public_key":"db1024ef67e7e73608ef8afab62f49e2402c8da3dc3197008e3ba720ad3c94a8","rct":"1fedf95621881b77f823a70aa83ece26aef62974976d2b8cd87ed4862a4ec92c"},{"global_index":"7567508","public_key":"6283f3cd2f050bba90276443fe04f6076ad2ad46a515bf07b84d424a3ba43d27","rct":"10e16bb8a8b7b0c8a4b193467b010976b962809c9f3e6c047335dba09daa351f"},{"global_index":"7568716","public_key":"7a7deb4eef81c1f5ce9cbd0552891cb19f1014a03a5863d549630824c7c7c0d3","rct":"735d059dc3526334ac705ddc44c4316bb8805d2426dcea9544cde50cf6c7a850"},{"global_index":"7571196","public_key":"535208e354cae530ed7ce752935e555d630cf2edd7f91525024ed9c332b2a347","rct":"c3cf838faa14e993536c5581ca582fb0d96b70f713cf88f7f15c89336e5853ec"},{"global_index":"7571333","public_key":"e73f27b7eb001aa7eac13df82814cda65b42ceeb6ef36227c25d5cbf82f6a5e4","rct":"5f45f33c6800cdae202b37abe6d87b53d6873e7b30f3527161f44fa8db3104b6"},{"global_index":"7571335","public_key":"fce982db8e7a6b71a1e632c7de8c5cbf54e8bacdfbf250f1ffc2a8d2f7055ce3","rct":"407bdcc48e70eb3ef2cc22cefee6c6b5a3c59fd17bde12fda5f1a44a0fb39d14"}]}]}'
		const ret_string = Module.send_step2__try_create_transaction(args_str)
		console.log("send_step2__try_create_transaction ret", ret_string)
		console.timeEnd("send_step2__try_create_transaction")
	}
	{
		console.time("decode_address")
		const args =
		{
			"address": "43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg",
			"nettype_string": "MAINNET"
		}
		const ret_string = Module.decode_address(JSON.stringify(args))
		console.timeEnd("decode_address")
		console.log("decode_address ret", ret_string)
	}
	{
		console.time("is_subaddress")
		const args_str = '{"nettype_string":"MAINNET","address":"4L6Gcy9TAHqPVPMnqa5cPtJK25tr7maE7LrJe67vzumiCtWwjDBvYnHZr18wFexJpih71Mxsjv8b7EpQftpB9NjPaL41VrjstLM5WevLZx"}'
		const ret_string = Module.is_subaddress(args_str)
		console.timeEnd("is_subaddress")
		console.log("is_subaddress ret", ret_string)
	}
	{
		console.time("is_integrated_address")
		const args_str = '{"nettype_string":"MAINNET","address":"4L6Gcy9TAHqPVPMnqa5cPtJK25tr7maE7LrJe67vzumiCtWwjDBvYnHZr18wFexJpih71Mxsjv8b7EpQftpB9NjPaL41VrjstLM5WevLZx"}'
		const ret_string = Module.is_integrated_address(args_str)
		console.timeEnd("is_integrated_address")
		console.log("is_integrated_address ret", ret_string)
	}
	{
		console.time("new_integrated_address")
		const args_str = '{"nettype_string":"MAINNET","address":"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg","short_pid":"b79f8efc81f58f67"}'
		const ret_string = Module.new_integrated_address(args_str)
		console.timeEnd("new_integrated_address")
		console.log("new_integrated_address ret", ret_string)
	}
	{
		console.time("new_payment_id")
		const args_str = '{}'
		const ret_string = Module.new_payment_id(args_str)
		console.timeEnd("new_payment_id")
		console.log("new_payment_id ret", ret_string)
	}
	{
		console.time("newly_created_wallet")
		const args_str = '{"nettype_string":"MAINNET","locale_language_code":"en-US"}'
		const ret_string = Module.newly_created_wallet(args_str)
		console.timeEnd("newly_created_wallet")
		console.log("newly_created_wallet ret", ret_string)
	}
	{
		console.time("are_equal_mnemonics")
		const args_str = '{"a":"foxe selfish hum nexus juven dodeg pepp ember biscuti elap jazz vibrate biscui","b":"fox sel hum nex juv dod pep emb bis ela jaz vib bis"}'
		const ret_string = Module.are_equal_mnemonics(args_str)
		console.timeEnd("are_equal_mnemonics")
		console.log("are_equal_mnemonics ret", ret_string)
	}
	{
		console.time("mnemonic_from_seed")
		const args_str = '{"seed_string":"9c973aa296b79bbf452781dd3d32ad7f","wordset_name":"English"}'
		const ret_string = Module.mnemonic_from_seed(args_str)
		console.timeEnd("mnemonic_from_seed")
		console.log("mnemonic_from_seed ret", ret_string)
	}
	{
		console.time("seed_and_keys_from_mnemonic")
		const args_str = '{"mnemonic_string":"foxe selfish hum nexus juven dodeg pepp ember biscuti elap jazz vibrate biscui","nettype_string":"MAINNET"}'
		const ret_string = Module.seed_and_keys_from_mnemonic(args_str)
		console.timeEnd("seed_and_keys_from_mnemonic")
		console.log("seed_and_keys_from_mnemonic ret", ret_string)
	}
	{
		console.time("validate_components_for_login w seed")
		const args_str = '{"address_string":"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg","sec_viewKey_string":"7bea1907940afdd480eff7c4bcadb478a0fbb626df9e3ed74ae801e18f53e104","sec_spendKey_string":"4e6d43cd03812b803c6f3206689f5fcc910005fc7e91d50d79b0776dbefcd803","seed_string":"9c973aa296b79bbf452781dd3d32ad7f","nettype_string":"MAINNET"}'
		const ret_string = Module.validate_components_for_login(args_str)
		console.timeEnd("validate_components_for_login w seed")
		console.log("validate_components_for_login w seed ret", ret_string)
	}
	{
		console.time("validate_components_for_login w both keys")
		const args_str = '{"address_string":"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg","sec_viewKey_string":"7bea1907940afdd480eff7c4bcadb478a0fbb626df9e3ed74ae801e18f53e104","sec_spendKey_string":"4e6d43cd03812b803c6f3206689f5fcc910005fc7e91d50d79b0776dbefcd803","nettype_string":"MAINNET"}'
		const ret_string = Module.validate_components_for_login(args_str)
		console.timeEnd("validate_components_for_login w both keys")
		console.log("validate_components_for_login w both keys ret", ret_string)
	}
	{
		console.time("validate_components_for_login view only")
		const args_str = '{"address_string":"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg","sec_viewKey_string":"7bea1907940afdd480eff7c4bcadb478a0fbb626df9e3ed74ae801e18f53e104","nettype_string":"MAINNET"}'
		const ret_string = Module.validate_components_for_login(args_str)
		console.timeEnd("validate_components_for_login view only")
		console.log("validate_components_for_login view only ret", ret_string)
	}
	{
		console.time("address_and_keys_from_seed")
		const args_str = '{"seed_string":"9c973aa296b79bbf452781dd3d32ad7f","nettype_string":"MAINNET"}'
		const ret_string = Module.address_and_keys_from_seed(args_str)
		console.timeEnd("address_and_keys_from_seed")
		console.log("address_and_keys_from_seed ret", ret_string)
	}
	{
		console.time("estimated_tx_network_fee")
		const args_str = '{"fee_per_b":"24658","priority":"1"}'
		const ret_string = Module.estimated_tx_network_fee(args_str)
		console.timeEnd("estimated_tx_network_fee")
		console.log("estimated_tx_network_fee ret", ret_string)
	}
	{
		console.time("generate_key_image")
		const args_str = '{"sec_viewKey_string":"7bea1907940afdd480eff7c4bcadb478a0fbb626df9e3ed74ae801e18f53e104","sec_spendKey_string":"4e6d43cd03812b803c6f3206689f5fcc910005fc7e91d50d79b0776dbefcd803","pub_spendKey_string":"3eb884d3440d71326e27cc07a861b873e72abd339feb654660c36a008a0028b3","tx_pub_key":"fc7f85bf64c6e4f6aa612dbc8ddb1bb77a9283656e9c2b9e777c9519798622b2","out_index":"0"}'
		const ret_string = Module.generate_key_image(args_str)
		console.timeEnd("generate_key_image")
		console.log("generate_key_image ret", ret_string)
	}
	{
		console.time("generate_key_derivation")
		const args_str = '{"pub":"904e49462268d771cc1649084c35aa1296bfb214880fe2e7f373620a3e2ba597","sec":"52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d"}'
		const ret_string = Module.generate_key_derivation(args_str)
		console.timeEnd("generate_key_derivation")
		console.log("generate_key_derivation ret", ret_string)
	}
	{
		console.time("derive_public_key")
		const args_str = '{"derivation":"591c749f1868c58f37ec3d2a9d2f08e7f98417ac4f8131e3a57c1fd71273ad00","out_index":"1","pub":"904e49462268d771cc1649084c35aa1296bfb214880fe2e7f373620a3e2ba597"}'
		const ret_string = Module.derive_public_key(args_str)
		console.timeEnd("derive_public_key")
		console.log("derive_public_key ret", ret_string)
	}
	{
		console.time("derive_subaddress_public_key")
		const args_str = '{"derivation":"591c749f1868c58f37ec3d2a9d2f08e7f98417ac4f8131e3a57c1fd71273ad00","out_index":"1","output_key":"904e49462268d771cc1649084c35aa1296bfb214880fe2e7f373620a3e2ba597"}'
		const ret_string = Module.derive_subaddress_public_key(args_str)
		console.timeEnd("derive_subaddress_public_key")
		console.log("derive_subaddress_public_key ret", ret_string)
	}
	{
		console.time("decodeRct")
		const args_str = '{"i":"1","sk":"9b1529acb638f497d05677d7505d354b4ba6bc95484008f6362f93160ef3e503","rv":{"type":"1","ecdhInfo":[{"mask":"3ad9d0b3398691b94558e0f750e07e5e0d7d12411cd70b3841159e6c6b10db02","amount":"b3189d8adb5a26568e497eb8e376a7d7d946ebb1daef4c2c87a2c30b65915506"},{"mask":"97b00af8ecba3cb71b9660cc9e1ac110abd21a4c5e50a2c125f964caa96bef0c","amount":"60269d8adb5a26568e497eb8e376a7d7d946ebb1daef4c2c87a2c30b65915506"},{"mask":"db67f5066d9455db404aeaf435ad948bc9f27344bc743e3a32583a9e6695cb08","amount":"b3189d8adb5a26568e497eb8e376a7d7d946ebb1daef4c2c87a2c30b65915506"}],"outPk":[{"mask":"9adc531a9c79a49a4257f24e5e5ea49c2fc1fb4eef49e00d5e5aba6cb6963a7d"},{"mask":"89f40499d6786a4027a24d6674d0940146fd12d8bc6007d338f19f05040e7a41"},{"mask":"f413d28bd5ffdc020528bcb2c19919d7484fbc9c3dd30de34ecff5b8a904e7f6"}]}}'
		const ret_string = Module.decodeRct(args_str)
		console.timeEnd("decodeRct")
		console.log("decodeRct ret", ret_string)
	}
	{
		console.time("derivation_to_scalar")
		const args_str = '{"derivation":"7a4c13a037d4bd2a7dd99a8c24669e9e04ca4e8a90e5b6703e88e87ad51c1849","output_index":1}'
		const ret_string = Module.derivation_to_scalar(args_str)
		console.timeEnd("derivation_to_scalar")
		console.log("derivation_to_scalar ret", ret_string)
	}
}
console.time("Load module")
require('../monero_utils/MyMoneroCoreBridge')({asmjs: false}).then(function(instance) // this can be switched to manually test asmjs vs wasm - can be exposed to option
{	
	console.timeEnd("Load module")
	console.log("Loaded instance:", instance)
	tests(instance.Module)
}).catch(function(e)
{
	console.error("Exception while loading module:", e)
})