import { getConfig } from '../common/config'
import { PlaidIntegration } from '../integrations/plaid/plaidIntegration'
import { GoogleIntegration } from '../integrations/google/googleIntegration'
import { logInfo } from '../common/logging'
import { Account, AccountConfig } from '../types/account'
import { IntegrationId } from '../types/integrations'
const { parseISO, subMonths, startOfMonth } = require('date-fns')

export default async () => {
    const config = getConfig()
    const plaid = new PlaidIntegration(config)
    const google = new GoogleIntegration(config)

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
                        return await plaid.fetchAccount(account, startDate, endDate)
                    default:
                        return
                }
            })
        )
    ).flat()

    switch (config.transactions.integration) {
        case IntegrationId.Google:
            return await google.updateAccounts(accounts)
        default:
            return
    }
}
