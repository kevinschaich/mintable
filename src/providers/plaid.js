const moment = require('moment')
const _ = require('lodash')
const { fetchTransactions, fetchBalances } = require('../lib/plaid/plaid')

exports.getTransactions = async (transactionColumns, categoryOverrides, currentMonthSheetTitle) => {
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

  const transactions = await fetchTransactions()
  const sorted = _.sortBy(transactions, 'date')
  const sanitized = _.map(sorted, transaction => sanitizeTransaction(transaction, clean_accounts))

  const partitioned = _.partition(
    sanitized,
    transaction =>
      moment(transaction.date)
        .startOf('month')
        .format('YYYY.MM') === currentMonthSheetTitle
  )

  return {
    currentMonthTransactions: _.map(partitioned[0], transaction => _.at(transaction, transactionColumns)),
    lastMonthTransactions: _.map(partitioned[1], transaction => _.at(transaction, transactionColumns))
  }
}
