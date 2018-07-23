export interface BorromeanSignature {
	s: string[][];
	ee: string;
}

export interface CommitMask {
	C: string;
	mask: string;
}

export interface RangeSignature {
	Ci: string[];
	bsig: BorromeanSignature;
}
