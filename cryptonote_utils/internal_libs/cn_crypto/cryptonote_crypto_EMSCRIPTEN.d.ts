declare namespace CNCrypto {
	function _malloc(bytes: number): number;
	function _free(mem: number): mem is never;

	var HEAPU8: Uint8Array;

	function ccall(
		functionName: string,
		returnType: string | null,
		argTypes: string[],
		args: any[],
	): any;

	function cwrap(
		ident: string,
		returnType: string | null,
		argTypes: string[],
	): any;
}

export = CNCrypto;
