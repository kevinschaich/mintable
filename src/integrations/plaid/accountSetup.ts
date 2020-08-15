import { getConfig } from '../../common/config'
import { logInfo, logError } from '../../common/logging'
import open from 'open'
import { PlaidIntegration } from './plaidIntegration'
import { IntegrationId } from '../../types/integrations'
import { PlaidConfig } from '../../types/integrations/plaid'

export default async () => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('\nThis script will help you add accounts to Plaid.\n')
            console.log('\n\t1. A page will open in your browser allowing you to link accounts with Plaid.')
            console.log('\t2. Sign in with your banking provider for each account you wish to link.')
            console.log("\t3. Click 'Done Linking Accounts' in your browser when you are finished.\n")

            const config = getConfig()
            const plaidConfig = config.integrations[IntegrationId.Plaid] as PlaidConfig
            const plaid = new PlaidIntegration(config)

            logInfo('Account setup in progress.')
            open(`http://localhost:8000?environment=${plaidConfig.environment}`)
            await plaid.accountSetup()

            logInfo('Successfully set up Plaid Account(s).')
            return resolve()
        } catch (e) {
            logError('Unable to set up Plaid Account(s).', e)
            return reject()
        }
    })
}
