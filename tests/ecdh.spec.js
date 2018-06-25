const JSBigInt = require("../cryptonote_utils/biginteger").BigInteger;
const monero_utils = require("../").monero_utils;

it("ecdh_roundtrip", () => {
	const test_amounts = [
		new JSBigInt(1),
		new JSBigInt(1),
		new JSBigInt(2),
		new JSBigInt(3),
		new JSBigInt(4),
		new JSBigInt(5),
		new JSBigInt(10000),

		new JSBigInt("10000000000000000000"),
		new JSBigInt("10203040506070809000"),

		new JSBigInt("123456789123456789"),
	];

	for (const amount of test_amounts) {
		const k = monero_utils.skGen();
		const scalar = monero_utils.skGen(); /*?*/
		const amt = monero_utils.d2s(amount.toString());
		const t0 = {
			mask: scalar,
			amount: amt,
		};

		// both are strings so we can shallow copy
		let t1 = { ...t0 };

		t1 = monero_utils.encode_rct_ecdh(t1, k);

		t1 = monero_utils.decode_rct_ecdh(t1, k);
		expect(t1.mask).toEqual(t0.mask);
		expect(t1.amount).toEqual(t0.amount);
	}
});
