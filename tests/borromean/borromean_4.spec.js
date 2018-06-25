const monero_utils = require("../../").monero_utils;
const { generate_parameters } = require("./test_parameters");
const { indi, P1v, P2v, xv, N } = generate_parameters();

it("borromean_4", () => {
	// #false one
	const bb = monero_utils.genBorromean(xv, [P2v, P1v], indi, 2, N); /*?.*/
	const valid = monero_utils.verifyBorromean(bb, P1v, P2v); /*?.*/
	expect(valid).toBe(false);
});
