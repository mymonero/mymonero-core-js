'use strict'
//
// NOTE: The main downside to using an index.js file like this is that it will pull in all the code - rather than the consumer requiring code module-by-module
// It's of course possible to construct your own stripped-down index.[custom name].js file for, e.g., special webpack bundling usages.
const mymonero_core_js = {}
mymonero_core_js.monero_utils_promise = require('./monero_utils/MyMoneroCoreBridge')() // NOTE: This is actually a promise. Call .then(function(monero_utils) { }) to actually use
mymonero_core_js.monero_config = require('@mymonero/mymonero-monero-config')
mymonero_core_js.monero_txParsing_utils = require('@mymonero/mymonero-tx-parsing-utils')
mymonero_core_js.monero_sendingFunds_utils = require('@mymonero/mymonero-sendfunds-utils')
mymonero_core_js.monero_keyImage_cache_utils = require('@mymonero/mymonero-keyimage-cache')
mymonero_core_js.monero_paymentID_utils = require('@mymonero/mymonero-paymentid-utils')
mymonero_core_js.monero_amount_format_utils = require('@mymonero/mymonero-money-format')
mymonero_core_js.api_response_parser_utils = require('@mymonero/mymonero-response-parser-utils')
//
mymonero_core_js.nettype_utils = require('@mymonero/mymonero-nettype')
mymonero_core_js.JSBigInt = require('@mymonero/mymonero-bigint').BigInteger // so that it is available to a hypothetical consumer's language-bridging web context for constructing string arguments to the above modules
//
module.exports = mymonero_core_js
