import { getConfig } from '../../common/config'
import { logInfo, logError } from '../../common/logging'
import open from 'open'
import { TellerIntegration } from './tellerIntegration'
import { IntegrationId } from '../../types/integrations'
import { TellerConfig } from '../../types/integrations/teller'

export default () => {
    return new Promise((resolve, reject) => {
        try {
            console.log('\nThis script will help you add accounts using Teller.\n')
            console.log('\n\t1. A page will open in your browser allowing you to link accounts with Teller.')
            console.log('\t2. Sign in with your banking provider for each account you wish to link.')
            console.log('\t3. Click \'Done Linking Accounts\' in your browser when you are finished.\n')

            const config = getConfig()
            const tellerConfig = config.integrations[IntegrationId.Teller] as TellerConfig
            const teller = new TellerIntegration(config)

            logInfo('Account setup in progress.')
            open(`http://localhost:8000?tellerAppId=${tellerConfig.appId}`)
            teller.accountSetup()
              .then(() => {
                logInfo('Successfully set up Teller Account(s).')
                return resolve(true)
            })
        } catch (e) {
            logError('Unable to set up Teller Account(s).', e)
            return reject()
        }
    })
}
