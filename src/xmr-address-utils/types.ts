import { Key } from "xmr-types";

export interface Account {
	spend: Key;
	view: Key;
	public_addr: string;
}
