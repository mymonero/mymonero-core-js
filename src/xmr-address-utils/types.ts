import { KeyPair } from "xmr-types";

export interface Account {
	spend: KeyPair;
	view: KeyPair;
	public_addr: string;
}
