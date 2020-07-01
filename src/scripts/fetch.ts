import { getConfig } from '../common/config'
import { PlaidIntegration } from '../integrations/plaid/plaidIntegration'
import { GoogleIntegration } from '../integrations/google/googleIntegration'
import { logInfo } from '../common/logging'
import { Account, AccountConfig } from '../types/account'
import { IntegrationId } from '../types/integrations'
import { parseISO, subMonths, startOfMonth } from 'date-fns'
import { CSVImportIntegration } from '../integrations/csv-import/csvImportIntegration'

export default async () => {
    const config = getConfig()

    // Start date to fetch transactions, default to 2 months of history
    let startDate = config.transactions.startDate
        ? parseISO(config.transactions.startDate)
        : startOfMonth(subMonths(new Date(), 2))

    // End date to fetch transactions in YYYY-MM-DD format, default to current date
    let endDate = config.transactions.endDate ? parseISO(config.transactions.endDate) : new Date()

    let accounts: Account[]

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

    switch (config.transactions.integration) {
        case IntegrationId.Google:
            const google = new GoogleIntegration(config)
            return await google.updateAccounts(accounts)
        default:
            return
    }
}
