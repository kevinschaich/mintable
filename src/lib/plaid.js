const { parse, format } = require('date-fns')
const { updateConfig, getAccountTokens } = require('./common')
const { wrapPromise } = require('./logging')
const pMapSeries = require('p-map-series')
const plaid = require('plaid')
const _ = require('lodash')

const environment = () => {
  switch (process.env.PLAID_ENVIRONMENT) {
    case 'sandbox':
      return plaid.environments.sandbox
    case 'production':
      return plaid.environments.production
    default:
      return plaid.environments.development
  }
}

const PLAID_CLIENT = new plaid.Client(
  process.env.PLAID_CLIENT_ID,
  process.env.PLAID_SECRET,
  process.env.PLAID_PUBLIC_KEY,
  environment(),
  {
    version: '2018-05-22'
  }
)

const fetchTransactions = (startDate, endDate, pageSize, offset) => {
  const accounts = getAccountTokens()

  const options = [
    format(startDate, 'YYYY-MM-DD'),
    format(endDate, 'YYYY-MM-DD'),
    {
      count: pageSize,
      offset: offset
    }
  ]

  const fetchTransactionsForAccount = account => {
    return wrapPromise(
      PLAID_CLIENT.getTransactions(account.token, ...options),
      `Fetching transactions for account ${account.nickname}`
    ).then(data => ({
      account: account.nickname,
      transactions: data.transactions.map(transaction => ({
        ...transaction,
        amount: -transaction.amount,
        accountNickname: account.nickname
      }))
    }))
  }

  return wrapPromise(pMapSeries(accounts, fetchTransactionsForAccount), 'Fetching transactions for accounts')
}

const fetchBalances = options => {
  const accounts = getAccountTokens()

  const fetchBalanceForAccount = account => {
    return wrapPromise(
      PLAID_CLIENT.getBalance(account.token).then(data => {
        return {
          ...data,
          nickname: account.nickname
        }
      }).catch(error => {
        return { nickname: account.nickname, error: JSON.stringify(error, null, 2) }
      }),
      `Fetching balance for account ${account.nickname}`,
      options
    )
  }

  return wrapPromise(pMapSeries(accounts, fetchBalanceForAccount), 'Fetching balances for accounts', options)
}

// Exchange token flow - exchange a Link public_token for an API access_token
const saveAccessToken = (public_token, accountNickname) => {
  return wrapPromise(
    PLAID_CLIENT.exchangePublicToken(public_token).then(tokenResponse =>
      updateConfig({ [`PLAID_TOKEN_${accountNickname.toUpperCase()}`]: tokenResponse.access_token })
    ),
    `Saving access token for account ${accountNickname}`
  )
}

// Exchange an expired API access_token for a new Link public_token
const createPublicToken = (access_token, accountNickname) => {
  return wrapPromise(
    PLAID_CLIENT.createPublicToken(access_token).then(tokenResponse => {
      return tokenResponse.public_token
    }),
    `Creating public token for account ${accountNickname}`
  )
}

const fetchAllCleanTransactions = async (startDate, endDate, pageSize = 250, offset = 0) => {
  let transactions = []
  let count = pageSize
  let pageNumber = 0

  // If we receive a full page of transactions from Plaid, that means there is more data to fetch
  while (count === pageSize) {
    const result = await fetchTransactions(startDate, endDate, pageSize, pageNumber * pageSize)
    const clean = _.flatten(_.map(result, account => account.transactions))

    transactions = transactions.concat(clean)

    count = clean.length
    pageNumber++
  }

  // Parse transaction date string into a Date object and clean up Pending column
  transactions = _.map(transactions, transaction => ({
    ...transaction,
    date: parse(transaction.date),
    pending: transaction.pending === true ? 'y' : ''
  }))

  // Handle category overrides defined in config
  if (process.env.CATEGORY_OVERRIDES) {
    // Handle corner case where this was set before v1.0.0 & scripts/migrate.js double escapes it
    categoryOverrides =
      typeof process.env.CATEGORY_OVERRIDES === 'string'
        ? JSON.parse(process.env.CATEGORY_OVERRIDES)
        : process.env.CATEGORY_OVERRIDES

    transactions = _.map(transactions, transaction => {
      _.forEach(categoryOverrides, override => {
        if (new RegExp(override.pattern, _.get(override, 'flags', '')).test(transaction.name)) {
          transaction['category.0'] = _.get(override, 'category.0', '')
          transaction['category.1'] = _.get(override, 'category.1', '')
        }
      })
      return transaction
    })
  }

  // Fetch accounts & names
  const accounts = _.keyBy(_.flatten(_.map(await fetchBalances(), item => item.accounts)), 'account_id')

  // Join in account details to transactions
  transactions = _.map(transactions, transaction => {
    const account = accounts[transaction.account_id]
    return {
      ..._.omit(transaction, ['accountNickname']),
      account_details: {
        official_name: account.official_name,
        name: account.name,
        nickname: transaction.accountNickname
      },
      account: account.official_name || account.name || transaction.accountNickname
    }
  })

  return transactions
}

module.exports = {
  fetchBalances,
  fetchTransactions,
  saveAccessToken,
  createPublicToken,
  fetchAllCleanTransactions
}
