"use strict"
const mymonero = require('mymonero-core-js');
const assert = require('assert');

var public_key = "904e49462268d771cc1649084c35aa1296bfb214880fe2e7f373620a3e2ba597";
var private_key = "52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d";

var nettype = mymonero.nettype_utils.network_type.MAINNNET;

describe('cryptonote_utils tests', function() {
	
	it('is valid hex', function() {
		var valid = mymonero.monero_utils.valid_hex(private_key);
		assert.strictEqual(valid, true);
	});
	
	it('fast hash / keccak-256', function() {
		var hash = mymonero.monero_utils.cn_fast_hash(private_key , private_key.length);
		assert.equal(hash, "64997ff54f0d82ee87d51e971a0329d4315481eaeb4ad2403c65d5843480c414");
	});
	
	it('generate key derivation', function() {
		var derivation = mymonero.monero_utils.generate_key_derivation(public_key, private_key);
		assert.equal(derivation, "591c749f1868c58f37ec3d2a9d2f08e7f98417ac4f8131e3a57c1fd71273ad00");
	});
	
	it('decode mainnet primary address', function() {
		var decoded = mymonero.monero_utils.decode_address("49qwWM9y7j1fvaBK684Y5sMbN8MZ3XwDLcSaqcKwjh5W9kn9qFigPBNBwzdq6TCAm2gKxQWrdZuEZQBMjQodi9cNRHuCbTr", nettype);
		var expected = { spend: "d8f1e81ecbe25ce8b596d426fb02fe7b1d4bb8d14c06b3d3e371a60eeea99534", view: "576f0e61e250d941746ed147f602b5eb1ea250ca385b028a935e166e18f74bd7" }
		assert.deepEqual(decoded, expected);
	});
	
	it('decode mainnet integrated address', function() {
		var decoded = mymonero.monero_utils.decode_address("4KYcX9yTizXfvaBK684Y5sMbN8MZ3XwDLcSaqcKwjh5W9kn9qFigPBNBwzdq6TCAm2gKxQWrdZuEZQBMjQodi9cNd3mZpgrjXBKMx9ee7c", nettype);
		var expected = { spend: "d8f1e81ecbe25ce8b596d426fb02fe7b1d4bb8d14c06b3d3e371a60eeea99534", view: "576f0e61e250d941746ed147f602b5eb1ea250ca385b028a935e166e18f74bd7", intPaymentId: "83eab71fbee84eb9" }
		assert.deepEqual(decoded, expected);
	});
	
	it('hash_to_scalar', function() {
		var scalar = mymonero.monero_utils.hash_to_scalar(private_key);
		assert.equal(scalar, "77c5899835aa6f96b13827f43b094abf315481eaeb4ad2403c65d5843480c404");
	});
	
	it('derivation_to_scalar', function() {
		var derivation = mymonero.monero_utils.generate_key_derivation(public_key, private_key);
		var scalar = mymonero.monero_utils.derivation_to_scalar(derivation, 1);
		assert.equal(scalar, "201ce3c258e09eeb6132ec266d24ee1ca957828f384ce052d5bc217c2c55160d");
	});
	
	it('derive public key', function() {
		var derivation = mymonero.monero_utils.generate_key_derivation(public_key, private_key);
		var output_key = mymonero.monero_utils.derive_public_key(derivation, 1, public_key);
		assert.equal(output_key, "da26518ddb54cde24ccfc59f36df13bbe9bdfcb4ef1b223d9ab7bef0a50c8be3");
	});
	
	it('derive subaddress public key', function() {
		var derivation = mymonero.monero_utils.generate_key_derivation(public_key, private_key);
		var subaddress_public_key = mymonero.monero_utils.derive_subaddress_public_key(public_key, derivation, 1);
		assert.equal(subaddress_public_key, "dfc9e4a0039e913204c1c0f78e954a7ec7ce291d8ffe88265632f0da9d8de1be")
	});
});
