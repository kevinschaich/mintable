import { TellerConfig, defaultTellerConfig } from '../../types/integrations/teller'
import { updateConfig } from '../../common/config'
import { IntegrationId } from '../../types/integrations'
import prompts from 'prompts'
import { logInfo, logError } from '../../common/logging'

export default async () => {
    try {
        console.log('\nThis script will walk you through setting up the Teller integration. Follow these steps:')
        console.log('\n\t1. Visit https://teller.io')
        console.log('\t2. Click \'Get Started\'')
        console.log('\t3. Fill out the form')
        console.log('\t4. Find the application ID, and download the certificate and private key')
        console.log('\t5. Answer the following questions:\n')


        const credentials = await prompts([
            {
                type: 'text',
                name: 'name',
                message: 'What would you like to call this integration?',
                initial: 'Teller',
                validate: (s: string) =>
                    1 < s.length && s.length <= 64 ? true : 'Must be between 2 and 64 characters in length.'
            },
            {
                type: 'text',
                name: 'pathCertificate',
                message: 'Path to Certificate',
                validate: (s: string) => (s.length ? true : 'Must enter path to certificate file.')
            },
            {
                type: 'text',
                name: 'pathPrivateKey',
                message: 'Path to Private Key',
                validate: (s: string) => (s.length ? true : 'Must enter path to private key file.')
            },
            {
                type: 'text',
                name: 'appId',
                message: 'Application ID',
                validate: (s: string) => (s.length ? true : 'Must enter Application ID from Teller.')
            }
        ])

        updateConfig(config => {
            const tellerConfig = (config.integrations[IntegrationId.Teller] as TellerConfig) || defaultTellerConfig

            tellerConfig.name = credentials.name
            tellerConfig.pathCertificate = credentials.pathCertificate
            tellerConfig.pathPrivateKey = credentials.pathPrivateKey
            tellerConfig.appId = credentials.appId

            config.integrations[IntegrationId.Teller] = tellerConfig

            return config
        })

        logInfo('Successfully set up Teller Integration.')
        return true
    } catch (e) {
        logError('Unable to set up Teller Integration.', e)
        return false
    }
}
