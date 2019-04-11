const moment = require('moment')
const { writeConfigProperty } = require('../common')
const plaidClient = require('./plaidClient')
const { logPromise } = require('../logging')
const pMapSeries = require('p-map-series')

// Starting from beginning of last month ensures we fully update pending or revised transactions
const START_DATE = moment()
  .subtract(1, 'month')
  .startOf('month')
  .format('YYYY-MM-DD')
// Ending now keeps the current month up-to-date
const END_DATE = moment().format('YYYY-MM-DD')

const TRANSACTION_OPTIONS = [
  START_DATE,
  END_DATE,
  {
    count: 500,
    offset: 0
  }
]

const getPlaidAccountTokens = () => {
  return Object.keys(process.env)
    .filter(key => key.startsWith(`PLAID_TOKEN`))
    .map(key => ({
      account: key.replace(/^PLAID_TOKEN_/, ''),
      token: process.env[key]
    }))
}

const fetchTransactions = async () => {
  const accounts = getPlaidAccountTokens()

  if (!accounts) {
    return []
  }

  const fetchTransactionsForAccount = async data => {
    return await logPromise(
      plaidClient.getTransactions(data.token, ...TRANSACTION_OPTIONS),
      `Fetching transactions for account ${data.account}`
    ).then(data => ({
      account: data.account,
      transactions: data.transactions.map(transaction => ({
        ...transaction,
        amount: -transaction.amount,
        account: data.account
      }))
    }))
  }

  const transactions = await pMapSeries(accounts, fetchTransactionsForAccount)

  return transactions
}

const fetchBalances = async () => {
  const accounts = getPlaidAccountTokens()

  if (!accounts) {
    return []
  }

  const fetchBalanceForAccount = async data => {
    return await logPromise(plaidClient.getBalance(data.token), `Fetching balance for account ${data.account}`).then(
      data => ({
        ...data,
        nickname: data.account
      })
    )
  }

  return await pMapSeries(accounts, fetchBalanceForAccount)
}

// Exchange token flow - exchange a Link public_token for an API access_token
const saveAccessToken = async (public_token, accountNickname) => {
  return await logPromise(
    plaidClient.exchangePublicToken(public_token),
    `Saving access token for account ${account}`
  ).then(tokenResponse => {
    writeConfigProperty(`PLAID_TOKEN_${accountNickname.toUpperCase()}`, tokenResponse.access_token)
    return false
  })
}

// Exchange an expired API access_token for a new Link public_token
const createPublicToken = async (access_token, accountNickname) => {
  return await logPromise(
    plaidClient.createPublicToken(access_token),
    `Creating public token for account ${accountNickname}`
  ).then(tokenResponse => {
    return tokenResponse.public_token
  })
}

module.exports = {
  getPlaidAccountTokens,
  fetchBalances,
  fetchTransactions,
  saveAccessToken,
  createPublicToken
}
