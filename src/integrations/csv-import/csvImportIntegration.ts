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

    public fetchAccount = async (accountConfig: AccountConfig): Promise<Account> => {
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
                                const records = parse(readFileSync(match), {
                                    columns: true,
                                    skip_empty_lines: true
                                })

                                const transactions: Transaction[] = records.map(record => {
                                    const newRecord = {}
                                    Object.keys(CSVAccountConfig.transformer).map(column => {
                                        newRecord[CSVAccountConfig.transformer[column]] = record[column]
                                    })

                                    // Parse dates
                                    if (newRecord.hasOwnProperty('date')) {
                                        newRecord['date'] = dateFns.parse(
                                            newRecord['date'],
                                            CSVAccountConfig.dateFormat,
                                            new Date()
                                        )
                                    }
                                    
                                    if (CSVAccountConfig.negateValues === true && newRecord.hasOwnProperty('amount')) {
                                        newRecord['amount'] = -newRecord['amount']
                                    }

                                    newRecord['account'] = CSVAccountConfig.id

                                    return newRecord
                                })

                                logInfo(`Successfully imported transactions from ${match}.`)

                                return transactions
                            } catch (e) {
                                logError(`Error importing transactions from ${match}.`, e)
                            }
                        })
                    } catch (e) {
                        logError(`Error resolving path glob ${path}.`, e)
                    }
                })
                .flat(3)

            logInfo(`Successfully imported transactions for integration ${IntegrationId.CSVImport}`, account)
            return resolve(account)
        })
    }
}
