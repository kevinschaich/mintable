"use strict";
exports.__esModule = true;
var googleapis_1 = require("googleapis");
// const pEachSeries = require('p-each-series')
var config_1 = require("../../lib/config");
var integrations_1 = require("../../types/integrations");
var promisify = function (f, args) {
    return new Promise(function (resolve, reject) { return f(args, function (error, data) { return (error ? reject(error) : resolve(data)); }); });
};
var GoogleIntegration = /** @class */ (function () {
    function GoogleIntegration(config) {
        var _this = this;
        this.getAuthURL = function () {
            return _this.client.generateAuthUrl({
                scope: _this.googleConfig.credentials.scope
            });
        };
        this.getAccessTokens = function (authCode) {
            return _this.client.getToken(authCode).then(function (response) { return response.tokens; });
        };
        this.saveAccessTokens = function (tokens) {
            config_1.updateConfig(function (config) {
                var googleConfig = config.integrations[integrations_1.IntegrationId.Google];
                googleConfig.credentials.accessToken = tokens.access_token;
                googleConfig.credentials.refreshToken = tokens.refresh_token;
                googleConfig.credentials.tokenType = tokens.token_type;
                googleConfig.credentials.expiryDate = tokens.expiry_date;
                config.integrations[integrations_1.IntegrationId.Google] = googleConfig;
                return config;
            });
        };
        this.config = config;
        this.googleConfig = config.integrations[integrations_1.IntegrationId.Google];
        this.client = new googleapis_1.google.auth.OAuth2(this.googleConfig.credentials.clientId, this.googleConfig.credentials.clientSecret, this.googleConfig.credentials.redirectUri);
        this.client.setCredentials({
            access_token: this.googleConfig.credentials.accessToken,
            refresh_token: this.googleConfig.credentials.refreshToken,
            // scope: this.googleConfig.credentials.scope,
            token_type: this.googleConfig.credentials.tokenType,
            expiry_date: this.googleConfig.credentials.expiryDate
        });
        this.sheets = googleapis_1.google.sheets({
            version: 'v4',
            auth: this.client
        });
    }
    return GoogleIntegration;
}());
exports.GoogleIntegration = GoogleIntegration;
// const getSheets = spreadsheetId =>
//   promisify(sheets.spreadsheets.get, { spreadsheetId: spreadsheetId }).then(res => res.data.sheets)
// const duplicateSheet = (sourceSpreadsheetId, sourceSheetId) =>
//   promisify(sheets.spreadsheets.sheets.copyTo, {
//     spreadsheetId: sourceSpreadsheetId,
//     sheetId: sourceSheetId,
//     resource: { destinationSpreadsheetId: process.env.SHEETS_SHEET_ID }
//   }).then(res => ({ properties: res.data }))
// const addSheet = title =>
//   promisify(sheets.spreadsheets.batchUpdate, {
//     spreadsheetId: process.env.SHEETS_SHEET_ID,
//     resource: { requests: [{ addSheet: { properties: { title } } }] }
//   }).then(res => res.data.replies[0].addSheet)
// const renameSheet = (sheetId, title) =>
//   promisify(sheets.spreadsheets.batchUpdate, {
//     spreadsheetId: process.env.SHEETS_SHEET_ID,
//     resource: {
//       requests: [{ updateSheetProperties: { properties: { sheetId: sheetId, title: title }, fields: 'title' } }]
//     }
//   }).then(res => res.data)
// const clearRanges = ranges =>
//   promisify(sheets.spreadsheets.values.batchClear, { spreadsheetId: process.env.SHEETS_SHEET_ID, ranges })
// const updateRanges = updatedRanges =>
//   promisify(sheets.spreadsheets.values.batchUpdate, {
//     spreadsheetId: process.env.SHEETS_SHEET_ID,
//     resource: {
//       valueInputOption: `USER_ENTERED`,
//       data: updatedRanges
//     }
//   })
// const formatSheets = (sheetIds, numColumnsToResize) =>
//   promisify(sheets.spreadsheets.batchUpdate, {
//     spreadsheetId: process.env.SHEETS_SHEET_ID,
//     resource: {
//       requests: _.flatten(
//         _.map(sheetIds, sheetId => [
//           {
//             repeatCell: {
//               range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1 },
//               cell: {
//                 userEnteredFormat: {
//                   backgroundColor: { red: 0.3, green: 0.3, blue: 0.3 },
//                   horizontalAlignment: 'CENTER',
//                   textFormat: { foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 }, fontSize: 12, bold: true }
//                 }
//               },
//               fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
//             }
//           },
//           {
//             updateSheetProperties: {
//               properties: { sheetId: sheetId, gridProperties: { frozenRowCount: 1 } },
//               fields: 'gridProperties.frozenRowCount'
//             }
//           },
//           {
//             autoResizeDimensions: {
//               dimensions: { sheetId: sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: numColumnsToResize }
//             }
//           }
//         ])
//       )
//     }
//   })
// const sortSheets = order =>
//   promisify(sheets.spreadsheets.batchUpdate, {
//     spreadsheetId: process.env.SHEETS_SHEET_ID,
//     resource: {
//       requests: _.flatten(
//         _.map(order, sheetId => [
//           {
//             updateSheetProperties: {
//               properties: { sheetId: sheetId[0], index: sheetId[1] },
//               fields: 'index'
//             }
//           }
//         ])
//       )
//     }
//   })
// const updateSheets = async (updates, options) => {
//   const {
//     firstTransactionColumn,
//     lastTransactionColumn,
//     firstReferenceColumn,
//     lastReferenceColumn,
//     numAutomatedColumns
//   } = options
//   let sheets = await getSheets(process.env.SHEETS_SHEET_ID)
//   const templateSheet = _.find(
//     await getSheets(process.env.TEMPLATE_SHEET.SHEET_ID),
//     sheet => sheet.properties.title === process.env.TEMPLATE_SHEET.SHEET_TITLE
//   )
//   const currentSheetTitles = _.map(sheets, sheet => sheet.properties.title)
//   const requiredSheetTitles = _.keys(updates)
//   // Create, rename, and clear required sheets
//   await pEachSeries(_.difference(requiredSheetTitles, currentSheetTitles), async title => {
//     const newSheet = await duplicateSheet(process.env.TEMPLATE_SHEET.SHEET_ID, templateSheet.properties.sheetId)
//     await renameSheet(newSheet.properties.sheetId, title)
//   })
//   // Clear automated sheet ranges
//   await clearRanges(_.map(requiredSheetTitles, title => `${title}!${firstTransactionColumn}:${lastTransactionColumn}`))
//   let updatedRanges = []
//   _.forIn(updates, (transactions, sheetTitle) => {
//     // Map transactions to ranges & values
//     updatedRanges.push({
//       range: `${sheetTitle}!${firstTransactionColumn}${2}:${lastTransactionColumn}${transactions.length + 1}`,
//       values: _.map(transactions, transaction => _.at(transaction, process.env.TRANSACTION_COLUMNS))
//     })
//     // Column headers for transaction data
//     updatedRanges.push({
//       range: `${sheetTitle}!${firstTransactionColumn}1:${lastTransactionColumn}1`,
//       values: [process.env.TRANSACTION_COLUMNS]
//     })
//     // Additional user-defined reference column headers (specify in .env)
//     updatedRanges.push({
//       range: `${sheetTitle}!${firstReferenceColumn}1:${lastReferenceColumn}1`,
//       values: [process.env.REFERENCE_COLUMNS]
//     })
//   })
//   await updateRanges(updatedRanges)
//   // Format header rows & resize columns
//   const sheetIds = _.map(
//     _.pickBy(await getSheets(process.env.SHEETS_SHEET_ID), sheet =>
//       _.includes(requiredSheetTitles, sheet.properties.title)
//     ),
//     sheet => sheet.properties.sheetId
//   )
//   await formatSheets(sheetIds, numAutomatedColumns)
//   const sorted = _.map(
//     _.reverse(_.sortBy(await getSheets(process.env.SHEETS_SHEET_ID), sheet => sheet.properties.title)),
//     (sheet, i) => [sheet.properties.sheetId, i]
//   )
//   await sortSheets(sorted)
//   console.log(`\nView your spreadsheet at https://docs.google.com/spreadsheets/d/${process.env.SHEETS_SHEET_ID}\n`)
// }
