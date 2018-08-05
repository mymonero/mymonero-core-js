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
const JSBigInt = require("./biginteger").BigInteger;
//
module.exports = function(currencyConfig)
{
	// `currencyConfig` needs coinUnitPlaces, and coinSymbol
	var config = {}; // shallow copy of initConfig
	{
		for (var key in currencyConfig) {
			config[key] = currencyConfig[key];
		}
		config.coinUnits = new JSBigInt(10).pow(config.coinUnitPlaces);
	}
	this.formatMoneyFull = function(units) {
		units = units.toString();
		var symbol = units[0] === "-" ? "-" : "";
		if (symbol === "-") {
			units = units.slice(1);
		}
		var decimal;
		if (units.length >= config.coinUnitPlaces) {
			decimal = units.substr(
				units.length - config.coinUnitPlaces,
				config.coinUnitPlaces
			);
		} else {
			decimal = padLeft(units, config.coinUnitPlaces, "0");
		}
		return (
			symbol +
			(units.substr(0, units.length - config.coinUnitPlaces) || "0") +
			"." +
			decimal
		);
	};

	this.formatMoneyFullSymbol = function(units) {
		return this.formatMoneyFull(units) + " " + config.coinSymbol;
	};

	function padLeft(str, len, char) {
		while (str.length < len) str = char + str;
		return str;
	}
	function trimRight(str, char) {
		while (str[str.length - 1] == char) str = str.slice(0, -1);
		return str;
	}
	this.formatMoney = function(units) {
		var f = trimRight(this.formatMoneyFull(units), "0");
		if (f[f.length - 1] === ".") {
			return f.slice(0, f.length - 1);
		}
		return f;
	};

	this.formatMoneySymbol = function(units) {
		return this.formatMoney(units) + " " + config.coinSymbol;
	};

	this.parseMoney = function(str) {
		if (!str) return JSBigInt.ZERO;
		var negative = str[0] === "-";
		if (negative) {
			str = str.slice(1);
		}
		var decimalIndex = str.indexOf(".");
		if (decimalIndex == -1) {
			if (negative) {
				return JSBigInt.multiply(str, config.coinUnits).negate();
			}
			return JSBigInt.multiply(str, config.coinUnits);
		}
		if (decimalIndex + config.coinUnitPlaces + 1 < str.length) {
			str = str.substr(0, decimalIndex + config.coinUnitPlaces + 1);
		}
		if (negative) {
			return new JSBigInt(str.substr(0, decimalIndex))
				.exp10(config.coinUnitPlaces)
				.add(
					new JSBigInt(str.substr(decimalIndex + 1)).exp10(
						decimalIndex + config.coinUnitPlaces - str.length + 1,
					),
				).negate;
		}
		return new JSBigInt(str.substr(0, decimalIndex))
			.exp10(config.coinUnitPlaces)
			.add(
				new JSBigInt(str.substr(decimalIndex + 1)).exp10(
					decimalIndex + config.coinUnitPlaces - str.length + 1,
				),
			);
	};

	return this;
};