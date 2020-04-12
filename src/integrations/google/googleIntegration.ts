import { google, sheets_v4 } from 'googleapis'
import { Config, updateConfig } from '../../lib/config'
import { IntegrationId } from '../../types/integrations'
import { GoogleConfig } from '../../types/integrations/google'
import { OAuth2Client, Credentials } from 'google-auth-library'
import { logInfo, logError } from '../../lib/logging'
import { Transaction } from '../../types/transaction'

export interface Range {
    sheet: string
    start: string
    end: string
}

export interface DataRange {
    range: Range
    data: any[][]
}

export class GoogleIntegration {
    config: Config
    googleConfig: GoogleConfig
    client: OAuth2Client
    sheets: sheets_v4.Resource$Spreadsheets

    constructor(config: Config) {
        this.config = config
        this.googleConfig = config.integrations[IntegrationId.Google] as GoogleConfig

        this.client = new google.auth.OAuth2(
            this.googleConfig.credentials.clientId,
            this.googleConfig.credentials.clientSecret,
            this.googleConfig.credentials.redirectUri
        )

        this.client.setCredentials({
            access_token: this.googleConfig.credentials.accessToken,
            refresh_token: this.googleConfig.credentials.refreshToken,
            // scope: this.googleConfig.credentials.scope,
            token_type: this.googleConfig.credentials.tokenType,
            expiry_date: this.googleConfig.credentials.expiryDate
        })

        this.sheets = google.sheets({
            version: 'v4',
            auth: this.client
        }).spreadsheets
    }

    public getAuthURL = (): string =>
        this.client.generateAuthUrl({
            scope: this.googleConfig.credentials.scope
        })

    public getAccessTokens = (authCode: string): Promise<Credentials> =>
        this.client.getToken(authCode).then(response => response.tokens)

    public saveAccessTokens = (tokens: Credentials): void => {
        updateConfig(config => {
            let googleConfig = config.integrations[IntegrationId.Google] as GoogleConfig

            googleConfig.credentials.accessToken = tokens.access_token
            googleConfig.credentials.refreshToken = tokens.refresh_token
            googleConfig.credentials.tokenType = tokens.token_type
            googleConfig.credentials.expiryDate = tokens.expiry_date

            config.integrations[IntegrationId.Google] = googleConfig

            return config
        })
    }

    public getSheets = (): Promise<sheets_v4.Schema$Sheet[]> => {
        return this.sheets
            .get({ spreadsheetId: this.googleConfig.documentId })
            .then(res => {
                logInfo(
                    `Fetched ${res.data.sheets.length} sheets for spreadsheet ${this.googleConfig.documentId}.`,
                    res.data.sheets
                )
                return res.data.sheets
            })
            .catch(error => {
                logError(`Error fetching sheets for spreadsheet ${this.googleConfig.documentId}.`, error)
                return []
            })
    }

    public copySheet = async (title: string, sourceDocumentId?: string): Promise<sheets_v4.Schema$SheetProperties> => {
        const sheets = await this.getSheets()
        const sourceSheetId = sheets.find(sheet => sheet.properties.title === title).properties.sheetId

        return this.sheets.sheets
            .copyTo({
                spreadsheetId: sourceDocumentId || this.googleConfig.documentId,
                sheetId: sourceSheetId,
                requestBody: { destinationSpreadsheetId: this.googleConfig.documentId }
            })
            .then(res => {
                logInfo(`Copied sheet ${title}.`, res.data)
                return res.data
            })
            .catch(error => {
                logError(`Error copying sheet ${title}.`, error)
                return {}
            })
    }

    public addSheet = (title: string): Promise<sheets_v4.Schema$SheetProperties> => {
        return this.sheets
            .batchUpdate({
                spreadsheetId: this.googleConfig.documentId,
                requestBody: { requests: [{ addSheet: { properties: { title } } }] }
            })
            .then(res => {
                logInfo(`Added sheet ${title}.`, res.data)
                return res.data.replies[0].addSheet.properties
            })
            .catch(error => {
                logError(`Error adding sheet ${title}.`, error)
                return {}
            })
    }

    public renameSheet = async (oldTitle: string, newTitle: string): Promise<sheets_v4.Schema$Response[]> => {
        const sheets = await this.getSheets()
        const sheetId = sheets.find(sheet => sheet.properties.title === oldTitle).properties.sheetId

        return this.sheets
            .batchUpdate({
                spreadsheetId: this.googleConfig.documentId,
                requestBody: {
                    requests: [
                        {
                            updateSheetProperties: {
                                properties: { sheetId: sheetId, title: newTitle },
                                fields: 'title'
                            }
                        }
                    ]
                }
            })
            .then(res => {
                logInfo(`Renamed sheet ${oldTitle} to ${newTitle}.`, res.data)
                return res.data.replies
            })
            .catch(error => {
                logError(`Error renaming sheet ${oldTitle} to ${newTitle}.`, error)
                return []
            })
    }

    public translateRange = (range: Range): string =>
        `${range.sheet}!${range.start.toUpperCase()}:${range.end.toUpperCase()}`

    public translateRanges = (ranges: Range[]): string[] => ranges.map(this.translateRange)

    public clearRanges = (ranges: Range[]): Promise<sheets_v4.Schema$BatchClearValuesResponse> => {
        const translatedRanges = this.translateRanges(ranges)
        return this.sheets.values
            .batchClear({
                spreadsheetId: this.googleConfig.documentId,
                requestBody: { ranges: translatedRanges }
            })
            .then(res => {
                logInfo(`Cleared ${ranges.length} ranges ${translatedRanges}.`, res.data)
                return res.data
            })
            .catch(error => {
                logError(`Error clearing ${ranges.length} ranges ${translatedRanges}.`, error)
                return {}
            })
    }

    public updateRanges = (dataRanges: DataRange[]): Promise<sheets_v4.Schema$BatchUpdateValuesResponse> => {
        return this.sheets.values
            .batchUpdate({
                spreadsheetId: this.googleConfig.documentId,
                requestBody: {
                    valueInputOption: `USER_ENTERED`,
                    data: dataRanges.map(dataRange => ({
                        range: this.translateRange(dataRange.range),
                        values: dataRange.data
                    }))
                }
            })
            .then(res => {
                logInfo(`Updated ${dataRanges.length} ranges.`, res.data)
                return res.data
            })
            .catch(error => {
                logError(`Error updating ${dataRanges.length}.`, error)
                return {}
            })
    }

    public getRowWithDefaults = (row: { [key: string]: any }, columns, defaultValue: any = null): any[] => {
        return columns.reduce((output, key) => {
            row && row.hasOwnProperty(key) ? output.push(row[key]) : output.push(defaultValue)
            return output
        }, [])
    }

    public writeRows = async (
        sheet: string,
        rows: { [key: string]: any }[],
        columns?: string[]
    ): Promise<sheets_v4.Schema$BatchUpdateValuesResponse> => {
        columns = columns || Object.keys(rows[0])

        const columnHeaders = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

        const range = {
            sheet: sheet,
            start: `A1`,
            end: `${columnHeaders[columns.length]}${rows.length + 1}`
        }
        const data = [columns].concat(rows.map(row => this.getRowWithDefaults(row, columns)))

        await this.clearRanges([range])
        return this.updateRanges([{ range, data }])
    }

    public writeTransactions = (sheet: string, transactions: Transaction[]) =>
        this.writeRows(sheet, transactions, this.config.transactions.properties)
}

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
