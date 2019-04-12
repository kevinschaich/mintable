const moment = require('moment')
const { getConfigEnv } = require('../lib/common')

;(async () => {
  await getConfigEnv()

  // Both of these require parameters from config, so we need to lazily load them
  const { updateSheets } = require('../providers/sheets')
  const { getTransactions } = require('../providers/plaid')

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const firstTransactionColumn = alphabet[0]
  const lastTransactionColumn = alphabet[process.env.TRANSACTION_COLUMNS.length - 1]
  const firstReferenceColumn = alphabet[process.env.TRANSACTION_COLUMNS.length]
  const lastReferenceColumn =
    alphabet[process.env.TRANSACTION_COLUMNS.length + process.env.REFERENCE_COLUMNS.length - 1]
  const numAutomatedColumns = process.env.TRANSACTION_COLUMNS.length + process.env.REFERENCE_COLUMNS.length

  const currentMonth = moment().startOf('month')
  const lastMonth = moment()
    .subtract(1, 'month')
    .startOf('month')
  const currentMonthSheetTitle = currentMonth.format('YYYY.MM')
  const lastMonthSheetTitle = lastMonth.format('YYYY.MM')

  let currentMonthTransactions
  let lastMonthTransactions

  switch (process.env.ACCOUNT_PROVIDER) {
    case 'plaid':
      ;({ currentMonthTransactions, lastMonthTransactions } = await getTransactions(
        process.env.TRANSACTION_COLUMNS,
        process.env.CATEGORY_OVERRIDES,
        currentMonthSheetTitle
      ))
      break

    default:
      break
  }

  switch (process.env.SHEET_PROVIDER) {
    case 'sheets':
      await updateSheets(
        currentMonthTransactions,
        lastMonthTransactions,
        process.env.TRANSACTION_COLUMNS,
        process.env.REFERENCE_COLUMNS,
        currentMonthSheetTitle,
        lastMonthSheetTitle,
        firstTransactionColumn,
        lastTransactionColumn,
        firstReferenceColumn,
        lastReferenceColumn,
        numAutomatedColumns
      )
      break

    default:
      break
  }
})()
