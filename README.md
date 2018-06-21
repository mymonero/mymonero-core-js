# MyMonero Core JS

### Info

1. Legal
2. What's in This Repo?
3. Library Roadmap
4. Library API Documentation

### Contributing

1. QA
2. Pull Requests


# Info

## Legal

See `LICENSE.txt` for license.

All source code copyright © 2014-2018 by MyMonero. All rights reserved.


## What's in This Repo?

This repository holds the Javascript source code for the Monero/CryptoNote cryptography and protocols, plus lightwallet functions which power the official [MyMonero](https://www.mymonero.com) apps.

### Contents 

* `monero_utils` contains Monero- and MyMonero-specific implementations, wrappers, and declarations.

* `cryptonote_utils` contains the MyMonero JS implementations for the underlying cryptography behind Monero.

* This readme is located at `README.md`, and the license is located at `LICENSE.txt`.

## Library Roadmap

* Investigate replacing entire implementation with bindings to lightwallet API in official Monero core wallet C++

## Library API Documentation

*Coming soon*

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