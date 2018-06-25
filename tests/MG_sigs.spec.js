const monero_utils = require("../").monero_utils;

it("MG_sigs", () => {
	function skvGen(len) {
		let skVec = [];
		for (let i = 0; i < len; i++) {
			skVec.push(monero_utils.skGen());
		}
		return skVec;
	}
	//initializes a key matrix;
	//first parameter is rows,
	//second is columns
	function keyMInit(rows, cols) {
		let rv = [];
		for (let i = 0; i < cols; i++) {
			rv.push([]);
		}
		return rv;
	}
	let j = 0;

	//Tests for MG Sigs
	//#MG sig: true one
	let N = 3; // cols
	let R = 2; // rows

	let xtmp = skvGen(R);
	let xm = keyMInit(R, N); // = [[None]*N] #just used to generate test public keys
	let sk = skvGen(R);

	// [
	// [pubkey1, commitment1],
	// [pubkey2, commitment2],
	// ...
	// [pubkeyn, commitmentn]]
	// // Gen creates a signature which proves that for some column in the keymatrix "pk"
	//  the signer knows a secret key for each row in that column
	let P = keyMInit(R, N); // = keyM[[None]*N] #stores the public keys;

	let ind = 2;
	let i = 0;

	for (j = 0; j < R; j++) {
		for (i = 0; i < N; i++) {
			xm[i][j] = monero_utils.skGen();
			P[i][j] = monero_utils.ge_scalarmult_base(xm[i][j]); // generate fake [pubkey, commit]
		}
	}

	for (j = 0; j < R; j++) {
		// our secret vector of [onetimesec, z]
		sk[j] = xm[ind][j];
	}

	let message = monero_utils.identity();
	let kimg = monero_utils.ge_scalarmult(
		monero_utils.hashToPoint(P[ind][0]),
		sk[0],
	);
	let rv = monero_utils.MLSAG_Gen(message, P, sk, kimg, ind);
	let c = monero_utils.MLSAG_ver(message, P, rv, kimg);

	expect(Number(c)).toEqual(0);

	xtmp = skvGen(R);
	xm = keyMInit(R, N); // = [[None]*N] #just used to generate test public keys
	sk = skvGen(R);

	for (j = 0; j < R; j++) {
		for (i = 0; i < N; i++) {
			xm[i][j] = monero_utils.skGen();
			P[i][j] = monero_utils.ge_scalarmult_base(xm[i][j]); // generate fake [pubkey, commit]
		}
	}

	sk[1] = skGen(); //assume we don't know one of the private keys..
	kimg = monero_utils.ge_scalarmult(
		monero_utils.hashToPoint(P[ind][0]),
		sk[0],
	);
	rv = monero_utils.MLSAG_Gen(message, P, sk, kimg, ind);
	c = monero_utils.MLSAG_ver(message, P, rv, kimg);

	expect(Number(c)).toBeFalsy();
});
