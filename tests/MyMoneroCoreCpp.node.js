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
console.time("Load module")
async function tests()
{
	const monero_utils = await require("../monero_utils/monero_utils")

	const Module = monero_utils.Module;

	console.timeEnd("Load module")

	console.log("Module", Module)
	//
	{
		console.time("create_transaction")
		const args_str = '{"nettype_string":"MAINNET","from_address_string":"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg","sec_viewKey_string":"7bea1907940afdd480eff7c4bcadb478a0fbb626df9e3ed74ae801e18f53e104","sec_spendKey_string":"4e6d43cd03812b803c6f3206689f5fcc910005fc7e91d50d79b0776dbefcd803","to_address_string":"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg","payment_id_string":"b79f8efc81f58f67","unlock_time":"0","sending_amount":"10000000000","change_amount":"112832250000","fee_amount":"2167750000","outputs":[{"amount":"125000000000","public_key":"596fa47b6b3905269503435099a05e3ede54564026c93cbe5285e2df074c7118","rct":"920ee8d99299f304d17fdb104720d1f62be0b03383c7bb466ff39c6a264d80d616ce1eccd6c4de1cc0fba87e463f2e0c373146c475e8a1517f36e7a37351d50034688cc8cb528c14188cae45d89b313d444e583c9d68a32cb80938a5e2aa200b","global_index":"6451664","index":"0","tx_pub_key":"0a86e588dc67ca11993737e003a9e60c57174a663a47495e3b1d764f486fc88f"}],"mix_outs":[{"amount":"0","outputs":[{"global_index":"5260585","public_key":"da77082624fce921891c4fb80a1e7076a6714ca8c9fc547311737926a0b85a46","rct":"bb227b27e36b7f3e695dffb641c29bb60bfd991accdb5ef4b580c9acd48c16b6"},{"global_index":"1929918","public_key":"8c983e7053d7a1dc9de8ac00468bcf11836a787d712dc0c02bd54a3ee00a55e8","rct":"8dec45867644d1a76aafe4487292d7cf401302e6bbbb99a61c2f3b6cef4f4f34"},{"global_index":"3921094","public_key":"0133219bd5e247eef51003921ec792784c41fc34289c703e9326d46f78d9b10a","rct":"75082f4ce31904acba4af37699c28d8d4f0f74fdf63b1e4a8069ebed50df3220"},{"global_index":"6627106","public_key":"daef1663dd1084bd7fe585c3d493480ee1c4cefb93254eac5855afdf38f662b1","rct":"1d96763c5bc3300090c286705b7d544f02c185d9be8c32baac6bbfb8e0d0d283"},{"global_index":"3308654","public_key":"ae135f58762b1133667002538f8c353a1869db815aa686e2544b5243c2d2212f","rct":"15046b93bb181189f2917eed38173202fbbb9cdbfcf3d1bc3e432df999ae1b1c"},{"global_index":"1972531","public_key":"39e44fa88d684d71762c40eb64ac80ddc694b74a99ac445667bf433536c09c8f","rct":"66a42d0e8123768b392ad4a230759258d9156fab1aea00a19b041832326aca0a"},{"global_index":"3274424","public_key":"a89b91648645ba6f32e214ba5720f5387376e5a144e698d5d5d1ebac971de349","rct":"815a6b1da6fc6a3bd791c4342782381cf948ee822ac9da7149f1b3717e0266d2"}]}]}'
		const ret_string = Module.create_transaction(args_str)
		console.log("create_transaction ret", ret_string)
		console.timeEnd("create_transaction")
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
		console.time("new_fake_address_for_rct_tx")
		const args_str = '{"nettype_string":"MAINNET"}'
		const ret_string = Module.new_fake_address_for_rct_tx(args_str)
		console.timeEnd("new_fake_address_for_rct_tx")
		console.log("new_fake_address_for_rct_tx ret", ret_string)
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
		console.time("estimate_rct_tx_size")
		const args_str = '{"n_inputs":"2","mixin":"6","n_outputs":"2","extra_size":"0","bulletproof":"false"}'
		const ret_string = Module.estimate_rct_tx_size(args_str)
		console.timeEnd("estimate_rct_tx_size")
		console.log("estimate_rct_tx_size ret", ret_string)
	}
	{
		console.time("calculate_fee")
		const args_str = '{"fee_per_kb":"9000000","num_bytes":"13762","fee_multiplier":"4"}'
		const ret_string = Module.calculate_fee(args_str)
		console.timeEnd("calculate_fee")
		console.log("calculate_fee ret", ret_string)
	}
	{
		console.time("estimated_tx_network_fee")
		const args_str = '{"fee_per_kb":"9000000","priority":"2"}'
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
}
tests()