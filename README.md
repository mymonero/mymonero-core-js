# MyMonero Core JS

### Info

1. Legal
2. What's in This Repo?
3. Usage

### Contributing

1. QA
2. Pull Requests
3. Building MyMoneroCoreCpp from Scratch
4. Contributors


# Info

## Legal

See `LICENSE.txt` for license.

All source code copyright © 2014-2018 by MyMonero. All rights reserved.

## What's in This Repo?

This repository holds the Javascript source code for the Monero/CryptoNote cryptography and protocols, plus lightwallet functions which power the official [MyMonero](https://www.mymonero.com) apps.

There is also a chain of build scripts which is capable of building a JS module by transpiling a subset of Monero source code via emscripten, which relies upon static boost libs, for which there is also a script for building from source. 

**It's possible to run your own lightweight (hosted) wallet server by using either OpenMonero or the lightweight wallet server which MyMonero has developed specially to be open-sourced for the Monero community (PR is in the process of being merged). However, MyMonero also offers hosting to wallet app makers (for a nominal, scaling fee per active wallet per month) who would like to use this library, mymonero-core-js, to add hosted Monero wallets to their app but who aren't ready to run their own highly optimized server. The benefit of offering a hosted wallet rather than requiring users to use a remote node is that scanning doesn't have to take place on the mobile device, so the user doesn't have to download the blockchain and scan on their device, or wait when they switch to a new device or come back to the app after a period of time. For more information, please reach out to MyMonero at [support@mymonero.com](support@mymonero.com). One example customer using this paid service is [Edge Secure](https://edge.app). We're very interested in supporting the growth of the Monero ecosystem, and will be happy to work with integrators on flexible pricing.**

### Contents 

`monero_utils` contains Monero- and MyMonero-specific implementations, wrappers, and declarations, and the MyMonero JS and wasm (and asm.js fallback/polyfill) implementations for the underlying cryptography behind Monero. 

`monero_utils/MyMoneroCoreCpp*` are produced by transpiling Monero core C++ code to JS via Emscripten (See *Building MyMoneroCoreCpp*). A Module instance is managed by `monero_utils/MyMoneroCoreBridge.js`.

Library integrators may use `MyMoneroCoreBridge` by `require("./monero_utils/MyMoneroCoreBridge")({}).then(function(coreBridge_instance) { })`. (This was formerly accessed via the now-deprecated `monero_utils/monero_utils`). You may also access this MyMoneroCoreBridge promise via the existing `index.js` property `monero_utils_promise` (the name has been kept the same for API stability). 

Many related utility functions and data structures are located throughout `monero_utils/`, `cryptonote_utils`, and `hostAPI`. Usage below.

This readme is located at `README.md`, and the license is located at `LICENSE.txt`.


## Usage

### `hostAPI`

Use the functions in the modules in `hostAPI` for convenience implementations of (a) networking to a MyMonero-API-compatible server, (b) constructing common request bodies, and (c) parsing responses.

For a working example usage of `hostAPI`, see [mymonero-app-js/HostedMoneroAPIClient](https://github.com/mymonero/mymonero-app-js/blob/master/local_modules/HostedMoneroAPIClient). However, there's no need to conform to this example's implementation, especially for sending transactions, as the response parsing and request construction for transactions is now handled within the implementation.

#### Examples

```
const endpointPath = "get_address_info"
const parameters = net_service_utils.New_ParametersForWalletRequest(address, view_key__private)
```

```	
monero_utils_promise.then(function(monero_utils) {
	response_parser_utils.Parsed_AddressTransactions__keyImageManaged(
		data,
		address, view_key__private, spend_key__public, spend_key__private,
		monero_utils,
		function(err, returnValuesByKey) {
			…
		}
	)
})
```
where `data` is the JSON response. Note you must pass in a `resolve`d `monero_utils` instance (see below for usage) so that such functions can remain synchronous without having to wait for the promise.

`__keyImageManaged` means that key images will be generated and then cached for a large performance boost for you. The caveat of this convenience is that you should make sure to call `DeleteManagedKeyImagesForWalletWith` on `monero_utils/monero_keyImage_cache_utils` (below) when you're done with them, such as on the teardown of a related wallet instance.

----
### `cryptonote_utils/mnemonic_languages`

It's not generally at all necessary to interact with this module unless you want to, e.g., construct a GUI that needs a list of support mnemonics.

In other words, if your app only needs to generate a mnemonic, you can avoid using this code module entirely by simply passing a language code (of "en", "en-US", "ja", "zh" etc) to the below `monero_utils` function which generates wallets.

-----
### `cryptonote_utils/nettype`

You'll need this module to construct the `nettype` argument for passing to various other functions.

#### Examples

`const nettype = require('cryptonote_utils/nettype').network_type.MAINNET`

-----
### `cryptonote_utils/biginteger`

Used extensively for managing Monero amounts in atomic units to ensure precision.

#### Examples

```
const JSBigInt = require('../mymonero_core_js/cryptonote_utils/biginteger').BigInteger
const amount = new JSBigInt('12300000')
const amount_str = monero_amount_format_utils.formatMoney(amount)
```

-----
### `cryptonote_utils/money_format_utils`

It's not necessary to use this module directly. See `monero_utils/monero_amount_format_utils`.

-----
### `monero_utils/monero_amount_format_utils`

```
const monero_amount_format_utils = require("monero_utils/monero_amount_format_utils");
const formatted_string = monero_amount_format_utils.formatMoney(a JSBigInt)
```

Functions: `formatMoneyFull`, `formatMoneyFullSymbol`, `formatMoney`, `formatMoneySymbol`, `parseMoney(str) -> JSBigInt`

-----
### `monero_utils/monero_txParsing_utils`

Use these functions to derive additional state from transaction rows which were returned by a server and then parsed by `hostAPI`. 

* `IsTransactionConfirmed(tx, blockchain_height)`
* `IsTransactionUnlocked(tx, blockchain_height)`
* `TransactionLockedReason(tx, blockchain_height)`

-----
### `monero_utils/monero_keyImage_cache_utils`

Use these functions to directly interact with the key image cache.

* `Lazy_KeyImage(…)` Generate a key image directly and cache it. Returns cached values.
* `DeleteManagedKeyImagesForWalletWith(address)` Call this to avoid leaking keys if you use any of the response parsing methods (above) which are suffixed with `__keyImageManaged`.

-----
### `monero_utils/monero_paymentID_utils`

Contains functions to validating payment ID formats. To generate payment IDs, see `monero_utils`.

-----
### `monero_utils/monero_sendingFunds_utils`

Used to contain a convenience implementation of `SendFunds(…)` for constructing arguments to `create_transaction`-type functions. However that's been moved to C++ and exposed via a single function on `MyMoneroCoreBridge` called `async__send_funds`.

One of the callbacks to this function, `status_update_fn`, supplies status updates via codes that can be translated into messages. Codes are located on `SendFunds_ProcessStep_Code` and messages are located at `SendFunds_ProcessStep_MessageSuffix` within this file, `monero_sendingFunds_utils`. This lookup will probably make it into `MyMoneroCoreBridge` for concision.


----
### `monero_utils/MyMoneroCoreBridge`

#### Examples

```
const mymonero = require("mymonero_core_js/index");
// or just "mymonero_core_js/monero_utils/MyMoneroCoreBridge"
async function foo()
{
	const monero_utils = await mymonero.monero_utils_promise;
	const nettype = mymonero.nettype_utils.network_type.MAINNET;
	const decoded = monero_utils.address_and_keys_from_seed("…", nettype);
	// read decoded.address_string
	//
}
foo()
```

```
var decoded = monero_utils.decode_address("…", nettype);
```

#### Available functions

Each of these functions is implemented<sup>*</sup> in `monero_utils/MyMoneroCoreBridge.js`.

The arguments and return values for these functions are explicitly called out by [MyMoneroCoreBridge.js](https://github.com/mymonero/mymonero-core-js/blob/develop/monero_utils/MyMoneroCoreBridge.js), so that will be the most complete documentation for the moment. Return values are all embedded within a JS dictionary unless they're singular values. Errors are thrown as exceptions.

<sup>* The functions' actual implementations are in WebAssembly which is produced via emscripten from exactly matching C++ functions in [mymonero-core-cpp](https://github.com/mymonero/mymonero-core-cpp). This allows core implementation to be shared across all platforms.</sup>


```
is_subaddress
```
```
is_integrated_address
```
```
new_payment_id
```
```
new__int_addr_from_addr_and_short_pid
```
```
decode_address
```
```
newly_created_wallet
```
```
are_equal_mnemonics
```
```
mnemonic_from_seed
```
```
seed_and_keys_from_mnemonic
```
```
validate_components_for_login
```
```
address_and_keys_from_seed
```
* This function was known as `create_address` in the previous mymonero-core-js API.

```
generate_key_image
```
```
generate_key_derivation
```
```
derivation_to_scalar
```
```
derive_public_key
```
```
derive_subaddress_public_key
```
```
decodeRct
```
```
decodeRctSimple
```

```
estimated_tx_network_fee
```
```
estimate_rct_tx_size
```

```
async__send_funds
```
* This method takes simple, familiar parameters in the form of a keyed dictionary, and has a handful of callbacks which supply pre-formed request parameters for sending directly to a MyMonero or lightweight wallet-compatible API server. Responses may be sent directly back to the callbacks' callbacks, as they are now parsed and handled entirely within the implementation. This function's interface used to reside in `monero_sendingFunds_utils`. See `tests/sendingFunds.spec.js` for example usage.


# Contributing

## QA

Please submit any bugs as Issues unless they have already been reported.

Suggestions and feedback are very welcome!

## Pull Requests

We'll merge nearly anything constructive. Contributors welcome and credited in releases.

We often collaborate over IRC in #mymonero on Freenode.

**All development happens off the `develop` branch like the Gitflow Workflow.**

## Building MyMoneroCoreCpp from Scratch

There's no need to build monero_utils/MyMoneroCoreCpp as a build is provided, but if you were for example interested in adding a C++ function, you could use the information in this section to transpile it to JS.

### Repository Setup

* Execute `bin/update_submodules` 


### Install Emscripten SDK

**A version of emscripten of at least 1.38.13 with [these updates](https://github.com/kripken/emscripten/pull/7096) is required so that random bit generation safety can be ensured.**

Ensure you've [properly installed Emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html) and exposed the Emscripten executables in your PATH, e.g.:

	source ./emsdk_env.sh


### Boost for Emscripten

*Depends upon:* Emscripten SDK

Download a copy of the contents of the Boost source into `./contrib/boost-sdk/`.

* Execute `bin/build-boost-emscripten.sh`



### Emscripten Module

*Depends upon:* Repository Setup, Emscripten SDK, Boost for Emscripten

* Execute `bin/build-emcpp.sh`

Or if you want to copy the build products to their distribution locations, 

* Execute `bin/archive-emcpp.sh`

**NOTE** If you want to build for asmjs instead of wasm, edit `CMakeLists.txt` to turn the `MM_EM_ASMJS` option to `ON` before you run either the `build` or `archive` script. Finally, at every place you instantiate a `MyMoneroCoreBridge` instance, ensure that the `asmjs` flag passed as an init argument is set to `true` (If not, loading will not work). 


## Contributors

* 💿 `endogenic` ([Paul Shapiro](https://github.com/paulshapiro)) Maintainer

* 🍄 `luigi` Major contiributor of original JS core crypto and Monero-specific routines; Advisor

* 🏄‍♂️ `paullinator` ([Paul Puey](https://github.com/paullinator)) API design

* 🔒 `cryptochangement` Subaddress send & decode support; Initial tests

* 💩 `henrynguyen5` Tests; Ledger support research

