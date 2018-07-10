declare module "keccakjs" {
	type Message = Buffer | string;

	class Hasher {
		/**
		 * Update hash
		 *
		 * @param message The message you want to hash.
		 */
		update(message: Message): Hasher;

		/**
		 * Return hash in integer array.
		 */
		digest(): number[];
	}

	export = Hasher;
}
