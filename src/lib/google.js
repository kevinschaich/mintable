const { google } = require('googleapis')
const _ = require('lodash')
const { wrapPromise } = require('./logging')
const { updateConfig } = require('./common')
const pEachSeries = require('p-each-series')

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

const clearRanges = ranges => {
  return wrapPromise(
    promisify(sheets.spreadsheets.values.batchClear, { spreadsheetId: process.env.SHEETS_SHEET_ID, ranges }),
    `Clearing ranges ${ranges.join(', ')}`
  )
}

const updateRanges = updatedRanges =>
  wrapPromise(
    promisify(sheets.spreadsheets.values.batchUpdate, {
      spreadsheetId: process.env.SHEETS_SHEET_ID,
      resource: {
        valueInputOption: `USER_ENTERED`,
        data: updatedRanges
      }
    }),
    `Updating cell ranges ${_.map(updatedRanges, d => d.range).join(', ')}`
  )

const formatSheets = (sheetIds, numColumnsToResize) =>
  wrapPromise(
    promisify(sheets.spreadsheets.batchUpdate, {
      spreadsheetId: process.env.SHEETS_SHEET_ID,
      resource: {
        requests: _.flatten(
          _.map(sheetIds, sheetId => [
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
            },
            {
              autoResizeDimensions: {
                dimensions: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: numColumnsToResize }
              }
            }
          ])
        )
      }
    }),
    `Formatting sheets ${sheetIds.join(', ')}`
  )

const updateSheets = async (updates, options) => {
  const {
    firstTransactionColumn,
    lastTransactionColumn,
    firstReferenceColumn,
    lastReferenceColumn,
    numAutomatedColumns
  } = options

  let sheets = await getSheets(process.env.SHEETS_SHEET_ID)
  const templateSheet = _.find(
    await getSheets(process.env.TEMPLATE_SHEET.SHEET_ID),
    sheet => sheet.properties.title === process.env.TEMPLATE_SHEET.SHEET_TITLE
  )

  const currentSheetTitles = _.map(sheets, sheet => sheet.properties.title)
  const requiredSheetTitles = _.keys(updates)

  // Create, rename, and clear required sheets
  await pEachSeries(_.difference(requiredSheetTitles, currentSheetTitles), async title => {
    const newSheet = await duplicateSheet(process.env.TEMPLATE_SHEET.SHEET_ID, templateSheet.properties.sheetId)
    await renameSheet(newSheet.properties.sheetId, title)
  })

  // Clear automated sheet ranges
  await clearRanges(_.map(requiredSheetTitles, title => `${title}!${firstTransactionColumn}:${lastReferenceColumn}`))

  let updatedRanges = []

  _.forIn(updates, (transactions, sheetTitle) => {
    // Map transactions to ranges & values
    updatedRanges.push({
      range: `${sheetTitle}!${firstTransactionColumn}${2}:${lastTransactionColumn}${transactions.length + 1}`,
      values: _.map(transactions, transaction => _.at(transaction, process.env.TRANSACTION_COLUMNS))
    })

    // Column headers for transaction data
    updatedRanges.push({
      range: `${sheetTitle}!${firstTransactionColumn}1:${lastTransactionColumn}1`,
      values: [process.env.TRANSACTION_COLUMNS]
    })

    // Additional user-defined reference column headers (specify in .env)
    updatedRanges.push({
      range: `${sheetTitle}!${firstReferenceColumn}1:${lastReferenceColumn}1`,
      values: [process.env.REFERENCE_COLUMNS]
    })
  })

  await updateRanges(updatedRanges)

  // Format header rows & resize columns
  const sheetIds = _.map(
    _.pickBy(await getSheets(process.env.SHEETS_SHEET_ID), sheet =>
      _.includes(requiredSheetTitles, sheet.properties.title)
    ),
    sheet => sheet.properties.sheetId
  )

  await formatSheets(sheetIds, numAutomatedColumns)

  console.log(`\nView your spreadsheet at https://docs.google.com/spreadsheets/d/${process.env.SHEETS_SHEET_ID}\n`)
}

module.exports = {
  getAuthURL,
  getToken,
  getSheets,
  duplicateSheet,
  addSheet,
  renameSheet,
  clearRanges,
  updateRanges,
  updateSheets
}
