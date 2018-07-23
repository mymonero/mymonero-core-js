import { KeyPair, Commit } from "xmr-types";

export enum DeviceMode {
	TRANSACTION_CREATE_REAL,
	TRANSACTION_CREATE_FAKE,
	TRANSACTION_PARSE,
	NONE,
}

// to later be converted to opaque types
export type EcScalar = string;
export type EcPoint = string;

export type SecretKey = EcScalar;
export type PublicKey = EcPoint;

type SecretKeys = [SecretKey, SecretKey];

export type KeyDerivation = EcPoint;

type ChachaKey = string;
export type PublicSpendKey = PublicKey;

export interface PublicAddress {
	view_public_key: PublicKey;
	spend_public_key: PublicKey;
}

interface CtKey {
	dest: string;
	mask: string;
}

export type CtKeyV = CtKey[];

export type Key = PublicKey | SecretKey;
export type KeyV = Key[];

export type Hash8 = string; // 8 bytes payment id
// cryptonote_basic
export interface IAccountKeys {
	m_account_address: PublicAddress;
	m_spend_secret_key: string;
	m_view_secret_key: string;
	m_device: Device;
}

export interface ISubaddressIndex {
	major: number; // 32 bits
	minor: number; // 32 bits
	isZero(): boolean;
}

// device.hpp

export interface Device {
	/* ======================================================================= */
	/*                              SETUP/TEARDOWN                             */
	/* ======================================================================= */
	set_name(name: string): boolean;
	get_name(): string;
	set_mode(mode: DeviceMode): Promise<boolean>;

	/* ======================================================================= */
	/*                             WALLET & ADDRESS                            */
	/* ======================================================================= */

	/**
	 *
	 * @description Get the public address (Kv + Ks) of an account
	 * @returns {Promise<PublicAddress>}
	 * @memberof Device
	 */
	get_public_address(): Promise<PublicAddress>;

	/**
	 *
	 * @description Get secret keys [kv, ks] of an account
	 * @returns {Promise<SecretKeys>}
	 * @memberof Device
	 */
	get_secret_keys(): Promise<SecretKeys>;

	/**
	 *
	 * @description Generate chacha key from kv and ks
	 * @returns {Promise<ChachaKey>}
	 * @memberof Device
	 */
	generate_chacha_key(keys: IAccountKeys): Promise<ChachaKey>;

	/* ======================================================================= */
	/*                               SUB ADDRESS                               */
	/* ======================================================================= */

	/**
	 *
	 * @description Derives a subaddress public key
	 * @param {PublicKey} pub K0
	 * @param {KeyDerivation} derivation rKv
	 * @param {number} output_index t
	 * @returns {Promise<PublicKey>} K0 - derivation_to_scalar(rkv,t).G
	 * @memberof Device
	 */
	derive_subaddress_public_key(
		pub: PublicKey,
		derivation: KeyDerivation,
		output_index: number,
	): Promise<PublicKey>;

	/**
	 *
	 *
	 * @param {SecretKeys} keys keypair [Ks, kv]
	 * @param {ISubaddressIndex} index i
	 * @returns {Promise<string>} Ks,i
	 * @memberof Device
	 */
	get_subaddress_spend_public_key(
		keys: IAccountKeys,
		index: ISubaddressIndex,
	): Promise<PublicKey>;

	/**
	 *
	 * @description Get an array of public subaddress spend keys Ks,i[]
	 * @param {IAccountKeys} keys
	 * @param {number} account 32 bits
	 * @param {number} begin 32 bits
	 * @param {number} end 32 bits
	 * @returns {Promise<PublicSpendKey[]>}
	 * @memberof Device
	 */
	get_subaddress_spend_public_keys(
		keys: IAccountKeys,
		account: number,
		begin: number,
		end: number,
	): Promise<PublicSpendKey[]>;

	/**
	 *
	 * @description Get a subaddress (Kv,i + Ks,i)
	 * @param {IAccountKeys} keys
	 * @param {ISubaddressIndex} index i
	 * @returns {Promise<PublicAddress>}
	 * @memberof Device
	 */
	get_subaddress(
		keys: IAccountKeys,
		index: ISubaddressIndex,
	): Promise<PublicAddress>;

	/**
	 *
	 * @description Get a subaddress secret key `Hn(kv, i)`
	 * @param {SecretKey} sec The secret key to derive the sub secret key from
	 * @param {number} index
	 * @returns {Promise<SecretKey>}
	 * @memberof Device
	 */
	get_subaddress_secret_key(
		sec: SecretKey,
		index: ISubaddressIndex,
	): Promise<SecretKey>;

	/* ======================================================================= */
	/*                            DERIVATION & KEY                             */
	/* ======================================================================= */

	/**
	 *
	 * @description Verifies that a keypair [k, K] are valid
	 * @param {SecretKey} secretKey
	 * @param {PublicKey} publicKey
	 * @returns {Promise<boolean>}
	 * @memberof Device
	 */
	verify_keys(secretKey: SecretKey, publicKey: PublicKey): Promise<boolean>;

	/**
	 * @description Variable-base scalar multiplications for some integer a, and point P: aP (VBSM)
	 * @param {Key} P
	 * @param {Key} a
	 * @returns {Promise<Key>} aP
	 * @memberof Device
	 */
	scalarmultKey(P: Key, a: Key): Promise<Key>;

	/**
	 * @description Known-base scalar multiplications for some integer a: aG (KBSM)
	 * @param {Key} a
	 * @returns {Promise<Key>} aG
	 * @memberof Device
	 */
	scalarmultBase(a: Key): Promise<Key>;

	/**
	 *
	 * @description Scalar addition (each private key is a scalar) a + b = r
	 * @param {SecretKey} a
	 * @param {SecretKey} b
	 * @returns {Promise<string>} r
	 * @memberof Device
	 */
	sc_secret_add(a: SecretKey, b: SecretKey): Promise<SecretKey>;

	/**
	 * @description Generates a keypair (R, r), leave recovery key undefined for a random key pair
	 * @param {SecretKey} recoveryKey
	 * @returns {Promise<KeyPair>}
	 * @memberof Device
	 */
	generate_keys(recoveryKey: SecretKey | undefined): Promise<KeyPair>;

	/**
	 *
	 * @description Generates a key derivation,
	 * can be used to generate ephemeral_(pub|sec) which is the one-time keypair
	 * @param {PublicKey} pub Ex. rG, a transaction public key
	 * @param {SecretKey} sec Ex. kv, a secret view key
	 * @returns {Promise<KeyDerivation>} Derived Key Ex. rG.kv -> rKv
	 * @memberof Device
	 */
	generate_key_derivation(
		pub: PublicKey,
		sec: SecretKey,
	): Promise<KeyDerivation>;

	/**
	 * @description Conceals a derivation, used when a clear text derivation needs to be encrypted so it can
	 * later be used by other device methods since they only allow encrypted derivations as input
	 * If the main derivation matches the derivation, then the concealed derivation of the tx_pub_key is returned,
	 * otherwise additional_derivations is scanned through for a matching derivation, then the matching index is used to return the concealed
	 * additional_tx_pub_keys at the matching index
	 * @link https://github.com/monero-project/monero/pull/3591
	 * @see 5.3.1 Zero-to-monero
	 * Used when scanning txs to see if any txs are directed towards the users address
	 * @ignore subaddresses
	 * @param {KeyDerivation} derivation e.g rKv
	 * @param {PublicKey} tx_pub_key
	 * @param {PublicKey[]} additional_tx_pub_keys used for multi-destination transfers involving one or more subaddresses
	 * @param {KeyDerivation} main_derivation
	 * @param {KeyDerivation[]} additional_derivations used for multi-destination transfers involving one or more subaddresses
	 * @returns {Promise<PublicKey>}
	 * @memberof Device
	 */
	conceal_derivation(
		derivation: KeyDerivation,
		tx_pub_key: PublicKey,
		additional_tx_pub_keys: PublicKey[],
		main_derivation: KeyDerivation,
		additional_derivations: KeyDerivation[],
	): Promise<PublicKey>;

	/**
	 *
	 * @description Transforms a derivation to a scalar based on an index
	 * Used for multi output transactions and subaddresses
	 * @param {KeyDerivation} derivation e.g rKv
	 * @param {number} output_index t
	 * @returns {Promise<EcScalar>} e.g Hn(rKvt, t)
	 * @memberof Device
	 */
	derivation_to_scalar(
		derivation: KeyDerivation,
		output_index: number,
	): Promise<EcScalar>;

	/**
	 *
	 * @description Derive a secret key
	 * Used to derive an emphemeral (one-time) secret key at index t which then can be used to spend an output or, generate a key image (kHp(K)) when combined
	 * when the corresponding public key
	 * @see 5.2.1 Zero-to-monero
	 * @param {KeyDerivation} derivation e.g rKv
	 * @param {number} output_index e.g t
	 * @param {SecretKey} sec e.g ks, a private spend key
	 * @returns {Promise<SecretKey>} e.g k0, where k0 = Hn(rKv,t) + ks
	 * @memberof Device
	 */
	derive_secret_key(
		derivation: KeyDerivation,
		output_index: number,
		sec: SecretKey,
	): Promise<SecretKey>;

	/**
	 *
	 * @description Derive a public key
	 * Used to derive an emphemeral (one-time) public key at index t which then can be used check if a transaction belongs to
	 * the public key, or generate a key image (kHp(K)) when combined with the corresponding private key
	 * @see 5.2.1 Zero-to-monero
	 * @param {KeyDerivation} derivation e.g rKv
	 * @param {number} output_index e.g t
	 * @param {SecretKey} pub e.g Ks, a public spend key
	 * @returns {Promise<SecretKey>} e.g k0, where k0 = Hn(rKv,t) + Ks
	 * @memberof Device
	 */
	derive_public_key(
		derivation: KeyDerivation,
		output_index: number,
		pub: PublicKey,
	): Promise<PublicKey>;

	/**
	 *
	 * @description Generates a public key from a secret key
	 * @param {SecretKey} sec e.g k
	 * @returns {Promise<PublicKey>} e.g K where K = kG
	 * @memberof Device
	 */
	secret_key_to_public_key(sec: SecretKey): Promise<PublicKey>;

	/**
	 *
	 * @description Generates key image kHp(K)
	 * @param {PublicKey} pub K
	 * @param {SecretKey} sec k
	 * @returns {Promise<PublicKey>} kHp(K)
	 * @memberof Device
	 */
	generate_key_image(pub: PublicKey, sec: SecretKey): Promise<PublicKey>;

	/* ======================================================================= */
	/*                               TRANSACTION                               */
	/* ======================================================================= */

	/**
	 *
	 * @description First step of creating a transaction
	 * @returns {Promise<SecretKey>} A randomly generated spk
	 * @memberof Device
	 */
	open_tx(): Promise<SecretKey>;

	/**
	 *
	 * @description Encrypt payment id
	 * @param {string} paymentId
	 * @param {string} public_key Kv
	 * @param {string} secret_key r
	 * @returns {Promise<Hash8>} encrypted payment id = XOR (Hn( generate_key_derivation(r, Kv) , ENCRYPTED_PAYMENT_ID_TAIL), paymentId)
	 * @memberof Device
	 */
	encrypt_payment_id(
		paymentId: string,
		public_key: string,
		secret_key: string,
	): Promise<Hash8>;

	/**
	 *
	 * @description Decrypt payment id
	 * @param {string} paymentId
	 * @param {string} public_key
	 * @param {string} secret_key
	 * @returns {Promise<Hash8>} Decrypted payment id = encrypt_payment_id(payment_id, public_key, secret_key) since its a XOR operation
	 * @memberof Device
	 */
	decrypt_payment_id(
		paymentId: string,
		public_key: string,
		secret_key: string,
	): Promise<Hash8>;

	/**
	 *
	 * @description Elliptic Curve Diffie Helman: encodes the amount b and mask a
	 * where C= aG + bH
	 * @param {Commit} unmasked The unmasked ecdh tuple to encode using the shared secret
	 * @param {string} sharedSec e.g sharedSec = derivation_to_scalar(rKv,t) where Kv is the recipients
	 * public view key
	 * @returns {Promise<Commit>}
	 * @memberof Device
	 */
	ecdhEncode(unmasked: Commit, sharedSec: SecretKey): Promise<Commit>;

	/**
	 *
	 * @description Elliptic Curve Diffie Helman: decodes the amount b and mask a
	 * where C= aG + bH
	 * @param {Commit} masked The masked ecdh tuple to decude using the shared secret
	 * @param {SecretKey} sharedSec e.g sharedSec = derivation_to_scalar(rKv | rG.kv ,t)
	 * @returns {Promise<Commit>}
	 * @memberof Device
	 */
	ecdhDecode(masked: Commit, sharedSec: SecretKey): Promise<Commit>;

	/**
	 * @description store keys during construct_tx_with_tx_key to be later used during genRct ->  mlsag_prehash
	 * @param {PublicKey} Aout
	 * @param {PublicKey} Bout
	 * @param {boolean} is_subaddress
	 * @param {number} real_output_index
	 * @param {Key} amount_key
	 * @param {PublicKey} out_eph_public_key
	 * @returns {Promise<boolean>}
	 * @memberof Device
	 */
	add_output_key_mapping(
		Aout: PublicKey,
		Bout: PublicKey,
		is_subaddress: boolean,
		real_output_index: number,
		amount_key: Key,
		out_eph_public_key: PublicKey,
	): boolean;

	/**
	 *
	 * @description Compute the mlsag prehash, also known as the message to be signed
	 * @param {string} blob
	 * @param {number} inputs_size
	 * @param {number} outputs_size
	 * @param {KeyV} hashes
	 * @param {CtKeyV} outPk
	 * @returns {Promise<Key>} mlsag prehash
	 * @memberof Device
	 */
	mlsag_prehash(
		blob: string,
		inputs_size: number,
		outputs_size: number,
		hashes: KeyV,
		outPk: CtKeyV,
	): Promise<Key>;

	/**
	 *
	 * @description Generate the matrix ring parameters
	 * @param {Key} H
	 * @param {Key} xx
	 * @returns {Promise<{ a: Key, aG: Key, aHP: Key, II: Key }>}
	 * @memberof Device
	 */
	mlsag_prepare(
		H: Key,
		xx: Key,
	): Promise<{ a: Key; aG: Key; aHP: Key; II: Key }>;

	/**
	 *
	 * @description Generate the matrix ring parameters
	 * @returns {Promise<{ a: Key, aG: Key }>}
	 * @memberof Device
	 */
	mlsag_prepare(): Promise<{ a: Key; aG: Key }>;

	/**
	 *
	 * @description To be filled in
	 * @param {KeyV} toHash
	 * @returns {Promise<Key>} c
	 * @memberof Device
	 */
	mlsag_hash(toHash: KeyV): Promise<Key>;

	/**
	 *
	 * @description To be filled in
	 * @param {key} c
	 * @param {KeyV} xx
	 * @param {KeyV} alpha
	 * @param {number} rows
	 * @param {number} dsRows
	 * @param {KeyV} ss
	 * @returns {Promise<KeyV>} ss
	 * @memberof Device
	 */
	mlsag_sign(
		c: Key,
		xx: KeyV,
		alpha: KeyV,
		rows: number,
		dsRows: number,
		ss: KeyV,
	): Promise<KeyV>;

	/**
	 *
	 * @description Finalize tx on device
	 * @returns {Promise<boolean>}
	 * @memberof Device
	 */
	close_tx(): Promise<boolean>;
}
