import { ll } from "./nacl-fast-cn";

const {
	ge_add,
	ge_double_scalarmult_base_vartime,
	ge_double_scalarmult_postcomp_vartime,
	ge_scalarmult,
	ge_scalarmult_base,
} = ll;

export {
	ge_add,
	ge_double_scalarmult_base_vartime,
	ge_double_scalarmult_postcomp_vartime,
	ge_scalarmult,
	ge_scalarmult_base,
};
