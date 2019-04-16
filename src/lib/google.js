const { google } = require('googleapis')
const _ = require('lodash')
const { wrapPromise } = require('./logging')
const { updateConfig } = require('./common')

const OAUTH2_CLIENT = new google.auth.OAuth2(
  process.env.SHEETS_CLIENT_ID,
  process.env.SHEETS_CLIENT_SECRET,
  process.env.SHEETS_REDIRECT_URI
)

OAUTH2_CLIENT.setCredentials({
  access_token: process.env.SHEETS_ACCESS_TOKEN,
  refresh_token: process.env.SHEETS_REFRESH_TOKEN,
  scope: process.env.SHEETS_SCOPE,
  token_type: process.env.SHEETS_TOKEN_TYPE,
  expiry_date: process.env.SHEETS_EXPIRY_DATE
})

const sheets = google.sheets({
  version: 'v4',
  auth: OAUTH2_CLIENT
})

const promisify = (f, args) =>
  new Promise((resolve, reject) => f(args, (error, data) => (error ? reject(error) : resolve(data))))

const getAuthURL = () =>
  wrapPromise(
    new Promise((resolve, reject) => {
      resolve(
        OAUTH2_CLIENT.generateAuthUrl({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/spreadsheets'],
          client_id: process.env.SHEETS_CLIENT_ID,
          redirect_uri: process.env.SHEETS_REDIRECT_URI
        })
      )
    }),
    'Fetching Google Sheets Auth URL'
  )

const getToken = code =>
  wrapPromise(
    OAUTH2_CLIENT.getToken(code).then(res =>
      updateConfig(_.mapKeys(res.tokens, (value, key) => `SHEETS_${key.toUpperCase()}`))
    ),
    `Fetching token for code ${code}`
  )

const getSheets = spreadsheetId =>
  wrapPromise(
    promisify(sheets.spreadsheets.get, { spreadsheetId: spreadsheetId }).then(res => res.data.sheets),
    `Fetching sheets for spreadsheet ID ${spreadsheetId}`
  )

const duplicateSheet = (sourceSpreadsheetId, sourceSheetId) =>
  wrapPromise(
    promisify(sheets.spreadsheets.sheets.copyTo, {
      spreadsheetId: sourceSpreadsheetId,
      sheetId: sourceSheetId,
      resource: { destinationSpreadsheetId: process.env.SHEETS_SHEET_ID }
    }).then(res => ({ properties: res.data })),
    `Duplicating sheet ${sourceSheetId}`
  )

const addSheet = title =>
  wrapPromise(
    promisify(sheets.spreadsheets.batchUpdate, {
      spreadsheetId: process.env.SHEETS_SHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title } } }] }
    }).then(res => res.data.replies[0].addSheet),
    `Creating new sheet ${title}`
  )

const renameSheet = (sheetId, title) =>
  wrapPromise(
    promisify(sheets.spreadsheets.batchUpdate, {
      spreadsheetId: process.env.SHEETS_SHEET_ID,
      resource: {
        requests: [{ updateSheetProperties: { properties: { sheetId: sheetId, title: title }, fields: 'title' } }]
      }
    }).then(res => res.data),
    `Renaming sheet ${title}`
  )

const clearSheet = range => {
  return wrapPromise(
    promisify(sheets.spreadsheets.values.clear, { spreadsheetId: process.env.SHEETS_SHEET_ID, range: range }),
    `Clearing range ${range}`
  )
}

const updateSheet = updates =>
  wrapPromise(
    promisify(sheets.spreadsheets.values.batchUpdate, {
      spreadsheetId: process.env.SHEETS_SHEET_ID,
      resource: {
        valueInputOption: `USER_ENTERED`,
        data: _.map(updates, p => ({ range: p.range, values: p.values }))
      }
    }),
    `Updating cell ranges`
  )

const formatHeaderRow = sheetId =>
  wrapPromise(
    promisify(sheets.spreadsheets.batchUpdate, {
      spreadsheetId: process.env.SHEETS_SHEET_ID,
      resource: {
        requests: [
          {
            repeatCell: {
              range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.3, green: 0.3, blue: 0.3 },
                  horizontalAlignment: 'CENTER',
                  textFormat: { foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 }, fontSize: 12, bold: true }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          },
          {
            updateSheetProperties: {
              properties: { sheetId: sheetId, gridProperties: { frozenRowCount: 1 } },
              fields: 'gridProperties.frozenRowCount'
            }
          }
        ]
      }
    }),
    `Formatting sheet ${sheetId}`
  )

const resizeColumns = (sheetId, numColumns) =>
  wrapPromise(
    promisify(sheets.spreadsheets.batchUpdate, {
      spreadsheetId: process.env.SHEETS_SHEET_ID,
      resource: {
        requests: [
          {
            autoResizeDimensions: {
              dimensions: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: numColumns }
            }
          }
        ]
      }
    }),
    `Resizing columns for sheet ${sheetId}`
  )

const updateSheets = async (
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

module.exports = {
  getAuthURL,
  getToken,
  getSheets,
  duplicateSheet,
  addSheet,
  renameSheet,
  clearSheet,
  updateSheet,
  formatHeaderRow,
  resizeColumns,
  updateSheets
}
