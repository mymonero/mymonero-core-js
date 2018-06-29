declare namespace CNCrypto {
	type Memory = string & { _tag_: "memory" };
	function _malloc(bytes: number): Memory;
	function _free(mem: Memory): mem is never;

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
