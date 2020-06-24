import { updateConfig, getConfig } from '../../common/config'
import prompts from 'prompts'
import { logInfo, logError } from '../../common/logging'
import open from 'open'
import { PlaidIntegration } from './plaidIntegration'
import { argv } from 'yargs'
import { IntegrationId } from '../../types/integrations'
import { PlaidConfig } from '../../types/integrations/plaid'

export default async () => {
    try {
        console.log('\nThis script will help you add accounts to Plaid.')

        const config = getConfig()
        const plaidConfig = config.integrations[IntegrationId.Plaid] as PlaidConfig
        const plaid = new PlaidIntegration(config)

        logInfo('Account setup in progress.')
        open(
            `http://localhost:8000?name=${plaidConfig.name}&environment=${plaidConfig.environment}&publicKey=${plaidConfig.credentials.publicKey}`
        )
        await plaid.addAccount()

        logInfo('Successfully set up Plaid Account(s).')
    } catch (e) {
        logError('Failed to set up Plaid Account(s).', e)
    }
}
