const { google } = require('googleapis')
const moment = require('moment')
const oAuth2Client = require('./googleClient')
const _ = require('lodash')

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
  }, (err, res) => {
    if (err) {
      console.log('Fetch failed:', err)
      reject(err)
    }
    console.log(`Success! Fetched current sheets.`)
    resolve(res.data.sheets)
  }))
}

exports.addSheet = async function (title) {
  return new Promise((resolve, reject) => sheets.spreadsheets.batchUpdate({
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
      console.log('Add failed: ', err)
      reject(err)
    }
    console.log(`Success! ${title} sheet added.`)
    resolve()
  }))
}

exports.clearSheet = async function (title) {
  return new Promise((resolve, reject) => sheets.spreadsheets.values.clear({
    spreadsheetId: process.env.SHEETS_SHEET_ID,
    range: title
  }, (err, res) => {
    if (err) {
      console.log('Clear failed: ', err)
      reject(err)
    }
    console.log(`Success! ${title} cleared.`)
    resolve(res)
  }))
}

exports.updateSheet = async function (updates) {
  return new Promise((resolve, reject) => sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: process.env.SHEETS_SHEET_ID,
    resource: {
      valueInputOption: `USER_ENTERED`,
      data: _.map(updates, p => ({
        range: p.range,
        values: p.values
      }))
    }
  }, (err, res) => {
    if (err) {
      console.log('Update failed: ', err)
      reject(err)
    }
    console.log(`Success! ${res.data.totalUpdatedCells} cells updated.`)
    resolve()
  }))
}
