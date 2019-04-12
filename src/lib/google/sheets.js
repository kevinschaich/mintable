const { google } = require('googleapis')
const oAuth2Client = require('./googleClient')
const _ = require('lodash')
const { logPromise } = require('../logging')
const { updateConfig } = require('../common')

oAuth2Client.setCredentials({
  access_token: process.env.SHEETS_ACCESS_TOKEN,
  refresh_token: process.env.SHEETS_REFRESH_TOKEN,
  scope: process.env.SHEETS_SCOPE,
  token_type: process.env.SHEETS_TOKEN_TYPE,
  expiry_date: process.env.SHEETS_EXPIRY_DATE
})

const sheets = google.sheets({
  version: 'v4',
  auth: oAuth2Client
})

const wrapPromise = (f, args) =>
  new Promise((resolve, reject) => f(args, (error, data) => (error ? reject(error) : resolve(data))))

const getAuthURL = () => {
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets'],
    client_id: process.env.SHEETS_CLIENT_ID,
    redirect_uri: process.env.SHEETS_REDIRECT_URI
  })
}

const getToken = async code => {
  await logPromise(oAuth2Client.getToken(code), `Fetching token for code ${code}`).then(async res => {
    const tokens = await res.tokens
    const updates = await _.mapKeys(tokens, (value, key) => `SHEETS_${key.toUpperCase()}`)
    await updateConfig(updates)
  })
}

const getSheets = async spreadsheetId => {
  return await logPromise(
    wrapPromise(sheets.spreadsheets.get, { spreadsheetId: spreadsheetId }),
    `Fetching sheets for spreadsheet ID ${spreadsheetId}`
  ).then(res => res.data.sheets)
}

const duplicateSheet = async (sourceSpreadsheetId, sourceSheetId) => {
  return await logPromise(
    wrapPromise(sheets.spreadsheets.sheets.copyTo, {
      spreadsheetId: sourceSpreadsheetId,
      sheetId: sourceSheetId,
      resource: { destinationSpreadsheetId: process.env.SHEETS_SHEET_ID }
    }),
    `Duplicating sheet ${sourceSheetId}`
  ).then(res => ({ properties: res.data }))
}

const addSheet = async title => {
  return await logPromise(
    wrapPromise(sheets.spreadsheets.batchUpdate, {
      spreadsheetId: process.env.SHEETS_SHEET_ID,
      resource: { requests: [{ addSheet: { properties: { title } } }] }
    }),
    `Creating new sheet ${title}`
  ).then(res => res.data.replies[0].addSheet)
}

const renameSheet = async (sheetId, title) => {
  return await logPromise(
    wrapPromise(sheets.spreadsheets.batchUpdate, {
      spreadsheetId: process.env.SHEETS_SHEET_ID,
      resource: {
        requests: [{ updateSheetProperties: { properties: { sheetId: sheetId, title: title }, fields: 'title' } }]
      }
    }),
    `Renaming sheet ${title}`
  ).then(res => res.data)
}

const clearSheet = async range => {
  return await logPromise(
    wrapPromise(sheets.spreadsheets.values.clear, { spreadsheetId: process.env.SHEETS_SHEET_ID, range: range }),
    `Clearing range ${range}`
  ).then(res => res)
}

const updateSheet = async updates => {
  return await logPromise(
    wrapPromise(sheets.spreadsheets.values.batchUpdate, {
      spreadsheetId: process.env.SHEETS_SHEET_ID,
      resource: { valueInputOption: `USER_ENTERED`, data: _.map(updates, p => ({ range: p.range, values: p.values })) }
    }),
    `Updating ranges ${_.map(updates, p => p.range).join(', ')}`
  ).then(res => res)
}

const formatHeaderRow = async sheetId => {
  return await logPromise(
    wrapPromise(sheets.spreadsheets.batchUpdate, {
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
  ).then(res => res)
}

const resizeColumns = async (sheetId, numColumns) => {
  return await logPromise(
    wrapPromise(sheets.spreadsheets.batchUpdate, {
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
  ).then(res => res)
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
  resizeColumns
}
