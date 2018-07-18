export const V7_MIN_MIXIN = 6;

function _mixinToRingsize(mixin: number) {
	return mixin + 1;
}

export function minMixin() {
	return V7_MIN_MIXIN;
}
export function minRingSize() {
	return _mixinToRingsize(minMixin());
}

export function fixedMixin() {
	return minMixin(); /* using the monero app default to remove MM user identifiers */
}
export function fixedRingsize() {
	return _mixinToRingsize(fixedMixin());
}
