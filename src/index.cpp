//
//  index.cpp
//  Copyright (c) 2014-2018, MyMonero.com
//
//  All rights reserved.
//
//  Redistribution and use in source and binary forms, with or without modification, are
//  permitted provided that the following conditions are met:
//
//  1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
//  2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
//  3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
//  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
//  MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
//  THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
//  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
//  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
//  STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
//  THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//
#include <stdio.h>
#include <emscripten/bind.h>
//
#include "serial_bridge_index.hpp"
#include "emscr_async_send_bridge.hpp"
//
EMSCRIPTEN_BINDINGS(my_module)
{ // C++ -> JS
    emscripten::function("send_funds", &emscr_async_bridge::send_funds);
    emscripten::function("send_cb_I__got_unspent_outs", &emscr_async_bridge::send_cb_I__got_unspent_outs);
    emscripten::function("send_cb_II__got_random_outs", &emscr_async_bridge::send_cb_II__got_random_outs);
    emscripten::function("send_cb_III__submitted_tx", &emscr_async_bridge::send_cb_III__submitted_tx);
    //
    emscripten::function("decode_address", &serial_bridge::decode_address);
    emscripten::function("is_subaddress", &serial_bridge::is_subaddress);
    emscripten::function("is_integrated_address", &serial_bridge::is_integrated_address);
    //
    emscripten::function("new_integrated_address", &serial_bridge::new_integrated_address);
    emscripten::function("new_payment_id", &serial_bridge::new_payment_id);
    //
    emscripten::function("newly_created_wallet", &serial_bridge::newly_created_wallet);
    emscripten::function("are_equal_mnemonics", &serial_bridge::are_equal_mnemonics);
    emscripten::function("mnemonic_from_seed", &serial_bridge::mnemonic_from_seed);
    emscripten::function("seed_and_keys_from_mnemonic", &serial_bridge::seed_and_keys_from_mnemonic);
    emscripten::function("validate_components_for_login", &serial_bridge::validate_components_for_login);
    emscripten::function("address_and_keys_from_seed", &serial_bridge::address_and_keys_from_seed);
    //
    emscripten::function("estimated_tx_network_fee", &serial_bridge::estimated_tx_network_fee);
    emscripten::function("estimate_rct_tx_size", &serial_bridge::estimate_rct_tx_size);
    //
    emscripten::function("generate_key_image", &serial_bridge::generate_key_image);
    emscripten::function("generate_key_derivation", &serial_bridge::generate_key_derivation);
    emscripten::function("derive_public_key", &serial_bridge::derive_public_key);
    emscripten::function("derive_subaddress_public_key", &serial_bridge::derive_subaddress_public_key);
    emscripten::function("decodeRct", &serial_bridge::decodeRct);
    emscripten::function("decodeRctSimple", &serial_bridge::decodeRctSimple);
    emscripten::function("derivation_to_scalar", &serial_bridge::derivation_to_scalar);
    //
}
extern "C"
{ // C -> JS
}
int main() {
  // printf("hello, world!\n");
  return 0;
}
