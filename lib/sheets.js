const { google } = require('googleapis');
const moment = require('moment');
const oAuth2Client = require('./googleClient');
const _ = require('lodash');

oAuth2Client.setCredentials({
  access_token: process.env.SHEETS_ACCESS_TOKEN,
  refresh_token: process.env.SHEETS_REFRESH_TOKEN,
  scope: process.env.SHEETS_SCOPE,
  token_type: process.env.SHEETS_TOKEN_TYPE,
  expiry_date: process.env.SHEETS_EXPIRY_DATE
});

const sheets = google.sheets({
  version: 'v4',
  auth: oAuth2Client
});

exports.getSheets = async function(spreadsheetId) {
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.get(
      { spreadsheetId },
      (err, res) => {
        if (err) {
          console.log('Fetch failed:', err);
          reject(err);
        }
        console.log(`Success! Fetched current sheets.`);
        resolve(res.data.sheets);
      }
    )
  );
};

exports.duplicateSheet = async function (sourceSpreadsheetId, sourceSheetId) {
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.sheets.copyTo(
      {
        spreadsheetId: sourceSpreadsheetId,
        sheetId: sourceSheetId,
        resource: {
          destinationSpreadsheetId: process.env.SHEETS_SHEET_ID
        }
      },
      (err, res) => {
        if (err) {
          console.log('Copy failed:', err);
          reject(err);
        }
        console.log(`Success! Sheet copied.`);
        resolve({ properties: res.data });
      }
    )
  );
};

exports.addSheet = async function(title) {
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.batchUpdate(
      {
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
      },
      (err, res) => {
        if (err) {
          console.log('Add failed: ', err);
          reject(err);
        }
        console.log(`Success! ${title} sheet added.`);
        resolve(res.data.replies[0].addSheet);
      }
    )
  );
};

exports.renameSheet = async function(sheetId, title) {
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.batchUpdate(
      {
        spreadsheetId: process.env.SHEETS_SHEET_ID,
        resource: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: sheetId,
                  title: title
                },
                fields: 'title'
              }
            }
          ]
        }
      },
      (err, res) => {
        if (err) {
          console.log('Rename failed: ', err);
          reject(err);
        }
        console.log(`Success! ${title} sheet renamed.`);
        resolve(res.data);
      }
    )
  );
};

exports.clearSheet = async function(title) {
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.values.clear(
      {
        spreadsheetId: process.env.SHEETS_SHEET_ID,
        range: title
      },
      (err, res) => {
        if (err) {
          console.log('Clear failed: ', err);
          reject(err);
        }
        console.log(`Success! ${title} cleared.`);
        resolve(res);
      }
    )
  );
};

exports.updateSheet = async function(updates) {
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.values.batchUpdate(
      {
        spreadsheetId: process.env.SHEETS_SHEET_ID,
        resource: {
          valueInputOption: `USER_ENTERED`,
          data: _.map(updates, p => ({
            range: p.range,
            values: p.values
          }))
        }
      },
      (err, res) => {
        if (err) {
          console.log('Update failed: ', err);
          reject(err);
        }
        console.log(`Success! ${res.data.totalUpdatedCells} cells updated.`);
        resolve();
      }
    )
  );
};

exports.formatHeaderRow = async function(sheetId) {
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.batchUpdate(
      {
        spreadsheetId: process.env.SHEETS_SHEET_ID,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.3,
                      green: 0.3,
                      blue: 0.3
                    },
                    horizontalAlignment: 'CENTER',
                    textFormat: {
                      foregroundColor: {
                        red: 1.0,
                        green: 1.0,
                        blue: 1.0
                      },
                      fontSize: 12,
                      bold: true
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
              }
            },
            {
              updateSheetProperties: {
                properties: {
                  sheetId: sheetId,
                  gridProperties: {
                    frozenRowCount: 1
                  }
                },
                fields: 'gridProperties.frozenRowCount'
              }
            }
          ]
        }
      },
      (err, res) => {
        if (err) {
          console.log('Format failed: ', err);
          reject(err);
        }
        console.log(`Success! ${sheetId} sheet formatted.`);
        resolve();
      }
    )
  );
};

exports.resizeColumns = async function(sheetId, numColumns) {
  return new Promise((resolve, reject) =>
    sheets.spreadsheets.batchUpdate(
      {
        spreadsheetId: process.env.SHEETS_SHEET_ID,
        resource: {
          requests: [
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: sheetId,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: numColumns
                }
              }
            }
          ]
        }
      },
      (err, res) => {
        if (err) {
          console.log('Resize failed: ', err);
          reject(err);
        }
        console.log(`Success! ${sheetId} columns resized.`);
        resolve();
      }
    )
  );
};
