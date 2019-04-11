const _ = require('lodash')
const {
  updateSheet,
  clearSheet,
  getSheets,
  formatHeaderRow,
  resizeColumns,
  duplicateSheet,
  renameSheet
} = require('../lib/google/sheets')

exports.updateSheets = async (
  currentMonthTransactions,
  lastMonthTransactions,
  transactionColumns,
  referenceColumns,
  currentMonthSheetTitle,
  lastMonthSheetTitle,
  firstTransactionColumn,
  lastTransactionColumn,
  firstReferenceColumn,
  lastReferenceColumn,
  numAutomatedColumns
) => {
  const publicTemplateSheetId = '10fYhPJzABd8KlgAzxtiyFN-L_SebTvM8SaAK_wHk-Fw'

  const sheets = await getSheets(process.env.SHEETS_SHEET_ID)
  let currentMonthSheet = _.find(sheets, sheet => sheet.properties.title === currentMonthSheetTitle)
  let lastMonthSheet = _.find(sheets, sheet => sheet.properties.title === lastMonthSheetTitle)

  if (!lastMonthSheet) {
    const publicTemplateSheets = await getSheets(publicTemplateSheetId)
    lastMonthSheet = await duplicateSheet(publicTemplateSheetId, publicTemplateSheets[0].properties.sheetId)
    await renameSheet(lastMonthSheet.properties.sheetId, lastMonthSheetTitle)
    await clearSheet(`${lastMonthSheetTitle}!${firstTransactionColumn}:${lastReferenceColumn}`)
  }

  if (!currentMonthSheet) {
    currentMonthSheet = await duplicateSheet(process.env.SHEETS_SHEET_ID, lastMonthSheet.properties.sheetId)
    await renameSheet(currentMonthSheet.properties.sheetId, currentMonthSheetTitle)
    await clearSheet(`${currentMonthSheetTitle}!${firstTransactionColumn}:${lastReferenceColumn}`)
  }

  await clearSheet(`${currentMonthSheetTitle}!${firstTransactionColumn}:${lastTransactionColumn}`)
  await clearSheet(`${lastMonthSheetTitle}!${firstTransactionColumn}:${lastTransactionColumn}`)

  const transformTransactionsToUpdates = (sheetTitle, transactions) => {
    // Transaction data (rows 2 onwards)
    const updates = _.map(transactions, (transaction, i) => {
      const range = `${sheetTitle}!${firstTransactionColumn}${i + 2}:${lastTransactionColumn}${i + 2}`
      const values = [transaction]
      return { range, values }
    })

    // Column headers for transaction data
    updates.push({
      range: `${sheetTitle}!${firstTransactionColumn}1:${lastTransactionColumn}1`,
      values: [transactionColumns]
    })

    // Additional user-defined reference column headers (specify in .env)
    updates.push({
      range: `${sheetTitle}!${firstReferenceColumn}1:${lastReferenceColumn}1`,
      values: [referenceColumns]
    })

    return updates
  }

  await updateSheet(transformTransactionsToUpdates(currentMonthSheetTitle, currentMonthTransactions))
  await updateSheet(transformTransactionsToUpdates(lastMonthSheetTitle, lastMonthTransactions))

  await formatHeaderRow(currentMonthSheet.properties.sheetId)
  await formatHeaderRow(lastMonthSheet.properties.sheetId)

  await resizeColumns(currentMonthSheet.properties.sheetId, numAutomatedColumns)
  await resizeColumns(lastMonthSheet.properties.sheetId, numAutomatedColumns)

  console.log(`\nView your spreadsheet at https://docs.google.com/spreadsheets/d/${process.env.SHEETS_SHEET_ID}\n`)
}
