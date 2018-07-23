# MyMonero Core JS

### Info

1. Legal
2. What's in This Repo?
3. Library Roadmap
4. Library API Documentation
5. Building MyMoneroCoreCpp

### Contributing

1. QA
2. Pull Requests


# Info

## Legal

See `LICENSE.txt` for license.

All source code copyright © 2014-2018 by MyMonero. All rights reserved.

## What's in This Repo?

This repository holds the Javascript source code for the Monero/CryptoNote cryptography and protocols, plus lightwallet functions which power the official [MyMonero](https://www.mymonero.com) apps.

There is also a chain of build scripts which is capable of building a JS module by transpiling a subset of Monero source code via emscripten, which relies upon static boost libs, for which there is also a script for building from source. 

### Contents 

* `monero_utils` contains Monero- and MyMonero-specific implementations, wrappers, and declarations.

* `cryptonote_utils` contains the MyMonero JS implementations for the underlying cryptography behind Monero. 
	* `cryptonote_utils/MyMoneroCoreCpp.(js,wasm)` are produced by transpiling Monero core C++ code to JS via Emscripten (See *Building MyMoneroCoreCpp*). A Module instance is managed by `cryptonote_utils/cryptonote_utils.js`.

* This readme is located at `README.md`, and the license is located at `LICENSE.txt`.

## Library Roadmap

* Investigate replacing entire implementation with bindings to lightwallet API in official Monero core wallet C++

## Library API Documentation

*Coming soon*

## Building MyMoneroCoreCpp

There's no need to build cryptonote_utils/MyMoneroCoreCpp as a build is provided, but if you were, for example, interested in adding a C++ function, you could use the information in this section to transpile them to JS.

### Install Emscripten SDK

Ensure you've [properly installed Emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html) and exposed the Emscripten executables in your PATH, e.g.:

	source ./emsdk_env.sh


### Boost for Emscripten

*Depends upon:* Emscripten SDK

Download a copy of the contents of the Boost source into `./contrib/boost-sdk/`.

* Execute `bin/build-boost-emscripten.sh`

### Emscripten Module

*Depends upon:* Emscripten SDK, Boost for Emscripten

* Execute `bin/build-emcpp.sh`

Or if you want to copy the build products to their distribution locations, 

* Execute `bin/archive-emcpp.sh`


# Contributing

## QA

Please submit any bugs as Issues unless they have already been reported.

Suggestions and feedback are very welcome!

## Pull Requests

We'll merge nearly anything constructive. Contributors welcome and credited in releases.

We often collaborate over IRC in #mymonero on Freenode.

**All development happens off the `develop` branch like the Gitflow Workflow.**

## Regular contributors

* 💿 `endogenic` ([Paul Shapiro](https://github.com/paulshapiro)) Maintainer

* 🍄 `luigi` Major core crypto and Monero routine implementation contributor; Advisor

* 🏄‍♂️ `paullinator` ([Paul Puey](https://github.com/paullinator)) API design

* 🔒 `cryptochangement` Subaddress send & decode support; Initial tests

* 💩 `henrynguyen5` Code quality, modernization, tests; HW wallet support *(in progress)*