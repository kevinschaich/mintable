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

    let accounts: Account[] = (
        await Promise.all(
            Object.values(config.accounts).map(async (account: AccountConfig) => {
                logInfo(`Fetching account ${account.id} using ${account.integration}.`)

                switch (account.integration) {
                    case IntegrationId.Plaid:
                        const plaid = new PlaidIntegration(config)
                        return await plaid.fetchAccount(account, startDate, endDate)
                    case IntegrationId.CSVImport:
                        const csv = new CSVImportIntegration(config)
                        return await csv.fetchAccount(account, startDate, endDate)
                    default:
                        return
                }
            })
        )
    ).flat()

    switch (config.transactions.integration) {
        case IntegrationId.Google:
            const google = new GoogleIntegration(config)
            return await google.updateAccounts(accounts)
        default:
            return
    }
}
