declare namespace BigInteger {
	type ParsableValues =
		| BigInteger.BigInteger
		| number
		| string
		| Buffer
		| (number)[];

	class BigInteger {
		/**
		 * @description Constant: ZERO
		 * <BigInteger> 0.
		 * @static
		 * @type {BigInteger}
		 */
		public static ZERO: BigInteger;

		/**
		 * @description  Constant: ONE
		 * <BigInteger> 1.
		 *
		 * @static
		 * @type {BigInteger}
		 * @memberof BigInteger
		 */
		public static ONE: BigInteger;

		/**
		 * @description Constant: M_ONE
		 *<BigInteger> -1.
		 *
		 * @static
		 * @type {BigInteger}
		 * @memberof BigInteger
		 */
		public static M_ONE: BigInteger;
		/**
		 * @description  Constant: _0
		 * Shortcut for <ZERO>.
		 *
		 * @static
		 * @type {BigInteger}
		 * @memberof BigInteger
		 */
		public static _0: BigInteger;

		/**
		 *
		 * @description Constant: _1
		 * Shortcut for <ONE>.
		 * @static
		 * @type {BigInteger}
		 * @memberof BigInteger
		 */
		public static _1: BigInteger;

		/**
		 * @description  Constant: small
		 * Array of <BigIntegers> from 0 to 36.
		 * These are used internally for parsing, but useful when you need a "small"
		 * <BigInteger>.
		 * @see <ZERO>, <ONE>, <_0>, <_1>
		 * @static
		 * @type {[
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger,
		 *         BigInteger ]}
		 * @memberof BigInteger
		 */
		public static small: [
			BigInteger,
			BigInteger,
			/* Assuming BigInteger_base > 36 */
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger,
			BigInteger
		];

		/**
		 *
		 * @description Used for parsing/radix conversion
		 * @static
		 * @type {[
		 * 		"0",
		 * 		"1",
		 * 		"2",
		 * 		"3",
		 * 		"4",
		 * 		"5",
		 * 		"6",
		 * 		"7",
		 * 		"8",
		 * 		"9",
		 * 		"A",
		 * 		"B",
		 * 		"C",
		 * 		"D",
		 * 		"E",
		 * 		"F",
		 * 		"G",
		 * 		"H",
		 * 		"I",
		 * 		"J",
		 * 		"K",
		 * 		"L",
		 * 		"M",
		 * 		"N",
		 * 		"O",
		 * 		"P",
		 * 		"Q",
		 * 		"R",
		 * 		"S",
		 * 		"T",
		 * 		"U",
		 * 		"V",
		 * 		"W",
		 * 		"X",
		 * 		"Y",
		 * 		"Z"
		 * 	]}
		 * @memberof BigInteger
		 */
		public static digits: [
			"0",
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7",
			"8",
			"9",
			"A",
			"B",
			"C",
			"D",
			"E",
			"F",
			"G",
			"H",
			"I",
			"J",
			"K",
			"L",
			"M",
			"N",
			"O",
			"P",
			"Q",
			"R",
			"S",
			"T",
			"U",
			"V",
			"W",
			"X",
			"Y",
			"Z"
		];
		/**
		 * @description
		 * Convert a value to a <BigInteger>.
		 *
		 *	Although <BigInteger()> is the constructor for <BigInteger> objects, it is
		 *	best not to call it as a constructor. If *n* is a <BigInteger> object, it is
		 *	simply returned as-is. Otherwise, <BigInteger()> is equivalent to <parse>
		 *	without a radix argument.
		 *
		 *	> var n0 = BigInteger();	  // Same as <BigInteger.ZERO>
		 *	> var n1 = BigInteger("123"); // Create a new <BigInteger> with value 123
		 *	> var n2 = BigInteger(123);   // Create a new <BigInteger> with value 123
		 *	> var n3 = BigInteger(n2);	// Return n2, unchanged
		 *
		 *	The constructor form only takes an array and a sign. *n* must be an
		 *	array of numbers in little-endian order, where each digit is between 0
		 *	and BigInteger.base.  The second parameter sets the sign: -1 for
		 *	negative, +1 for positive, or 0 for zero. The array is *not copied and
		 *	may be modified*. If the array contains only zeros, the sign parameter
		 *	is ignored and is forced to zero.
		 *
		 *	> new BigInteger([5], -1): create a new BigInteger with value -5
		 * @param {ParsableValues} n Value to convert to a <BigInteger>.
		 * @see parse, BigInteger
		 * @memberof BigInteger
		 */
		constructor(n: ParsableValues, sign?: 0 | -1 | 1);

		/**
		 * @description  Convert a <BigInteger> to a string.
		 *
		 * When *base* is greater than 10, letters are upper case.
		 * @param {number} [base] Optional base to represent the number in (default is base 10). Must be between 2 and 36 inclusive, or an Error will be thrown
		 * @returns {string} The string representation of the <BigInteger>.
		 * @memberof BigInteger
		 */
		toString(base?: number): string;

		/**
		 * @description
		 * 	Function: parse
		 *  Parse a string into a <BigInteger>.
		 *
		 *	*base* is optional but, if provided, must be from 2 to 36 inclusive. If
		 *	*base* is not provided, it will be guessed based on the leading characters
		 *	of *s* as follows:
		 *
		 *	- "0x" or "0X": *base* = 16
		 *	- "0c" or "0C": *base* = 8
		 *	- "0b" or "0B": *base* = 2
		 *	- else: *base* = 10
		 *
		 *	If no base is provided, or *base* is 10, the number can be in exponential
		 *	form. For example, these are all valid:
		 *
		 *	> BigInteger.parse("1e9");			  // Same as "1000000000"
		 *	> BigInteger.parse("1.234*10^3");	   // Same as 1234
		 *	> BigInteger.parse("56789 * 10 ** -2"); // Same as 567
		 *
		 *	If any characters fall outside the range defined by the radix, an exception
		 *	will be thrown.
		 *
		 * @param {string} s the string to parse.
		 * @param {number} [base] Optional radix (default is to guess based on *s*).
		 * @returns {BigInteger}
		 * @memberof BigInteger
		 */
		static parse(s: string, base?: number): BigInteger;

		/**
		 * @description Add two <BigIntegers>.
		 * @param {ParsableValues} n   The number to add to *this*. Will be converted to a <BigInteger>.
		 * @returns {BigInteger} The numbers added together.
		 * @see <subtract>,<multiply>,<quotient>,<next>
		 * @memberof BigInteger
		 */
		add(n: ParsableValues): BigInteger;

		/**
		 *
		 * @description Get the additive inverse of a <BigInteger>.
		 * @returns {BigInteger} A <BigInteger> with the same magnatude, but with the opposite sign.
		 * @see <abs>
		 * @memberof BigInteger
		 *
		 */
		negate(): BigInteger;

		/**
		 * @description Get the absolute value of a <BigInteger>.
		 * @returns {BigInteger} A <BigInteger> with the same magnatude, but always positive (or zero).
		 * @see <negate>
		 * @memberof BigInteger
		 *
		 */
		abs(): BigInteger;

		/**
		 * @description Subtract two <BigIntegers>.
		 *
		 * @param {ParsableValues} n  The number to subtract from *this*. Will be converted to a <BigInteger>.
		 * @returns {BigInteger} The *n* subtracted from *this*.
		 * @see <add>, <multiply>, <quotient>, <prev>
		 * @memberof BigInteger
		 */
		subtract(n: ParsableValues): BigInteger;

		/**
		 * @description  Get the next <BigInteger> (add one).
		 *
		 * @returns {BigInteger} *this* + 1.
		 * @see <add>, <prev>
		 * @memberof BigInteger
		 */
		next(): BigInteger;

		/**
		 * @description Get the previous <BigInteger> (subtract one).
		 *
		 * @returns {BigInteger} *this* - 1.
		 * @see <next>, <subtract>
		 * @memberof BigInteger
		 */
		prev(): BigInteger;

		/**
		 * @description Compare the absolute value of two <BigIntegers>.
		 *
		 * Calling <compareAbs> is faster than calling <abs> twice, then <compare>.
		 * @param {ParsableValues} n The number to compare to *this*. Will be converted to a <BigInteger>.
		 * @returns {number} -1, 0, or +1 if *|this|* is less than, equal to, or greater than *|n|*.
		 * @see <compare>, <abs>
		 * @memberof BigInteger
		 */
		compareAbs(n: ParsableValues): 1 | 0 | -1;

		/**
		 * @description Compare two <BigIntegers>.
		 *
		 * @param {ParsableValues} n The number to compare to *this*. Will be converted to a <BigInteger>.
		 * @returns {(1 | 0 | -1)} -1, 0, or +1 if *this* is less than, equal to, or greater than *n*.
		 * @see <compareAbs>, <isPositive>, <isNegative>, <isUnit>
		 * @memberof BigInteger
		 */
		compare(n: ParsableValues): 1 | 0 | -1;

		/**
		 *  @description Return true iff *this* is either 1 or -1.
		 *
		 * @returns {boolean} true if *this* compares equal to <BigInteger.ONE> or <BigInteger.M_ONE>.
		 * @see <isZero>, <isNegative>, <isPositive>, <compareAbs>, <compare>,
		 *		<BigInteger.ONE>, <BigInteger.M_ONE>
		 * @memberof BigInteger
		 */
		isUnit(): boolean;

		/**
		 * @description Multiply two <BigIntegers>.
		 *
		 * @param {ParsableValues} n The number to multiply *this* by. Will be converted to a <BigInteger>.
		 * @returns {BigInteger} The numbers multiplied together.
		 * @see <add>, <subtract>, <quotient>, <square>
		 * @memberof BigInteger
		 */
		multiply(n: ParsableValues): BigInteger;

		/**
		 * @description Multiply a <BigInteger> by itself.
		 * This is slightly faster than regular multiplication, since it removes the
		 * duplicated multiplcations.
		 * @returns {BigInteger} > this.multiply(this)
		 * @see <multiply>
		 * @memberof BigInteger
		 */
		square(): BigInteger;

		/**
		 * @description Divide two <BigIntegers> and truncate towards zero.
		 *
		 * <quotient> throws an exception if *n* is zero.
		 * @param {ParsableValues} n The number to divide *this* by. Will be converted to a <BigInteger>.
		 * @returns {BigInteger} The *this* / *n*, truncated to an integer.
		 * @see <add>, <subtract>, <multiply>, <divRem>, <remainder>
		 * @memberof BigInteger
		 */
		quotient(n: ParsableValues): BigInteger;

		/**
		 *
		 * @description Deprecated synonym for <quotient>.
		 * @param {ParsableValues} n
		 * @returns {BigInteger}
		 * @memberof BigInteger
		 */
		divide(n: ParsableValues): BigInteger;

		/**
		 * @description Calculate the remainder of two <BigIntegers>.
		 *
		 * <remainder> throws an exception if *n* is zero.
		 *
		 * @param {ParsableValues} n The remainder after *this* is divided *this* by *n*. Will be converted to a <BigInteger>.
		 * @returns {BigInteger}*this* % *n*.
		 * @see <divRem>, <quotient>
		 * @memberof BigInteger
		 */
		remainder(n: ParsableValues): BigInteger;

		/**
		 * @description Calculate the integer quotient and remainder of two <BigIntegers>.
		 *
		 * <divRem> throws an exception if *n* is zero.
		 *
		 * @param {ParsableValues} n The number to divide *this* by. Will be converted to a <BigInteger>.
		 * @returns {[BigInteger, BigInteger]} A two-element array containing the quotient and the remainder.
		 *
		 *		> a.divRem(b)
		 *
		 *		is exactly equivalent to
		 *
		 *		> [a.quotient(b), a.remainder(b)]
		 *
		 *		except it is faster, because they are calculated at the same time.
		 * @see <quotient>, <remainder>
		 * @memberof BigInteger
		 */
		divRem(n: ParsableValues): [BigInteger, BigInteger];

		/**
		 * @description Return true iff *this* is divisible by two.
		 *
		 *  Note that <BigInteger.ZERO> is even.
		 * @returns {boolean} true if *this* is even, false otherwise.
		 * @see <isOdd>
		 * @memberof BigInteger
		 */
		isEven(): boolean;

		/**
		 * @description  Return true iff *this* is not divisible by two.
		 *
		 * @returns {boolean} true if *this* is odd, false otherwise.
		 * @see <isEven>
		 * @memberof BigInteger
		 */
		isOdd(): boolean;

		/**
		 * @description Get the sign of a <BigInteger>.
		 *
		 * @returns {(-1 | 0 | 1)} 	* -1 if *this* < 0
		 *	* 0 if *this* == 0
		 *	* +1 if *this* > 0
		 * @see  <isZero>, <isPositive>, <isNegative>, <compare>, <BigInteger.ZERO>
		 * @memberof BigInteger
		 */
		sign(): -1 | 0 | 1;

		/**
		 * @description Return true iff *this* > 0.
		 *
		 * @returns {boolean} true if *this*.compare(<BigInteger.ZERO>) == 1.
		 * @see <sign>, <isZero>, <isNegative>, <isUnit>, <compare>, <BigInteger.ZERO>
		 * @memberof BigInteger
		 */
		isPositive(): boolean;

		/**
		 * @description Return true iff *this* < 0.
		 *
		 * @returns {boolean} true if *this*.compare(<BigInteger.ZERO>) == -1.
		 * @see <sign>, <isPositive>, <isZero>, <isUnit>, <compare>, <BigInteger.ZERO>
		 * @memberof BigInteger
		 */
		isNegative(): boolean;

		/**
		 * @description Return true iff *this* == 0.
		 *
		 * @returns {boolean} true if *this*.compare(<BigInteger.ZERO>) == 0.
		 * @see  <sign>, <isPositive>, <isNegative>, <isUnit>, <BigInteger.ZERO>
		 * @memberof BigInteger
		 */
		isZero(): boolean;

		/**
         * @description 	Multiply a <BigInteger> by a power of 10.
         *
         *	This is equivalent to, but faster than
         *
         *	> if (n >= 0) {
         *	>	 return this.multiply(BigInteger("1e" + n));
         *	> }
         *	> else { // n <= 0
         *	>	 return this.quotient(BigInteger("1e" + -n));
         *	> }
         *
         * @param {ParsableValues} n The power of 10 to multiply *this* by. *n* is converted to a
            javascipt number and must be no greater than <BigInteger.MAX_EXP>
            (0x7FFFFFFF), or an exception will be thrown.
         * @returns {BigInteger} *this* * (10 ** *n*), truncated to an integer if necessary.
         * @see  <pow>, <multiply>
         * @memberof BigInteger
         */
		exp10(n: ParsableValues): BigInteger;

		/**
		 * @description 	Raise a <BigInteger> to a power.
		 *
		 *	In this implementation, 0**0 is 1.
		 *
		 * @param {ParsableValues} n The exponent to raise *this* by. *n* must be no greater than
		 *	<BigInteger.MAX_EXP> (0x7FFFFFFF), or an exception will be thrown.
		 * @returns {BigInteger} *this* raised to the *nth* power.
		 * @see <modPow>
		 * @memberof BigInteger
		 */
		pow(n: ParsableValues): BigInteger;

		/**
		 * @description 	Raise a <BigInteger> to a power (mod m).
		 *
		 *	Because it is reduced by a modulus, <modPow> is not limited by
		 *	<BigInteger.MAX_EXP> like <pow>.
		 *
		 * @param {BigInteger} exponent The exponent to raise *this* by. Must be positive.
		 * @param {ParsableValues} modulus  The modulus.
		 * @returns {BigInteger}  *this* ^ *exponent* (mod *modulus*).
		 * @see <pow>, <mod>
		 * @memberof BigInteger
		 */
		modPow(exponent: BigInteger, modulus: ParsableValues): BigInteger;

		/**
		 * @description  	Get the natural logarithm of a <BigInteger> as a native JavaScript number.
		 *
		 *	This is equivalent to
		 *
		 *	> Math.log(this.toJSValue())
		 *
		 *	but handles values outside of the native number range.
		 *
		 * @returns {number} log( *this* )
		 * @see  <toJSValue>
		 * @memberof BigInteger
		 */
		log(): number;

		/**
		 * @description Convert a <BigInteger> to a native JavaScript integer.
		 *
		 *  	This is called automatically by JavaScipt to convert a <BigInteger> to a
		 *	native value.
		 * @returns {number} > parseInt(this.toString(), 10)
		 * @see <toString>, <toJSValue>
		 * @memberof BigInteger
		 */
		valueOf(): number;

		/**
		 * @description Convert a <BigInteger> to a native JavaScript integer.
		 *
		 * This is the same as valueOf, but more explicitly named.
		 * @returns {number} > parseInt(this.toString(), 10)
		 * @see <toString>, <valueOf>
		 * @memberof BigInteger
		 */
		toJSValue(): number;

		/**
		 * @description Get the first byte of the Biginteger
		 *
		 * @returns {number} the first byte of the Biginteger
		 * @memberof BigInteger
		 */
		lowVal(): number;

		/**
		 *
		 * @description  Constant: MAX_EXP The largest exponent allowed in <pow> and <exp10> (0x7FFFFFFF or 2147483647).
		 * @static
		 * @type {BigInteger}
		 * @memberof BigInteger
		 */
		public static MAX_EXP: BigInteger;
	}
}

export = BigInteger;
