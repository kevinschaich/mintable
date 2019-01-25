const { google } = require('googleapis')
const moment = require('moment')
const oAuth2Client = require('./googleClient')

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

exports.getSheets = async function () {
  return new Promise((resolve, reject) => sheets.spreadsheets.get({
    spreadsheetId: process.env.SHEETS_SHEET_ID,
  }, function (err, res) {
    if (err) {
      reject(console.log('Fetch failed:', err))
    }
    console.log(`Success! Fetched current sheets.`)
    resolve(res.data.sheets)
  })
  )
}

exports.addSheet = async function (title) {
  sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.SHEETS_SHEET_ID,
    resource: {
      requests: [
        {
          addSheet: {
            properties: { title }
          }
        }
      ]
    }
  }, (err, res) => {
    if (err) {
      return console.log('Add failed: ', err)
    }
    console.log(`Success! ${title} sheet added.`)
  })
}

exports.clearSheet = async function (title) {
  sheets.spreadsheets.values.clear({
    spreadsheetId: process.env.SHEETS_SHEET_ID,
    range: title
  }, (err, res) => {
    if (err) {
      return console.log('Clear failed: ', err)
    }
    console.log(`Success! ${title} cleared.`)
  })
}

exports.updateSheet = async function (updates) {
  sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: process.env.SHEETS_SHEET_ID,
    resource: {
      valueInputOption: `USER_ENTERED`,
      data: updates.map(p => ({
        range: p.range,
        values: p.values
      }))
    }
  }, (err, res) => {
    if (err) {
      return console.log('Update failed: ', err)
    }
    console.log(`Success! ${res.data.totalUpdatedCells} cells updated.`)
  })
}
