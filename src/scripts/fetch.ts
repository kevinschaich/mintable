import { getConfig } from '../common/config'
import { PlaidIntegration } from '../integrations/plaid/plaidIntegration'
import { GoogleIntegration } from '../integrations/google/googleIntegration'
import { logInfo } from '../common/logging'
import { Account, AccountConfig } from '../types/account'
import { IntegrationId } from '../types/integrations'
import { parseISO, subMonths, startOfMonth } from 'date-fns'
import { CSVImportIntegration } from '../integrations/csv-import/csvImportIntegration'
import { CSVExportIntegration } from '../integrations/csv-export/csvExportIntegration'
import { Transaction, TransactionFilter } from '../types/transaction'

export default async () => {
    const config = getConfig()

    // Start date to fetch transactions, default to 2 months of history
    let startDate = config.transactions.startDate
        ? parseISO(config.transactions.startDate)
        : startOfMonth(subMonths(new Date(), 2))

    // End date to fetch transactions in YYYY-MM-DD format, default to current date
    let endDate = config.transactions.endDate ? parseISO(config.transactions.endDate) : new Date()

    let accounts: Account[] = []

    for (const accountId in config.accounts) {
        const accountConfig = config.accounts[accountId]

        logInfo(`Fetching account ${accountConfig.id} using ${accountConfig.integration}.`)

        switch (accountConfig.integration) {
            case IntegrationId.Plaid:
                const plaid = new PlaidIntegration(config)
                accounts = accounts.concat(await plaid.fetchAccount(accountConfig, startDate, endDate))
                break

            case IntegrationId.CSVImport:
                const csv = new CSVImportIntegration(config)
                accounts = accounts.concat(await csv.fetchAccount(accountConfig, startDate, endDate))
                break

            default:
                break
        }
    }

    accounts.flat(10)

    const numTransactions = () =>
        accounts
            .map(account => (account.hasOwnProperty('transactions') ? account.transactions.length : 0))
            .reduce((a, b) => a + b, 0)

    const totalTransactions = numTransactions()

    const transactionMatchesFilters = (transaction: Transaction, filters: TransactionFilter[]): boolean => {
        return filters
            .map(filter => new RegExp(filter.pattern, filter.flags).test(transaction[filter.property]))
            .every(filter => filter === true)
    }

    // Transaction Filters
    if (config.transactions.filters) {
        accounts = accounts.map(account => ({
            ...account,
            transactions: (account.transactions || []).filter(transaction =>
                transactionMatchesFilters(transaction, config.transactions.filters)
            )
        }))

        logInfo(`${numTransactions()} out of ${totalTransactions} total transactions matched filters.`)
    }

    // Transaction Overrides
    if (config.transactions.overrides) {
        accounts = accounts.map(account => ({
            ...account,
            transactions: account.transactions.map(transaction => {
                config.transactions.overrides.forEach(override => {
                    if (transactionMatchesFilters(transaction, override.conditions)) {
                        transaction[override.property] = ((transaction[override.property] || '') as String)
                            .toString()
                            .replace(new RegExp(override.findPattern, override.flags), override.replacePattern)
                    }
                })

                return transaction
            })
        }))

        logInfo(`Overrode ${numTransactions()} transactions out of ${totalTransactions} total transactions.`)
    }

    switch (config.balances.integration) {
        case IntegrationId.Google:
            const google = new GoogleIntegration(config)
            await google.updateBalances(accounts)
            break
        case IntegrationId.CSVExport:
            const csv = new CSVExportIntegration(config)
            await csv.updateBalances(accounts)
            break
        default:
            break
    }

    switch (config.transactions.integration) {
        case IntegrationId.Google:
            const google = new GoogleIntegration(config)
            await google.updateTransactions(accounts)
            break
        case IntegrationId.CSVExport:
            const csv = new CSVExportIntegration(config)
            await csv.updateTransactions(accounts)
            break
        default:
            break
    }
}
