declare namespace nacl {
	namespace ll {
		/**
		 *
		 * @description Multiply a scalar *s* by base *G*
		 * @param {Uint8Array} s
		 * @returns {Uint8Array} s*G
		 */
		function ge_scalarmult_base(s: Uint8Array): Uint8Array;

		/**
		 *
		 * @description Multiply a scalar *s* by a point *P*
		 * @param {Uint8Array} P
		 * @param {Uint8Array} s
		 * @returns {Uint8Array} s*P
		 */
		function ge_scalarmult(P: Uint8Array, s: Uint8Array): Uint8Array;

		/**
		 *
		 * c*P + r*G
		 * @param {*} c
		 * @param {*} P
		 * @param {*} r
		 * @returns {Uint8Array} c*P + r*G
		 */
		function ge_double_scalarmult_base_vartime(
			c: Uint8Array,
			P: Uint8Array,
			r: Uint8Array,
		): Uint8Array;

		/**
		 *
		 * P + Q
		 * @param {Uint8Array} P
		 * @param {Uint8Array} Q
		 * @returns {Uint8Array} P + Q
		 */
		function ge_add(P: Uint8Array, Q: Uint8Array): Uint8Array;

		/**
		 *
		 * @description name changed to reflect not using precomp r*Pb + c*I
		 *
		 *  sigr * Hp(pub) + sigc * k_image
		 *
		 *  argument names also copied from the signature implementation
		 *
		 *  note precomp AND hash_to_ec are done internally!!
		 * @param {Uint8Array} r
		 * @param {Uint8Array} Pb
		 * @param {Uint8Array} c
		 * @param {Uint8Array} I
		 * @returns {Uint8Array} r*Pb + c*I
		 */
		function ge_double_scalarmult_postcomp_vartime(
			r: Uint8Array,
			Pb: Uint8Array,
			c: Uint8Array,
			I: Uint8Array,
		): Uint8Array;
	}
}

export = nacl;
