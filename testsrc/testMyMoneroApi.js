// @flow

import type { QueryParams, SendFundsParams } from '../lib/myMoneroApi.js' 
const { MyMoneroApi } = require('../lib/myMoneroApi.js')
const { randomBytes } = require('crypto')
const fetch = require('node-fetch')
const request = require('request')

const mainAsync = async () => {
    const options = {
        appUserAgentProduct: 'tester',
        appUserAgentVersion: '0.0.1',
        apiServer: 'https://api.mymonero.com:8443',
        fetch,
        request,
        randomBytes
    }
    const myMoneroApi = new MyMoneroApi(options)
    await myMoneroApi.init()
    let result = await myMoneroApi.createWallet()
    console.log('createWallet\n', result)

    result = await myMoneroApi.createWalletFromMnemonic(result.mnemonic)
    console.log('createWalletFromMnemonic\n', result)

    const fixedMnemonic = 'frying lodge yard inundate tirade envy yeti aptitude fall gags future does adult farming total irony slower berries sawmill rabbits ecstatic until unveil washing rabbits'
    result = await myMoneroApi.createWalletFromMnemonic(fixedMnemonic)
    console.log('createWalletFromMnemonic fixed\n', result)

    let out = await myMoneroApi.decodeAddress(result.moneroAddress)
    if (out.err_msg) {
        throw new Error('Should be a valid address')
    }

    let valid = false
    try {
        out = await myMoneroApi.decodeAddress('q9834ytq4ytaliughaweiufh')
        if (!out.err_msg) {
            valid = true
        }
    } catch (e) {}
    if (valid) throw new Error('Should be invalid address')

    const params: QueryParams = {
        moneroAddress: result.moneroAddress,
        moneroSpendKeyPrivate: result.moneroSpendKeyPrivate,
        moneroSpendKeyPublic: result.moneroSpendKeyPublic,
        moneroViewKeyPrivate: result.moneroViewKeyPrivate
    }
    const addrResult = await myMoneroApi.getAddressInfo(params)
    console.log('getAddressInfo\n', addrResult)

    const txResult = await myMoneroApi.getTransactions(params)
    console.log('getAddressInfo\n', txResult)

    const sendParams: SendFundsParams = {
        ...params,
        targetAddress: '45jhDNLrdEC5a3AD27hffq6PGQURhmAtzhFp917rZ7cReDHfzT5wW6ZGE5TSs1Ga94NEna1eczs62HQYTn1QmxGNPkWsHKH',
        floatAmount: .001,
        moneroViewKeyPublic: result.moneroViewKeyPublic,
        nettype: undefined, // 'mainnet' only for now
        isSweepTx: undefined,
        paymentId: undefined,
        priority: undefined,
        doBroadcast: undefined,
        onStatus: (code: number) => {
            console.log(`SendFunds - onStatus:${code.toString()}`)
        }
    }
    
    try {
        const sendResult = await myMoneroApi.sendFunds(sendParams)
        console.log(sendResult)
    } catch (e) {
        console.log(e)
    }
}

mainAsync()