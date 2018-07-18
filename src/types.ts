export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export interface SecretCommitment {
	x: string;
	a: string;
}

export interface MixCommitment {
	dest: string;
	mask: string;
}
