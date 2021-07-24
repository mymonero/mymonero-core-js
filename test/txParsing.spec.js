'use strict'
const mymonero = require('../')
const assert = require('assert')

describe('sendingFunds tests', function () {
  it('can tell locked reason -- in 5 blocks', function () {
    const blockchain_height = 1231231
    const tx =
	{
		unlock_time: blockchain_height + 5
	}
    const reason = mymonero.monero_txParsing_utils.TransactionLockedReason(tx, blockchain_height)
    assert.strictEqual(0, reason.indexOf('Will be unlocked in 5 blocks, ~5 minutes, Today at'))
  })
  it('can tell locked reason -- timestamp', function () {
    const blockchain_height = mymonero.monero_config.maxBlockNumber
    const tx =
	{
		unlock_time: blockchain_height * 10000
	}
    const reason = mymonero.monero_txParsing_utils.TransactionLockedReason(tx, blockchain_height)
    assert.strictEqual(0, reason.indexOf('Will be unlocked in'))
    assert.notStrictEqual(-1, reason.indexOf('years'))
  })
})
