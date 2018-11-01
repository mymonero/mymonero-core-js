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

### Contents 

`monero_utils` contains Monero- and MyMonero-specific implementations, wrappers, and declarations, and the MyMonero JS and wasm implementations for the underlying cryptography behind Monero. 

`monero_utils/MyMoneroCoreCpp*` are produced by transpiling Monero core C++ code to JS via Emscripten (See *Building MyMoneroCoreCpp*). A Module instance is managed by `monero_utils/MyMoneroCoreBridge.js`.

A ready-made entrypoint for interacting with `MyMoneroCoreBridge` is located at `monero_utils/monero_utils.js` with usage `require("./monero_utils/monero_utils")({}).then(function(monero_utils) { })`.

Many related utility functions and data structures are located throughout `monero_utils/`, `cryptonote_utils`, and `hostAPI`. Usage below.

This readme is located at `README.md`, and the license is located at `LICENSE.txt`.


## Usage

### `hostAPI`

Use the functions in the modules in `hostAPI` for convenience implementations of (a) networking to a MyMonero-API-compatible server, (b) constructing common request bodies, and (c) parsing responses.

For a working example usage of `hostAPI`, see [mymonero-app-js/HostedMoneroAPIClient](https://github.com/mymonero/mymonero-app-js/blob/master/local_modules/HostedMoneroAPIClient).

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
### `monero_utils/monero_requestURI_utils`

Functions for generating and parsing monero request URIs. Supports multiple currencies and formats.

-----
### `monero_utils/monero_sendingFunds_utils`

Contains convenience implementations such as `SendFunds(…)` for constructing arguments to `monero_utils/monero_utils:create_transaction`.

This function will likely make it into `mymonero-core-cpp` in the future.

One of the arguments to `SendFunds`, `preSuccess_nonTerminal_statusUpdate_fn`, supplies status updates via codes that can be translated into messages. Codes are located on `SendFunds_ProcessStep_Code` and messages are located at `SendFunds_ProcessStep_MessageSuffix`.


----
### `monero_utils/monero_utils`

#### Examples

```
const mymonero = require("mymonero_core_js/index");
// or just "mymonero_core_js/monero_utils/monero_utils"
async function foo()
{
	const monero_utils = await mymonero.monero_utils;
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

Each of these functions is implemented<sup>*</sup> in `monero_utils/MyMoneroCoreBridge.js`, which you access through `monero_utils/monero_utils.js`<sup>\*\*</sup>.

The arguments and return values for these functions are explicitly called out by [MyMoneroCoreBridge.js](https://github.com/mymonero/mymonero-core-js/blob/develop/monero_utils/MyMoneroCoreBridge.js), so that will be the most complete documentation for the moment. Return values are all embedded within a JS dictionary unless they're singular values. Errors are thrown when functions are called via `monero_utils`.

<sup>* The functions' actual implementations are in WebAssembly which is produced via emscripten from exactly matching C++ functions in [mymonero-core-cpp](https://github.com/mymonero/mymonero-core-cpp). This allows core implementation to be shared across all platforms.</sup>

<sup>** for proper exception handling given that `MyMoneroCoreBridge` functions return `{ err_msg: }` rather than throwing</sup>

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
derive_public_key
```
```
derive_subaddress_public_key
```
```
decodeRct
```
```
estimate_rct_tx_size
```

```
calculate_fee
```

```
estimated_tx_network_fee
```

##### Creating Transactions

These functions support Bulletproofs under the hood but don't take `bulletproof` as a parameter because that behavior is controlled by a hardcoded [`use_fork_rules` function](https://github.com/mymonero/mymonero-core-cpp/blob/master/src/monero_fork_rules.cpp#L49). Bulletproofs is not currently enabled.

```
create_signed_transaction
```
* Safe to call over IPC as it takes string rather than native JS objects as args.

```
create_signed_transaction__nonIPCsafe
```
* Takes JSBigInt rather than string args.





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

