const moment = require('moment')
const _ = require('lodash')

exports.transformTransactionsToUpdates = function(transactions) {
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
