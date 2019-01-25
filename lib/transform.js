const moment = require('moment')
const _ = require('lodash')

exports.transformTransactionsToUpdates = function(transactions) {
  /**
   * Implement your custom logic of transforming transactions into
   * Google Sheet cell updates.
   *
   * Transactions come in the format of:
   * {
   *   account: 'paypal',
   *   name: 'Payment from XXX',
   *   date: 2019-xx-xx,
   *   amount: 123
   * }
   *
   * Updates should be in the form of:
   * {
   *   range: 'A1:B2',
   *   values: [[1,2],[3,4]]
   * }
   *
   * Example: Put each transaction on a line in the spreadsheet.
   * const updates = transactions.map(function(transaction, i) {
   *   return {
   *     range: `A${i + 1}:D${i + 1}`,
   *     values: [Object.values(transaction)]
   *   }
   * });
   *
   */

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

  // See example in comment above.
  const updates = transactions.map((transaction, i) => {
    const range = `${firstCol}${i + 2}:${lastCol}${i + 2}`;
    const values = [properties.map(property => _.get(transaction, property, ''))]
    return { range, values }
  })
  
  updates.push({
    range: `${firstCol}1:${lastCol}1`,
    values: [properties]
  })
  
  // console.log('DEBUG: updates to be made:')
  // console.log(JSON.stringify(updates))
  // console.log(Object.keys(transactions[0]))
  
  return updates
}
