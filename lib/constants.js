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
const transactionColumns = `${firstCol}:${lastCol}`

module.exports = {
  properties, firstCol, lastCol, transactionColumns
}