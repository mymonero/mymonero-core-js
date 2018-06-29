"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nacl_fast_cn_1 = require("./nacl-fast-cn");
const { ge_add, ge_double_scalarmult_base_vartime, ge_double_scalarmult_postcomp_vartime, ge_scalarmult, ge_scalarmult_base, } = nacl_fast_cn_1.ll;
exports.ge_add = ge_add;
exports.ge_double_scalarmult_base_vartime = ge_double_scalarmult_base_vartime;
exports.ge_double_scalarmult_postcomp_vartime = ge_double_scalarmult_postcomp_vartime;
exports.ge_scalarmult = ge_scalarmult;
exports.ge_scalarmult_base = ge_scalarmult_base;
