import { PlaidEnvironmentType, PlaidConfig, defaultPlaidConfig } from '../../types/integrations/plaid'
import _ from 'lodash'
import { updateConfig, getConfig } from '../../lib/config'
import { IntegrationId } from '../../types/integrations'
import prompts from 'prompts'
import { logInfo, logError } from '../../lib/logging'
import open from 'open'
import { resolve } from 'path'

// Declare async block after imports complete
import { PlaidIntegration } from './plaidIntegration'
;(async () => {
    try {
        // console.log('\nThis script will walk you through setting up the Plaid integration. Follow these steps:')
        // console.log('\n\t1. Visit https://plaid.com')
        // console.log("\t2. Click 'Get API Keys'")
        // console.log('\t3. Fill out the form and wait a few days')
        // console.log('\t4. Once approved, visit https://dashboard.plaid.com/team/keys')
        // console.log('\t5. Answer the following questions:\n')

        // // @types/prompts needs updated to support choice descriptions
        // interface ChoiceWithDescription extends prompts.Choice {
        //     description: string
        // }

        // const credentials = await prompts([
        //     {
        //         type: 'text',
        //         name: 'name',
        //         message: 'What would you like to call this integration?',
        //         initial: 'Plaid',
        //         validate: (s: string) =>
        //             0 < s.length && s.length <= 64 ? true : 'Must be between 0 and 64 characters in length.'
        //     },
        //     {
        //         type: 'select',
        //         name: 'environment',
        //         message: 'Which Plaid environment would you like to use?',
        //         choices: [
        //             {
        //                 title: 'Sandbox',
        //                 description: 'Test credentials for development purposes (unlimited)',
        //                 value: PlaidEnvironmentType.Sandbox
        //             },
        //             {
        //                 title: 'Development',
        //                 description: 'Real credentials to financial institutions (limited to 100 Items)',
        //                 value: PlaidEnvironmentType.Development
        //             }
        //         ] as ChoiceWithDescription[],
        //         initial: 0
        //     },
        //     {
        //         type: 'password',
        //         name: 'clientId',
        //         message: 'Client ID',
        //         validate: (s: string) => (s.length === 24 ? true : 'Must be 24 characters in length.')
        //     },
        //     {
        //         type: 'password',
        //         name: 'secret',
        //         message: "Secret (pick the one corresponding to your 'Environment' choice above)",
        //         validate: (s: string) => (s.length === 30 ? true : 'Must be 30 characters in length.')
        //     },
        //     {
        //         type: 'password',
        //         name: 'publicKey',
        //         message: 'Public Key',
        //         validate: (s: string) => (s.length === 30 ? true : 'Must be 30 characters in length.')
        //     }
        // ])

        // updateConfig(config => {
        //     let plaidConfig = (config.integrations[IntegrationId.Plaid] as PlaidConfig) || defaultPlaidConfig

        //     plaidConfig.name = credentials.name
        //     plaidConfig.environment = credentials.environment
        //     plaidConfig.credentials.clientId = credentials.clientId
        //     plaidConfig.credentials.secret = credentials.secret
        //     plaidConfig.credentials.publicKey = credentials.publicKey

        //     config.integrations[IntegrationId.Plaid] = plaidConfig

        //     return config
        // })

        
        let numAccounts = 0
        let continueAccountSetup = true
        
        const config = getConfig()
        // TODO: REMOVE
        const credentials = (config.integrations[IntegrationId.Plaid] as PlaidConfig)

        const plaid = new PlaidIntegration(config)

        while (continueAccountSetup) {
            const response = await prompts([
                {
                    type: 'toggle',
                    name: 'continue',
                    message: `Would you like to setup ${numAccounts > 0 ? 'additional' : 'any'} accounts for Plaid?`,
                    initial: true,
                    active: 'yes',
                    inactive: 'no'
                }
            ])

            continueAccountSetup = response.continue

            if (continueAccountSetup) {
                logInfo('Account setup in progress.')
                open(
                    `http://localhost:8000?name=${credentials.name}&environment=${credentials.environment}&publicKey=${credentials.credentials.publicKey}`
                )
                const blah = await plaid.addAccount()
                const message = blah.message
                logInfo('success?', message)
                // blah.server.close()
                
                numAccounts += 1
            }
        }

        logInfo('Successfully set up Plaid Integration.')
    } catch (e) {
        logError('Unable to set up Plaid Integration.', e)
    }
})()
