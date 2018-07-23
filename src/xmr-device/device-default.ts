import {
	Device,
	IAccountKeys,
	PublicAddress,
	DeviceMode,
	PublicKey,
	KeyDerivation,
	ISubaddressIndex,
	PublicSpendKey,
	SecretKey,
	Key,
	EcScalar,
	Hash8,
	KeyV,
	CtKeyV,
} from "./types";
import * as crypto from "xmr-crypto-ops";
import {
	secret_key_to_public_key,
	generate_keys,
	random_keypair,
} from "xmr-key-utils";
import { KeyPair, Commit } from "xmr-types";
import { encrypt_payment_id } from "xmr-pid";
import { encode_ecdh, decode_ecdh } from "xmr-crypto-ops/rct";
import { cn_fast_hash } from "xmr-fast-hash";
import { sc_mulsub } from "xmr-crypto-ops/primitive_ops";

export class DefaultDevice implements Device {
	private name: string;

	constructor() {
		this.name = "";
	}

	/* ======================================================================= */
	/*                              SETUP/TEARDOWN                             */
	/* ======================================================================= */
	// #region  SETUP/TEARDOWN

	public set_name(name: string) {
		this.name = name;
		return true;
	}

	public get_name() {
		return this.name;
	}

	public async set_mode(_mode: DeviceMode) {
		return true;
	}

	// #endregion  SETUP/TEARDOWN

	/* ======================================================================= */
	/*                             WALLET & ADDRESS                            */
	/* ======================================================================= */
	// #region WALLET & ADDRESS

	public async get_public_address(): Promise<PublicAddress> {
		return this.notSupported();
	}

	public async get_secret_keys() {
		return this.notSupported();
	}

	public async generate_chacha_key(_keys: IAccountKeys) {
		return this.notSupported();
	}

	// #endregion WALLET & ADDRESS
	/* ======================================================================= */
	/*                               SUB ADDRESS                               */
	/* ======================================================================= */
	// #region SUB ADDRESS
	public async derive_subaddress_public_key(
		out_key: PublicKey,
		derivation: KeyDerivation,
		output_index: number,
	): Promise<PublicKey> {
		return crypto.derivation.derive_subaddress_public_key(
			out_key,
			derivation,
			output_index,
		);
	}

	public async get_subaddress_spend_public_key(
		keys: IAccountKeys,
		index: ISubaddressIndex,
	): Promise<PublicKey> {
		if (index.isZero()) {
			return keys.m_account_address.spend_public_key;
		}
		return this.notSupported();
	}

	public async get_subaddress_spend_public_keys(
		_keys: IAccountKeys,
		_account: number,
		_begin: number,
		_end: number,
	): Promise<PublicSpendKey[]> {
		return this.notSupported();
	}

	public async get_subaddress(
		keys: IAccountKeys,
		index: ISubaddressIndex,
	): Promise<PublicAddress> {
		if (index.isZero()) {
			return keys.m_account_address;
		}

		return this.notSupported();
	}

	public async get_subaddress_secret_key(
		_sec: SecretKey,
		_index: ISubaddressIndex,
	): Promise<SecretKey> {
		return this.notSupported();
	}
	/* ======================================================================= */
	/*                            DERIVATION & KEY                             */
	/* ======================================================================= */
	// #region DERIVATION & KEY

	public async verify_keys(
		secretKey: SecretKey,
		publicKey: PublicKey,
	): Promise<boolean> {
		const calculatedPubKey = secret_key_to_public_key(secretKey);
		return calculatedPubKey === publicKey;
	}

	public async scalarmultKey(P: Key, a: Key): Promise<Key> {
		return crypto.primitive_ops.ge_scalarmult(P, a);
	}

	public async scalarmultBase(a: Key): Promise<Key> {
		return crypto.primitive_ops.ge_scalarmult_base(a);
	}

	public async sc_secret_add(a: SecretKey, b: SecretKey): Promise<SecretKey> {
		return crypto.primitive_ops.sc_add(a, b);
	}

	public async generate_keys(
		recoveryKey: SecretKey | undefined,
	): Promise<KeyPair> {
		if (recoveryKey) {
			return generate_keys(recoveryKey);
		}
		return random_keypair();
	}

	public async generate_key_derivation(
		pub: PublicKey,
		sec: SecretKey,
	): Promise<KeyDerivation> {
		return crypto.derivation.generate_key_derivation(pub, sec);
	}

	public async conceal_derivation(
		derivation: KeyDerivation,
		_tx_pub_key: PublicKey,
		_additional_tx_pub_keys: PublicKey[],
		_main_derivation: KeyDerivation,
		_additional_derivations: KeyDerivation[],
	): Promise<PublicKey> {
		return derivation;
	}

	public async derivation_to_scalar(
		derivation: KeyDerivation,
		output_index: number,
	): Promise<EcScalar> {
		return crypto.derivation.derivation_to_scalar(derivation, output_index);
	}

	public async derive_secret_key(
		derivation: KeyDerivation,
		output_index: number,
		sec: SecretKey,
	): Promise<SecretKey> {
		return crypto.derivation.derive_secret_key(
			derivation,
			output_index,
			sec,
		);
	}

	public async derive_public_key(
		derivation: KeyDerivation,
		output_index: number,
		pub: PublicKey,
	): Promise<PublicKey> {
		return crypto.derivation.derive_public_key(
			derivation,
			output_index,
			pub,
		);
	}

	public async generate_key_image(
		pub: PublicKey,
		sec: SecretKey,
	): Promise<PublicKey> {
		return crypto.key_image.generate_key_image(pub, sec);
	}

	public async secret_key_to_public_key(sec: SecretKey): Promise<PublicKey> {
		return secret_key_to_public_key(sec);
	}

	/* ======================================================================= */
	/*                               TRANSACTION                               */
	/* ======================================================================= */
	// #region TRANSACTION

	public async open_tx(): Promise<SecretKey> {
		const { sec } = random_keypair();
		return sec;
	}

	public async encrypt_payment_id(
		paymentId: string,
		public_key: string,
		secret_key: string,
	): Promise<Hash8> {
		return encrypt_payment_id(paymentId, public_key, secret_key);
	}

	public async decrypt_payment_id(
		paymentId: string,
		public_key: string,
		secret_key: string,
	): Promise<Hash8> {
		return this.encrypt_payment_id(paymentId, public_key, secret_key);
	}

	public async ecdhEncode(
		unmasked: Commit,
		sharedSec: SecretKey,
	): Promise<Commit> {
		return encode_ecdh(unmasked, sharedSec);
	}

	public async ecdhDecode(
		masked: Commit,
		sharedSec: SecretKey,
	): Promise<Commit> {
		return decode_ecdh(masked, sharedSec);
	}

	public add_output_key_mapping(
		_Aout: PublicKey,
		_Bout: PublicKey,
		_is_subaddress: boolean,
		_real_output_index: number,
		_amount_key: Key,
		_out_eph_public_key: PublicKey,
	): boolean {
		return true;
	}

	public async mlsag_prehash(
		_blob: string,
		_inputs_size: number,
		_outputs_size: number,
		hashes: KeyV,
		_outPk: CtKeyV,
	): Promise<Key> {
		return cn_fast_hash(hashes.join(""));
	}

	public async mlsag_prepare(
		H: Key,
		xx: Key,
	): Promise<{ a: Key; aG: Key; aHP: Key; II: Key }>;

	public async mlsag_prepare(): Promise<{ a: Key; aG: Key }>;

	public async mlsag_prepare(H?: Key, xx?: Key) {
		const { sec: a, pub: aG } = random_keypair();

		if (H && xx) {
			const aHP = await this.scalarmultKey(H, a);
			const II = await this.scalarmultKey(H, xx);
			return { a, aG, aHP, II };
		} else {
			return { a, aG };
		}
	}

	public async mlsag_hash(toHash: KeyV): Promise<Key> {
		return cn_fast_hash(toHash.join(""));
	}

	public async mlsag_sign(
		c: Key,
		xx: KeyV,
		alpha: KeyV,
		rows: number,
		dsRows: number,
		ss: KeyV,
	): Promise<KeyV> {
		if (dsRows > rows) {
			throw Error("dsRows greater than rows");
		}
		if (xx.length !== rows) {
			throw Error("xx size does not match rows");
		}
		if (alpha.length !== rows) {
			throw Error("alpha size does not match rows");
		}
		if (ss.length !== rows) {
			throw Error("ss size does not match rows");
		}

		for (let j = 0; j < rows; j++) {
			ss[j] = sc_mulsub(c, xx[j], alpha[j]);
		}
		return ss;
	}

	public async close_tx(): Promise<boolean> {
		return true;
	}

	private notSupported(): any {
		throw Error("This device function is not supported");
	}
}
