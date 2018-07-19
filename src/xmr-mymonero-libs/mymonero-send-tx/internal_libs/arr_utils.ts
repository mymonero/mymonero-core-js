export function popRandElement<T>(list: T[]) {
	const idx = Math.floor(Math.random() * list.length);
	const val = list[idx];
	list.splice(idx, 1);
	return val;
}
