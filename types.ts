import BigInt = require("cryptonote_utils/biginteger");
export const JSBigInt = BigInt.BigInteger;

export type JSBigInt = BigInt.BigInteger;

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
