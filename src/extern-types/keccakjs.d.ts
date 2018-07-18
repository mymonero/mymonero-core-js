declare module "keccakjs" {
	type Message = Buffer | string;

	class Hasher {
		constructor(bitlength: number);

		/**
		 * Update hash
		 *
		 * @param message The message you want to hash.
		 */
		update(message: Message): Hasher;

		/**
		 * Return hash in integer array.
		 */
		digest(encoding?: "hex" | "binary"): string;
	}

	export = Hasher;
}
