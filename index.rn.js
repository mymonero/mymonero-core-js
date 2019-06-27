const MyMoneroCoreBridgeClass = require("./monero_utils/MyMoneroCoreBridgeClass");
const ASM = require("./monero_utils/MyMoneroCoreCpp_ASMJS.asm.rn");

function initMonero() {
	return new Promise((resolve, reject) => {
		const Module_template = {};
		let Module = {};

		const content = Buffer.from(ASM, "base64").toString("binary");
		try {
			new Function("Module", content)(Module);
		} catch (e) {
			reject(e);
			return;
		}

		setTimeout(function() {
			// "delaying even 1ms is enough to allow compilation memory to be reclaimed"
			Module_template["asm"] = Module["asm"];
			Module = null;
			resolve(
				new MyMoneroCoreBridgeClass(
					require("./monero_utils/MyMoneroCoreCpp_ASMJS.rn")(
						Module_template,
					),
				),
			);
		}, 1);
	});
};

module.exports = {
	monero_utils_promise: initMonero()
}
