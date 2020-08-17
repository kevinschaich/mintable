import { Config } from '../../common/config'
import { IntegrationId } from '../../types/integrations'
import { logInfo, logError } from '../../common/logging'
import { Account } from '../../types/account'
import { Transaction } from '../../types/transaction'
import { CSVExportConfig } from '../../types/integrations/csv-export'
import { writeFileSync } from 'fs'
import stringify from 'csv-stringify/lib/sync'
import { format } from 'date-fns'

export class CSVExportIntegration {
    config: Config
    CSVExportConfig: CSVExportConfig

    constructor(config: Config) {
        this.config = config
        this.CSVExportConfig = this.config.integrations[IntegrationId.CSVExport] as CSVExportConfig
    }

    public updateTransactions = async (accounts: Account[]) => {
        try {
            const transactions: Transaction[] = accounts.map(account => account.transactions).flat(10)

            // Format Dates
            const output = transactions.map(transaction => ({
                ...transaction,
                date: format(transaction.date, this.CSVExportConfig.dateFormat || 'yyyy.MM')
            }))

            const data = stringify(output, {
                header: true,
                columns: this.config.transactions.properties
            })

            writeFileSync(this.CSVExportConfig.transactionPath, data)

            logInfo(
                `Successfully exported ${transactions.length} transactions for integration ${IntegrationId.CSVExport}`
            )

            logInfo('You can view your transactions here:\n')
            console.log(`${this.CSVExportConfig.transactionPath}`)
        } catch (error) {
            logError(`Error exporting transactions for integration ${IntegrationId.CSVExport}`, error)
        }
    }

    public updateBalances = async (accounts: Account[]) => {
        try {
            const data = stringify(accounts, {
                header: true,
                columns: this.config.balances.properties
            })

            writeFileSync(this.CSVExportConfig.balancePath, data)

            logInfo(
                `Successfully exported ${accounts.length} account balances for integration ${IntegrationId.CSVExport}`
            )

            logInfo('You can view your account balances here:\n')
            console.log(`${this.CSVExportConfig.balancePath}`)
        } catch (error) {
            logError(`Error exporting account balances for integration ${IntegrationId.CSVExport}`, error)
        }
    }
}
