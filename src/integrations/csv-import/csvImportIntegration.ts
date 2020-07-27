import { Config } from '../../common/config'
import { IntegrationId } from '../../types/integrations'
import { logInfo, logError, logWarn } from '../../common/logging'
import { AccountConfig, Account, CSVAccountConfig } from '../../types/account'
import { Transaction } from '../../types/transaction'
import { CSVImportConfig } from '../../types/integrations/csv-import'
import glob from 'glob'
import { readFileSync } from 'fs'
import parse from 'csv-parse/lib/sync'
import * as dateFns from 'date-fns'

export class CSVImportIntegration {
    config: Config
    CSVImportConfig: CSVImportConfig

    constructor(config: Config) {
        this.config = config
        this.CSVImportConfig = this.config.integrations[IntegrationId.CSVImport] as CSVImportConfig
    }

    public fetchAccount = async (accountConfig: AccountConfig, startDate: Date, endDate: Date): Promise<Account> => {
        return new Promise(async (resolve, reject) => {
            const CSVAccountConfig = accountConfig as CSVAccountConfig

            const account: Account = {
                account: accountConfig.id,
                integration: accountConfig.integration,
                transactions: []
            }

            // parse file globs
            account.transactions = CSVAccountConfig.paths
                .map(path => {
                    try {
                        const files = glob.sync(path)

                        if (files.length === 0) {
                            logError(`No files resolved for path glob ${path}.`)
                        }

                        return files.map(match => {
                            try {
                                const rows = parse(readFileSync(match), {
                                    columns: true,
                                    skip_empty_lines: true
                                })

                                const transactions: Transaction[] = rows.map(inputRow => {
                                    const outputRow = {} as Transaction

                                    Object.keys(CSVAccountConfig.transformer).map(inputColumn => {
                                        // Concatenate multiple columns
                                        if (inputColumn.includes('+')) {
                                            outputRow[CSVAccountConfig.transformer[inputColumn] as string] = inputColumn
                                                .split('+')
                                                .map(c => inputRow[c])
                                                .join(' - ')
                                        } else {
                                            outputRow[CSVAccountConfig.transformer[inputColumn] as string] =
                                                inputRow[inputColumn]
                                        }
                                    })

                                    // Remove spaces/special characters from amount field
                                    if (outputRow.hasOwnProperty('amount')) {
                                        const pattern = new RegExp(`[^0-9\.\-]*`, 'gi')
                                        outputRow['amount'] = parseFloat(outputRow['amount'].toString().replace(pattern, ''))
                                    }

                                    // Parse dates
                                    if (outputRow.hasOwnProperty('date')) {
                                        outputRow['date'] = dateFns.parse(
                                            outputRow['date'].toString(),
                                            CSVAccountConfig.dateFormat,
                                            new Date()
                                        )
                                    }

                                    if (CSVAccountConfig.negateValues === true && outputRow.hasOwnProperty('amount')) {
                                        outputRow['amount'] = -outputRow['amount']
                                    }

                                    if (!outputRow.hasOwnProperty('account')) {
                                        outputRow.account = CSVAccountConfig.id
                                    }

                                    if (!outputRow.hasOwnProperty('pending')) {
                                        outputRow.pending = false
                                    }

                                    return outputRow
                                })

                                logInfo(`Successfully imported transactions from ${match}.`)

                                return transactions.filter(transaction => {
                                    if (transaction.hasOwnProperty('date')) {
                                        return transaction.date >= startDate && transaction.date <= endDate
                                    }
                                    return true
                                })
                            } catch (e) {
                                logError(`Error importing transactions from ${match}.`, e)
                            }
                        })
                    } catch (e) {
                        logError(`Error resolving path glob ${path}.`, e)
                    }
                })
                .flat(10)

            logInfo(`Successfully imported transactions for integration ${IntegrationId.CSVImport}`, account)
            return resolve(account)
        })
    }
}
