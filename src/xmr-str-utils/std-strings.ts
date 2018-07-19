export function trimRight(str: string, char: string) {
	while (str[str.length - 1] == char) str = str.slice(0, -1);
	return str;
}

export function padLeft(str: string, len: number, char: string) {
	while (str.length < len) {
		str = char + str;
	}
	return str;
}
