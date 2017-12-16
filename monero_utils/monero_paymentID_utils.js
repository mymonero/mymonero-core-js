// Copyright (c) 2014-2017, MyMonero.com
// 
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
// 
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
// 
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
// 
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
"use strict"
//
const monero_utils = require('./monero_cryptonote_utils_instance')
//
// Note: long (64 char, plaintext) payment ids are deprecated.
//
function New_Short_TransactionID()
{
	return monero_utils.rand_8()
}
exports.New_Short_TransactionID = New_Short_TransactionID
exports.New_TransactionID = New_Short_TransactionID
//
function IsValidPaymentIDOrNoPaymentID(payment_id)
{
	if (payment_id) {
		let payment_id_length = payment_id.length
		if (payment_id_length !== 64) { // old plaintext long
			if (payment_id_length !== 16) { // new encrypted short
				return false; // invalid length
			}
		}
		if (!(/^[0-9a-fA-F]{16}$/.test(payment_id))) { // not a valid 16 char pid
			if (!(/^[0-9a-fA-F]{64}$/.test(payment_id))) { // not a valid 64 char pid
				return false // then not valid
			}
		} 
	}
	return true // then either no pid or is a valid one
}
exports.IsValidPaymentIDOrNoPaymentID = IsValidPaymentIDOrNoPaymentID