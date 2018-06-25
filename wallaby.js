module.exports = function(wallaby) {
	process.env.NODE_ENV = "development";

	return {
		name: "mymonero-core-js",
		files: [
			"cryptonote_utils/**/*.js",
			"hostAPI/**/*.js",
			"monero_utils/**/*.js",
			"index.js",
			"tests/borromean/test_parameters.js",
		],

		filesWithNoCoverageCalculated: [
			"cryptonote_utils/nacl-fast-cn.js",
			"cryptonote_utils/biginteger.js",
			"cryptonote_utils/sha3.js",
			"cryptonote_utils/cryptonote_crypto_EMSCRIPTEN.js",
		],

		tests: ["./tests/**/*spec.js"],

		testFramework: "jest",

		env: { type: "node", runner: "node" },
	};
};
