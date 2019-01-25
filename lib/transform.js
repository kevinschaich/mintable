const moment = require('moment')
const _ = require('lodash')

exports.transformTransactionsToUpdates = function (sheetTitle, transactions) {
  const properties = [
    'date',
    'amount',
    'name',
    'account',
    'category.0',
    'category.1',
    'pending',
  ]

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const firstCol = alphabet[0]
  const lastCol = alphabet[properties.length - 1]

  const updates = transactions.map((transaction, i) => {
    const range = `${sheetTitle}!${firstCol}${i + 2}:${lastCol}${i + 2}`;
    const values = [properties.map(property => _.get(transaction, property, ''))]
    return { range, values }
  })

  updates.push({
    range: `${sheetTitle}!${firstCol}1:${lastCol}1`,
    values: [properties]
  })

  return updates
}
