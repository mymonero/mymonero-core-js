declare namespace cn58 {
	namespace cnBase58 {
		/**
		 *
		 * @description Encodes a hex string into base 58 string
		 * @param {string} hexStr hex string
		 * @returns {string} base 58 string
		 */
		function encode(hexStr: string): string;

		/**
		 *
		 * @description Decodes a base58 string to a hex string
		 * @param {string} str base58 string
		 * @returns {string} hex string
		 */
		function decode(str: string): string;
	}
}

export = cn58;
