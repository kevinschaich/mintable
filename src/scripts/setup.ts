import * as _ from 'lodash'
import { fork } from 'child_process'
import { resolve } from 'path'
import prompts from 'prompts'
import { getConfigSchema } from '../lib/config'
import { logInfo } from '../lib/logging'

// Declare async block after imports complete
;(async () => {
    // Discover Integrations from type definitions
    const configSchema = getConfigSchema()
    const integrations = configSchema.definitions.IntegrationId.valueOf()['enum']

    const selected = await prompts([
        {
            type: 'multiselect',
            name: 'integrations',
            message: 'Select which integrations you want to set up',
            choices: _.map(integrations, integration => ({
                title: integration,
                value: integration
            }))
        }
    ])

    _.forEach(selected.integrations, integration => {
        const setupScript = resolve(__dirname, `../integrations/${integration}/setup.ts`)
        try {
            logInfo(`Entering setup for integration ${integration}.`)
            fork(`${setupScript}`)
            logInfo(`Setup for integration ${integration} complete.`)
        } catch (e) {
            logInfo(`Encountered error during setup for integration ${integration}.`, e)
        }
    })
})()
