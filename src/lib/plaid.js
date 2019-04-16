const moment = require('moment')
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

const fetchTransactions = () => {
  const accounts = getAccountTokens()

  const fetchTransactionsForAccount = account => {
    return wrapPromise(
      PLAID_CLIENT.getTransactions(account.token, ...TRANSACTION_OPTIONS),
      `Fetching transactions for account ${account.nickname}`
    ).then(data => ({
      account: account.nickname,
      transactions: data.transactions.map(transaction => ({
        ...transaction,
        amount: -transaction.amount,
        account: account.nickname
      }))
    }))
  }

  return wrapPromise(pMapSeries(accounts, fetchTransactionsForAccount), 'Fetching transactions for accounts')
}

const fetchBalances = () => {
  const accounts = getAccountTokens()

  const fetchBalanceForAccount = account => {
    return wrapPromise(
      PLAID_CLIENT.getBalance(account.token).then(data => {
        return {
          ...data,
          nickname: account.nickname
        }
      }),
      `Fetching balance for account ${account.nickname}`
    )
  }

  return wrapPromise(pMapSeries(accounts, fetchBalanceForAccount), 'Fetching balances for accounts')
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

const getPlaidTransactions = async (transactionColumns, categoryOverrides, currentMonthSheetTitle) => {
  const sanitizeTransaction = (transaction, accounts) => {
    let sanitized = transaction

    sanitized['account_details'] = _.get(accounts, transaction.account_id, {})

    /*
     * Explode out Plaid's object hierarchy.
     *
     * For example, the Category hierarchy comes as a list,
     * and the first two are usually the only interesting ones.
     *
     * Using defaultTransactionColumns above and _.get():
     *
     *    { "category": ["Food and Drink", "Restaurants"] }
     *
     * would get expanded to:
     *
     *    { "category.0": "Food and Drink", "category.1": "Restaurants" }
     */
    _.forEach(transactionColumns, column => {
      sanitized[column] = _.get(sanitized, column)
    })

    // Map TRUE to 'y' and FALSE to nothing (used for Pending column)
    sanitized.pending = sanitized.pending === true ? 'y' : sanitized.pending
    sanitized.pending = sanitized.pending === false ? '' : sanitized.pending

    // Handle corner case where this was set before v1.0.0 & scripts/migrate.js double escapes it
    categoryOverrides = typeof categoryOverrides === 'string' ? JSON.parse(categoryOverrides) : categoryOverrides

    // Handle category overrides defined in .env
    _.forEach(categoryOverrides, override => {
      if (new RegExp(override.pattern, _.get(override, 'flags', '')).test(sanitized.name)) {
        sanitized['category.0'] = _.get(override, 'category.0', '')
        sanitized['category.1'] = _.get(override, 'category.1', '')
      }
    })

    return sanitized
  }

  const accounts = await fetchBalances()
  const clean_accounts = _.keyBy(_.flatten(_.map(accounts, item => item.accounts)), 'account_id')
  const transactions =_.flatten(_.map(await fetchTransactions(), 'transactions'))
  const sorted = _.sortBy(transactions, 'date')
  const sanitized = _.map(sorted, transaction => sanitizeTransaction(transaction, clean_accounts))
  const partitioned = _.partition(
    sanitized,
    transaction =>
      moment(transaction.date)
        .startOf('month')
        .format('YYYY.MM') ===
      moment()
        .startOf('month')
        .format('YYYY.MM')
  )
  const currentMonthTransactions = _.map(partitioned[0], transaction =>
    _.at(transaction, transactionColumns)
  )
  const lastMonthTransactions = _.map(partitioned[1], transaction =>
    _.at(transaction, transactionColumns)
  )
  return {
    currentMonthTransactions,
    lastMonthTransactions
  }
}

module.exports = {
  fetchBalances,
  fetchTransactions,
  saveAccessToken,
  createPublicToken,
  getPlaidTransactions
}
