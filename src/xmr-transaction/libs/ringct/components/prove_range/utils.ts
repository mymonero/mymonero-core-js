import { RCTSignatures } from "../../types";

export function serialize_range_proofs(rv: RCTSignatures) {
	let buf = "";

	for (let i = 0; i < rv.p.rangeSigs.length; i++) {
		for (let j = 0; j < rv.p.rangeSigs[i].bsig.s.length; j++) {
			for (let l = 0; l < rv.p.rangeSigs[i].bsig.s[j].length; l++) {
				buf += rv.p.rangeSigs[i].bsig.s[j][l];
			}
		}
		buf += rv.p.rangeSigs[i].bsig.ee;
		for (let j = 0; j < rv.p.rangeSigs[i].Ci.length; j++) {
			buf += rv.p.rangeSigs[i].Ci[j];
		}
	}
	return buf;
}
