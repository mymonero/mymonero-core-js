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
const supported_short_codes = exports.supported_short_codes = 
[
	"en",
	"nl", 
	"fr",
	"es",
	"pt",
	"ja",
	"it",
	"de", 
	"ru",
	"zh", // chinese (simplified)
	"eo", 
	"jbo" // Lojban
];
exports.mnemonic_languages =
[
	"English",
	"Netherlands",
	"Français",
	"Español",
	"Português",
	"日本語",
	"Italiano",
	"Deutsch", 
	"русский язык",
	"简体中文 (中国)",
	"Esperanto",
	"Lojban"
];
exports.compatible_code_from_locale = function(locale_string)
{
	const supported_short_codes__length = supported_short_codes.length
	for (var i = 0 ; i < supported_short_codes__length ; i++) {
		const short_code = supported_short_codes[i]
		if (locale_string.indexOf(short_code) == 0) {
			return short_code
		}
	}
	throw "Didn't find a code"
	// return undefined
}