// @flow

const nettypeUtils = require('../cryptonote_utils/nettype.js')
const parserUtils = require('../hostAPI/response_parser_utils.js')
const sendingFundsUtils = require('../monero_utils/monero_sendingFunds_utils.js')
const HostedMoneroAPIClient = require('../HostedMoneroAPIClient/HostedMoneroAPIClient.Lite.js')
const { BackgroundResponseParser } = require('../HostedMoneroAPIClient/BackgroundResponseParser.web.js')

let _moneroUtils
const MAINNET = nettypeUtils.network_type.MAINNET

export type MyMoneroApiOptions = {
    appUserAgentProduct: string,
    appUserAgentVersion: string,
    apiServer: string,
    fetch: Function,
    request: Function,
    randomBytes: Function,
    apiKey?: string,
}

export type MyMoneroWallet = {
    mnemonic: string,
    moneroAddress: string,
    moneroSpendKeyPrivate: string,
    moneroSpendKeyPublic: string,
    moneroViewKeyPrivate: string,
    moneroViewKeyPublic: string
}

export type BalanceResults = {
    blockHeight: number,
    totalReceived: string,
    totalSent: string
}

export type QueryParams = {
    moneroAddress: string,
    moneroSpendKeyPrivate: string,
    moneroSpendKeyPublic: string,
    moneroViewKeyPrivate: string
}

export type SendFundsParams = QueryParams & {
    targetAddress: string,
    floatAmount: number,
    moneroViewKeyPublic: string,
    nettype?: string, // 'mainnet' only for now
    isSweepTx?: boolean,
    doBroadcast?: boolean,
    paymentId?: string | null,
    priority?: number, // 1-4 (Default is 1. Higher # is higher priority and higher fee )
    onStatus?: (code: number) => void
}

class MyMoneroApi {
    options: MyMoneroApiOptions
    keyImageCache: Object
    hostedMoneroAPIClientContext: Object
    hostedMoneroAPIClient: Object
    moneroUtils: Object

    constructor (options: MyMoneroApiOptions) {
        this.options = options
        this.keyImageCache = {}
        this.moneroUtils = _moneroUtils
        if (options.randomBytes) {
            if (!global) {
                global = {}
            } 
            if (!global.crypto) {
                global.crypto = {}
            }
            if (!global.crypto.randomBytes) {
                global.crypto.randomBytes = options.randomBytes
            }    
        }
        const backgroundAPIResponseParser = new BackgroundResponseParser(_moneroUtils)
        this.hostedMoneroAPIClientContext = {
            backgroundAPIResponseParser,
            HostedMoneroAPIClient_DEBUGONLY_mockSendTransactionSuccess: false,
            isDebug: false
        }
        this.hostedMoneroAPIClient = new HostedMoneroAPIClient({
            fetch: options.fetch,
            // request_conformant_module: options.request,
            appUserAgent_product: 'agent-product',
            appUserAgent_version: '0.0.1',
        }, this.hostedMoneroAPIClientContext)      
    }

    async decodeAddress (address: string): Object {
        return await this.moneroUtils.decode_address(address, MAINNET)
    }
    async createWallet (nettype: any = MAINNET, language: string = 'english'): Promise<MyMoneroWallet> {
        console.log('createWallet')
        const result = await this.moneroUtils.newly_created_wallet(language, nettype)
        const out = {
            mnemonic: result.mnemonic_string,
            moneroAddress: result.address_string,
            moneroSpendKeyPrivate: result.sec_spendKey_string,
            moneroSpendKeyPublic: result.pub_spendKey_string,
            moneroViewKeyPrivate: result.sec_viewKey_string,
            moneroViewKeyPublic: result.pub_viewKey_string        
        }
        return out
    }

    async createWalletFromMnemonic (mnemonic: string, nettype: any = MAINNET, language: string = 'english'): Promise<MyMoneroWallet> {
        console.log('createWalletFromMnemonic')
        const result = await this.moneroUtils.seed_and_keys_from_mnemonic(mnemonic, nettype)
        const out = {
            mnemonic,
            moneroAddress: result.address_string,
            moneroSpendKeyPrivate: result.sec_spendKey_string,
            moneroSpendKeyPublic: result.pub_spendKey_string,
            moneroViewKeyPrivate: result.sec_viewKey_string,
            moneroViewKeyPublic: result.pub_viewKey_string        
        }
        return out
    }

    async getTransactions (queryParams: QueryParams): Promise<Array<Object>> {
        const params = {
            address: queryParams.moneroAddress,
            view_key: queryParams.moneroViewKeyPrivate,
            create_account: true    
        }
        const result = await this.fetchPostMyMonero('get_address_txs', params)
        const parsedTxs = await parserUtils.Parsed_AddressTransactions__async(
            this.keyImageCache,
            result,
            queryParams.moneroAddress,
            queryParams.moneroViewKeyPrivate,
            queryParams.moneroSpendKeyPublic,
            queryParams.moneroSpendKeyPrivate,
            this.moneroUtils
        )
        const transactions = parsedTxs.serialized_transactions
        return transactions
    }

    async getAddressInfo (queryParams: QueryParams): Promise<BalanceResults> {
        const params = {
            address: queryParams.moneroAddress,
            view_key: queryParams.moneroViewKeyPrivate,
            create_account: true    
        }
        const result = await this.fetchPostMyMonero('get_address_info', params)
        const parsedAddrInfo = await parserUtils.Parsed_AddressInfo__async(
            this.keyImageCache,
            result,
            queryParams.moneroAddress,
            queryParams.moneroViewKeyPrivate,
            queryParams.moneroSpendKeyPublic,
            queryParams.moneroSpendKeyPrivate,
            this.moneroUtils
        )
        const out: BalanceResults = {
            blockHeight: parsedAddrInfo.blockchain_height,
            totalReceived: parsedAddrInfo.total_received_String,
            totalSent: parsedAddrInfo.total_sent_String 
        }
        return out
    }

    async sendFunds (params: SendFundsParams) {
        const {
            moneroAddress,
            moneroSpendKeyPrivate,
            moneroSpendKeyPublic,
            moneroViewKeyPrivate,
            moneroViewKeyPublic,
            targetAddress,
            floatAmount,
            nettype, // 'mainnet' only for now
            isSweepTx,
            doBroadcast,
            paymentId = null,
            priority = 1,
            onStatus            
        } = params
        if (nettype && nettype !== 'mainnet') {
            throw new Error('InvalidNetType')
        }
  
        let moneroNettype = MAINNET
        const publicKeys = {
            view: moneroViewKeyPublic,
            spend: moneroSpendKeyPublic
        }
        const privateKeys = {
            view: moneroViewKeyPrivate,
            spend: moneroSpendKeyPrivate
        }

        return new Promise((resolve, reject) => {
            const onSuccess = (
                moneroReady_targetDescription_address,
				sentAmount,
				final__payment_id,
				tx_hash,
				tx_fee,
				tx_key,
				mixin
            ) => {
                const out = {
                    targetAddress: moneroReady_targetDescription_address,
                    sentAmount: sentAmount.toString(),
                    // final__payment_id,
                    txid: tx_hash,
                    networkFee: tx_fee.toString(),
                    // tx_key,
                    mixin    
                }
                resolve(out)
            }
    
            const onError = (error: string) => {
                reject(new Error(error))
            }

            const onStatusLocal = (status: number) => {
                if (onStatus) {
                    onStatus(status)
                }
            }
    
            const isSweep: boolean = isSweepTx ? true : false
            if (doBroadcast) {
                this.hostedMoneroAPIClientContext.HostedMoneroAPIClient_DEBUGONLY_mockSendTransactionSuccess = false
                this.hostedMoneroAPIClientContext.isDebug = false
            } else {
                this.hostedMoneroAPIClientContext.HostedMoneroAPIClient_DEBUGONLY_mockSendTransactionSuccess = true
                this.hostedMoneroAPIClientContext.isDebug = true
            }
            sendingFundsUtils.SendFunds(
                targetAddress,
                moneroNettype,
                floatAmount,
                isSweep,
                moneroAddress,
                privateKeys,
                publicKeys,
                this.hostedMoneroAPIClient,
                paymentId,
                priority,
                onStatusLocal,
                onSuccess,
                onError
            )
        })
    }

    // Private routines
    // ----------------

    async fetchPost (url: string, options: Object) {
        const opts = Object.assign({}, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }, options)
    
        const response = await this.options.fetch(url, opts)
        if (!response.ok) {
            // const cleanUrl = url.replace(this.moneroApiKey, 'private')
            throw new Error(
                `The server returned error code ${response.status} for ${url}`
            )
        }
        return response.json()
    }
        
    async fetchPostMyMonero (cmd: string, params: Object = {}) {
        const options = {
            body: JSON.stringify(params)
        }
        const url = `${this.options.apiServer}/${cmd}`
        return this.fetchPost(url, options)
    }
}

const myMoneroApiFactory = (moneroUtils: Object) => {
    _moneroUtils = moneroUtils
    return MyMoneroApi
}
module.exports = { myMoneroApiFactory }