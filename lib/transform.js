const moment = require('moment')
const _ = require('lodash')
const {firstCol, lastCol, properties} = require('constants')

exports.transformTransactionsToUpdates = async function (sheetTitle, transactions) {
  console.log(transactions.length)
  const updates = _.map(transactions, (transaction, i) => {
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
