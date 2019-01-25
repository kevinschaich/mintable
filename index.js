require('dotenv').config()

const { fetchTransactions } = require('./lib/fetch')
const { transformTransactionsToUpdates } = require('./lib/transform')
const { updateSheet, addSheet, clearSheet } = require('./lib/update')

;(async () => {
  console.log('Fetching Transactions...');
  
  const transactions = await fetchTransactions()

  if (transactions.length >= 500) {
    console.error("More than 500 transactions for this month!")
  }

  const updates = transformTransactionsToUpdates(transactions)
  clearSheet("Sheet1")
  updateSheet(updates)
  // addSheet('asdfasdf')
})()
