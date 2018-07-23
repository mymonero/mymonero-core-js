import { ViewSendKeys, Output, AmountOutput } from "xmr-types";
import { Log } from "./logger";
import { ERR } from "./errors";
import { BigInt } from "biginteger";

export class WrappedNodeApi {
	private api: any;
	constructor(api: any) {
		this.api = api;
	}

	public unspentOuts(
		address: string,
		privateKeys: ViewSendKeys,
		publicKeys: ViewSendKeys,
		mixin: number,
		isSweeping: boolean,
	) {
		type ResolveVal = {
			unusedOuts: Output[];
			dynamicFeePerKB: BigInt;
		};

		return new Promise<ResolveVal>((resolve, reject) => {
			const { spend: xSpend, view: xView } = privateKeys;
			const { spend: pubSend } = publicKeys;
			const handler = (
				err: Error,
				_: Output[], // unspent outs, the original copy of unusedOuts
				unusedOuts: Output[],
				dynamicFeePerKB: BigInt,
			) => {
				if (err) {
					return reject(err);
				}

				Log.Fee.dynPerKB(dynamicFeePerKB);
				return resolve({
					unusedOuts,
					dynamicFeePerKB,
				});
			};

			this.api.UnspentOuts(
				address,
				xView,
				pubSend,
				xSpend,
				mixin,
				isSweeping,
				handler,
			);
		});
	}

	public randomOuts(usingOuts: Output[], mixin: number) {
		return new Promise<{ mixOuts: AmountOutput[] }>((resolve, reject) => {
			this.api.RandomOuts(
				usingOuts,
				mixin,
				(err: Error, mixOuts: AmountOutput[]) =>
					err ? reject(err) : resolve({ mixOuts }),
			);
		});
	}

	public submitSerializedSignedTransaction(
		address: string,
		privateKeys: ViewSendKeys,
		serializedSignedTx: string,
	) {
		return new Promise<void>((resolve, reject) => {
			this.api.SubmitSerializedSignedTransaction(
				address,
				privateKeys.view,
				serializedSignedTx,
				(err: Error) =>
					err ? reject(ERR.TX.submitUnknown(err)) : resolve(),
			);
		});
	}
}
