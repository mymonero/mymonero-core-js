// Copyright (c) 2014-2018, MyMonero.com
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
"use strict";
//
const JSBigInt = require("../cryptonote_utils/biginteger").BigInteger;
//
function _mixinToRingsize(mixin) {
	return mixin + 1;
}
//
function thisFork_minMixin() {
	return 10;
}
function thisFork_minRingSize() {
	return _mixinToRingsize(thisFork_minMixin());
}
exports.thisFork_minMixin = thisFork_minMixin;
exports.thisFork_minRingSize = thisFork_minRingSize;
//
function fixedMixin() {
	return thisFork_minMixin(); /* using the monero app default to remove MM user identifiers */
}
function fixedRingsize() {
	return _mixinToRingsize(fixedMixin());
}
exports.fixedMixin = fixedMixin;
exports.fixedRingsize = fixedRingsize;
//
//
function default_priority() {
	return 1;
} // aka .low
exports.default_priority = default_priority;
//
const SendFunds_ProcessStep_Code = {
	fetchingLatestBalance: 1,
	calculatingFee: 2,
	fetchingDecoyOutputs: 3, // may get skipped if 0 mixin
	constructingTransaction: 4, // may go back to .calculatingFee
	submittingTransaction: 5,
};
exports.SendFunds_ProcessStep_Code = SendFunds_ProcessStep_Code;
const SendFunds_ProcessStep_MessageSuffix = {
	1: "Fetching latest balance.",
	2: "Calculating fee.",
	3: "Fetching decoy outputs.",
	4: "Constructing transaction.", // may go back to .calculatingFee
	5: "Submitting transaction.",
};
exports.SendFunds_ProcessStep_MessageSuffix = SendFunds_ProcessStep_MessageSuffix;