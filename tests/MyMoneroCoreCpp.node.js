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
		const args_str = '{"from_address_string":"43zxvpcj5Xv9SEkNXbMCG7LPQStHMpFCQCmkmR4u5nzjWwq5Xkv5VmGgYEsHXg4ja2FGRD5wMWbBVMijDTqmmVqm93wHGkg","sec_viewKey_string":"7bea1907940afdd480eff7c4bcadb478a0fbb626df9e3ed74ae801e18f53e104","sec_spendKey_string":"4e6d43cd03812b803c6f3206689f5fcc910005fc7e91d50d79b0776dbefcd803","to_address_string":"4L6Gcy9TAHqPVPMnqa5cPtJK25tr7maE7LrJe67vzumiCtWwjDBvYnHZr18wFexJpih71Mxsjv8b7EpQftpB9NjPaRYYBm62jmF59EWcj6","sending_amount":"1026830000","change_amount":"0","fee_amount":"2550170000","outputs":[{"amount":"1337000000","public_key":"5f871fe678a9dcba8ef682e8f7362cea200f42696c7dbe03f902ca19173eb147","global_index":"7499194","index":"1","tx_pub_key":"1009aecc5f53f75b0731e0ccb3fd37ba2808a5c645a2a1f56861f121c926e4b5","rct":"50b0100d12c4c8824b3f3a56b97feefa2b0829a3fdeefe19b7d6ebcf7b768450eb4112e86debb0d859da4c0c556c7720c5388eead19863229a3fc610c23093024d8bd6f881687518019c8cd7d61a40f3a7486546df4d318011eacd34f4b17b0f"},{"amount":"710000000","public_key":"4b4c3fcc8ab73628f298dc75fa5976e1812cd21bc77f30bfa6bb2eb6e713d2f7","global_index":"7440663","index":"0","tx_pub_key":"976feee1972bbd05d6ac7d52ccb30614143c31021b3941e28de2cbb1f48a8ddf","rct":"6b560a85f4b5ec7b4ccd4401717b84307e2b03c646340708028a6d97f41790e39f13da5d8ccd642d5693952a3c67b78ff297c8d718051c782b3f37ac6010cc069938fef32ffbe626e18685b7c13c17b53d3077f5bae52742daac2f29b6c9e708"},{"amount":"1000000000","public_key":"14db00825a260f432c9cf1bc52cc65965e76b5519b228bfbfed2ce2c3119e73b","global_index":"7348866","index":"0","tx_pub_key":"e0d953678f4ddbb39fac96a739d3a1e7ffaebf5f2e5f69b6a064567eb3c053f5","rct":"f18df9fc7363f6d92c25716bb18e2428e4712732e2a67f24ae799406e5d1e90f739658d1831a13fd92d30db16a615624897513c795a62d29166756f5d8a4ca0ff3842a5578d04ab559f2440e4f5c9fc2dae4033d49fac5b57048d14a054fcc02"},{"amount":"200000000","public_key":"e92465cd124e98b3741b93d00346374eaf1cf37d3670eb21a595047d0b12accb","global_index":"7460517","index":"0","tx_pub_key":"e6bea5eaaff6beedc54dc5d4d24883fc18537af58425d584dad6d21fa6e1f27f","rct":"9b59ae166065aef95ab4380e0827035ff5ad579a5b11e5bef305af5369e61d4a9b91bfb770cbb9ada6b704d118417724e2b5d8d208c13e4bb3af9a355f00500e48c770addbbc0fd595d0b1edf36b591dd58102b100140146e7d93371b01cce0e"},{"amount":"330000000","public_key":"f628f516cce1408ebfca9bb3a144ca044dd3f2de19711cc42fa4bf296b6761ca","global_index":"7440388","index":"1","tx_pub_key":"d067e192807d4374aa7e8f832a0702b2c6f35fa30a5fae43a9ecddc3fde755d6","rct":"66fafd6d2a1d6e92e30ee7fae132bd24116c325fca4594225fdf6f40cebd39b386ec21d9bd200c6212027e79237ad5fc076caf5c35e625eb2eb10b82debf5900cd9b8805d566e1ae29f69672876921c8a0ce0c7c4d87cf52dbd483403f435c0c"}],"mix_outs":[{"amount":"0","outputs":[{"global_index":"2008348","public_key":"2201de86fc6f84c5dd4e2bbe568e2af013286177eaa35a77039c3abb6e81f79f","rct":"9915a365f1aef17df0f66da5284c6fe900b8ab6f4ae2c3cb94d6f8a8e1d7021d"},{"global_index":"4675965","public_key":"1030b720fd8c8ba31aed445e2223e76f9fba871c7177e0453bde42f075d214ab","rct":"c8d519f3977e8b1cdb85c2784bd951979c58ef9f29b5fb9c43b7b220f01d6a8b"},{"global_index":"6877408","public_key":"a1c800561d7577da8c8c06f6a3e3547c571cef0ca3d7f5d65315f51ee32dda9b","rct":"e317e74305f6614762179707751babd32e497a7a71124e41b451a2cfc7f87630"},{"global_index":"5998369","public_key":"c1fd9609e6c1e3f1abe5ea95dfb5ad524151189ec6cc8d3ba9afd941a49cb247","rct":"8cae33bf56af38e0db8534c792df610703224aa2eeca08ddb3c8bcd1c67de010"},{"global_index":"6963536","public_key":"bfb7422c2aa6574197080ac9fadee90a314d1f7d3954d897ab3fb7ac571c3b8c","rct":"2df1e831307abf1d2174a10fddbd87d1987c6132e2cb704b75c711766ac4412d"},{"global_index":"5750572","public_key":"c76fb222ff7feb121f540c90286b83e745a5ae23881c0484e1038b8286354f75","rct":"1848babed2ec68b9775699a72b676e0d6bda19d899cf184b2812d031e38cfaa3"},{"global_index":"3643726","public_key":"52d18d00da9c433b73a110140aaf3e33931d6d432aa29d1f322c302b22f2f7a1","rct":"93793a2174bc3632d81953b99b49fceabc5e812672e28a2aec69d7be5f1d2c45"},{"global_index":"4220333","public_key":"06c8fff597ecd37c9c46338ac89450ac42364ddbf84f097c3b76b4a613630490","rct":"2138faab8f937f159974bb79c3fc59e81d5058bc2330c8f3a92e624886ab619e"},{"global_index":"2279888","public_key":"e9e0107ba293a41e4b02b1fc3e633868cb44af9338a2a2e752fb11c2fa025030","rct":"8493f51d9b4e75e415045042d42fce7d58606c6e7406d95ee7ae1fef8a7803fc"},{"global_index":"5898235","public_key":"37e964d8e892f8aff423f22c7f7dfab15aa4e625931f8c419f8bf740a4aa88dc","rct":"1345de7b25d5a90fb91c914e063de0fb1a4a7d03354f77d6ff800dcf8c7e3bcd"},{"global_index":"5775104","public_key":"8cf5ad5f5c7cc54a6bc5c3278378fa9571c794b404fce9fc3eb547278c2b84c3","rct":"80e35af2551a916e470d6b706b66a4484f478db4d37463fe1a2f67f61101df0d"}]},{"amount":"0","outputs":[{"global_index":"4777504","public_key":"551eab66241d8813a28b041f143e3b22a0a9f45c2f8f3d1ac881a011c63fa419","rct":"a473788f742d6b96fa0e5146371060da307da87509dcfec2020f2dde2e8eed15"},{"global_index":"5810360","public_key":"94d03655da543f975ecd986fa9457bffca40e1e4e2182e8969dabe01c4368e98","rct":"d3e4befe9fb1e2a72f3853cb5b46a43f283fc3413c665bd657c07bcea442be2b"},{"global_index":"7228216","public_key":"b4453d9ff81b9504259c821643659c83b26dc007443593231260ea25cc30b1bf","rct":"5120a9be2221cb7b6bb4be16c1301a3ed803216440eeab325f3ac620bffd3ad6"},{"global_index":"6678609","public_key":"c2190fe2fa7de7df1fdda3db0efaee4261f05f0dc9fad1045062d0e7028f8a60","rct":"87ed96efd803062c6fd2a68c948849358f4dca04183350581136941b1c041ec8"},{"global_index":"5930987","public_key":"316c1f131d7abd466eda40570a572f880d9dfaf09f54c69eab0536b66fb32127","rct":"dca17ac6ebc72f2f9bfdcb63af58d748fec0ebb2b1de06961d4037b2b30c04a8"},{"global_index":"6878661","public_key":"4b2b3eaa32232c1d8165db8f1715c48eee4ebff5c5ea198ef66f1f90b84e50b0","rct":"af0c66a5a235ae22fb2c7f585df97d00a80dfa8976e9f94007d9a3acb86b0035"},{"global_index":"3419789","public_key":"56647a5252d91d61dc4c39deb72f4d800abf38b51184d7b17459ed113e73bb4c","rct":"f051cf108a7d16996f8ed2ca6ccace10c3967b0063eb1ee0a91c6ca5b044dd37"},{"global_index":"1172060","public_key":"dcc6b7e07b187d14f1abf4b27b8bc6a14c1c60b4a5d73f3ae816316fe8e34bbf","rct":"be462005d935fd6371fd6fe859316b19558a0bd690e35fbec86d0a4f913f4636"},{"global_index":"1745575","public_key":"c66caf7bb52a1fe705d2e547bb1b5e40944c882343165592df00d592264c28a1","rct":"9dc2165e9b0c009f390bccf337d6accc636c0a99df2b9e981fbade0dbc23fbd1"},{"global_index":"2081652","public_key":"4add8946b438a298526b5c95349dbdb4bfb4c8355cb66187aa5f512af929a629","rct":"70b86448e58d30fd3d0d9961a5832ef439affdedf2db127158d849267e014cc4"},{"global_index":"6489925","public_key":"1fc907fb65454d51f1babfe8c262c80fcce3a8f259f4f7f75d1fa73d0a2b9403","rct":"d8a703d248547a4ea44e259a8d3d049828fdc44eb82a35574294dfbfe35937fd"}]},{"amount":"0","outputs":[{"global_index":"6214923","public_key":"cc11f6f8bfea1e28f5b4ce3860227a864cb813ecf435688dd00e8ecf676f0f09","rct":"9cc9a7454bb4bc418bf36bbdd54b97e188edf951ce6207876d61c21f17489619"},{"global_index":"1328670","public_key":"25b421cb82972f25d7ad8560a4f3f533b76b9d5072b6bbed7328f16c2f85c352","rct":"872129761186624d78ca72cf82b101d6c2456b2a5278c6b812f53ff3544be7fe"},{"global_index":"4914085","public_key":"5a53a5b77cfb81cef4136c7285b2151879aa6996e6131f43aadb517739b3fde7","rct":"3f9fcf77f2b0ae5e548390e1d470a3638860c18cb590a7d38e4887d5dea7ebef"},{"global_index":"7445606","public_key":"eab8a3418dccc5a9f3ead65f435d70f09e30e932952e3c8517c848ed5f60da43","rct":"a2b65083f6cec0ee69fe3b4c6219e3fc2356c255ac25b88ac453578787b9e3f2"},{"global_index":"3198574","public_key":"b975911a26d858e3e234eba195f6517d9ed41981dafccc2335b76b90904eb025","rct":"98e76b6f59658b6e2bd2e2cbc887947a3824cf0f09cdc9cc7d9b5b68369ea8d5"},{"global_index":"4523381","public_key":"ee65c559d0683740e3e8cf11f018a0a403ecd7ad25d4f7f838540ebcedaa8d36","rct":"6f713ced92c74206cf80b528925e136a491ab430c01bc99c9b22a2b4f387ad99"},{"global_index":"6229403","public_key":"618beb7b5eb3f30a3a762059c8a2ec4e5cabda2d360b7c0717a9f59ff593dbc7","rct":"dc850d343d14a583d0477fd2177910abf941f0c8c9c97872252534a585dbd8e7"},{"global_index":"7229079","public_key":"702c8b9bae52d09db819f9ab322e5d94efa1f8b4650145223e1f4dfea8c4d044","rct":"0e753168f14bd4eb3ae9ce62364475144e3f1c5f8f40cda457382c8806f66c07"},{"global_index":"6947375","public_key":"10e3d357ffab00714288397760e457c71566f7efec50ad5182e748c734042560","rct":"53ee543e543c0f5b89443f822ebfc304cc322969b66600c9d1275135df604180"},{"global_index":"2101166","public_key":"52ef37b847b0e1328a74bdce33d76752efa7daf3614c79af56c9d4cd9ae567a9","rct":"85e226b6a624962c7037454b635e80b76ad50d445925837bd8547f68d8d1f2c3"},{"global_index":"6171489","public_key":"d57798d8a2806e87e758f0137f4ba5f9ec9a64c476653d26c8d0c3b218fc11d6","rct":"77b0f5d801f40bdd9e1f88331aa5142b645513aa48b0a8caa3ccbd236d4f31c4"}]},{"amount":"0","outputs":[{"global_index":"2375716","public_key":"cf79979677e6ed2265f1b46359069c82578fcdfc6ee0cc665f97e70ac74b567a","rct":"6deb0efbe38f6eea287fae5ed60774a66d5e3b5fbdfa132a008207f5cea5c6b8"},{"global_index":"7216407","public_key":"f2fb3ae14065575a1bd6d11d4eaee1a417112540266cdbe44ffbe5d8f88824f9","rct":"53a2657171991aca2cc0e08d7f3a143fb95e843055da72d6e5253b52ad4920e4"},{"global_index":"3688347","public_key":"11161af80c79c30ec07613b09453f369353d49f8ab512223e5d40f4793eaf9e6","rct":"3d79304eefa84887b314d091af954aac744cf44f502e6999d28950de12eeec65"},{"global_index":"5381115","public_key":"27124e710d101105562badbe26aeca9b349befdaae364d7f7c443a96dee769d2","rct":"dfb3748055732409e83d3ba98f244f03d62c2fb07aa85fe56c78778880641ecd"},{"global_index":"5849624","public_key":"538b4390cfeca78a3c7c3c03f716333c6427df614c62a4453ed840bfc30c8aa0","rct":"f6609499b101c4fd5c3ea9ed7daf549d5de2c1a64e0a665622a63ec23ea886b0"},{"global_index":"7001964","public_key":"fd87638b2848f03f90ddd5a95677f0a8885054710fec9849cf619d9dbc5ad05d","rct":"07ce2fb940510f524723426f4eeeaf6dbe887e5c3c841d26ff8ee86a966a8847"},{"global_index":"3377771","public_key":"26bf23cb1bd3fbc8d10267bb54e745af9dcf285681dc398fff936a3e561bc1a9","rct":"0523717142ccdd5b995b3c6343cc0a583bf3921d932ae8083cc9db461371faa3"},{"global_index":"6864099","public_key":"46b77ff917fd773cfd45e59904936d01186e668318c4235d3bbaee579f83a4c5","rct":"574e599281da561dda5fb7a3738df6607526040dcee5459e4527ac73fb8e7952"},{"global_index":"6061595","public_key":"c99851d61f3988f356b27da5a2181d7d1525c5a531def459ca59fbad9c1308b0","rct":"f198d9c157135c9bfe4f768e8019d840721c7289aab9644e8420e20425af40e3"},{"global_index":"6687536","public_key":"c3e158bf61668c16a865e195c4d696aea6ca55cb8c7a758eb3185d7ebb91df46","rct":"841634159affe8b19e3322f92c14947f56321c7e0bf35bf8ef2778306230f436"},{"global_index":"5061251","public_key":"e904cdd6ba631dd6ef5fac4bf13fbf749827fed292f4eb1f4157e083d27bfcb8","rct":"f6816982fe7d9706306cb0d6a64e8d781e69ada7123a08a3ddeeca0c348eb31d"}]},{"amount":"0","outputs":[{"global_index":"2048242","public_key":"a837885a5c39d4818348a217ab20a1e1f618ae37e409ea0e3ce650eb664fd413","rct":"692af989ed618214810ca85862a063a78b34b0aef48b9f3363e3a86cce59d2c6"},{"global_index":"1874150","public_key":"2bb042502cc97af6bfa976f2b645057f38e8947ce46e39cb9bb03b4369e14fda","rct":"53461aee1f03caa4fb9fd14dc02ee8f9c4a6db21091e5bd22558de25b00f5670"},{"global_index":"6264861","public_key":"c70cc78002c79d1e487241c91aff84368aa4a86e2fd386515c28bdb052a869f6","rct":"e97c720f2e93ac0295c29b8afd93ff0d8393256d7cc0712c1dd7607834ee37d7"},{"global_index":"6265451","public_key":"b4d22c6c88b8cce891d6d8da8ce9644c511816cd3ed0b568052e6ac3e5295901","rct":"802db8458a0ce742c7cbc95c3b394eaba97808972e880ae0013e8c630c6bbded"},{"global_index":"5370210","public_key":"7de76b2a8354cb28f7ab5a1a7ca92a2d898a614497c2e6af44707a96682082fe","rct":"d3bdac8c8ddf99f1ecdb22d1525a340e39d52152cc0f8cc438453f7eec9b0923"},{"global_index":"1633337","public_key":"4f31d7517a222eed18acf0293cfe8fd5fda904fa004a192ce5408607d45c68fa","rct":"a86e74327f85c22819c8193c3bb243d44bd587ad9f21ba83c983f11d1173f7b4"},{"global_index":"4501905","public_key":"c4f982e85f25d9ad188ac402eeeea4d276f23466a12ed7bca62056e74002069f","rct":"250efc1d17459ca2866e1008c8a778e3f7b34f7d96e474804b5e8dba237ea3cd"},{"global_index":"5618779","public_key":"92a251a0cbdb7d119330bf1dc60e6125c0f1a673575122c85109d58b1101f76b","rct":"6db75e625e424d28bf2c679d55ab80110f08f1399ecf5f4d5cd9e1de06024db7"},{"global_index":"7471222","public_key":"31ba479a1b87fcf907a4823b7a3afada89dc7a6b1c66360be394a386cafb62e2","rct":"06c7c30f0a5e7b0a1dfc72b74665c9b07d1ad73afbb26bf76c591122385df086"},{"global_index":"4385834","public_key":"6d49d03004d604ee5536afe392cb51ba53e335f129bc7ba81ae8fe8887afdaca","rct":"573ec846350d7dd5db40c4e4428d31918913170ae19e9cc40c55e95a33d79034"},{"global_index":"4658749","public_key":"9d61a4f7832765aff2cf083c65102a9001fda2a0620f38b3baf9fb3e5161a910","rct":"bd73c12b4ed1bb28bef18f0f79415f9f7321a6bcee6488e6426f840a991866d7"}]}],"unlock_time":"0","nettype_string":"MAINNET","payment_id_string":"d2f602b240fbe624"}'
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
		const args_str = '{"n_inputs":"2","mixin":"6","n_outputs":"2","extra_size":"0","bulletproof":"true"}'
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