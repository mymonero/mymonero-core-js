const monero_utils = require("../../").monero_utils;
const { generate_parameters } = require("./test_parameters");
const { indi, P1v, P2v, xv, N } = generate_parameters();

it("borromean_3", () => {
	//#true one again
	indi[3] = `${(+indi[3] + 1) % 2}`;
	indi[3] = `${(+indi[3] + 1) % 2}`;

	const bb = monero_utils.genBorromean(xv, [P1v, P2v], indi, 2, N); /*?.*/
	const valid = monero_utils.verifyBorromean(bb, P1v, P2v); /*?.*/
	expect(valid).toBe(true);
});
