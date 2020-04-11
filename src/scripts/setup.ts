import * as _ from 'lodash'
import { fork } from 'child_process'
import { resolve } from 'path'
import prompts from 'prompts'
import { getConfigSchema, updateConfig } from '../lib/config'
import { logInfo } from '../lib/logging'

// Declare async block after imports complete
import { TransactionConfig } from '../types/transaction'
;(async () => {
    // Discover Integrations from type definitions
    const configSchema = getConfigSchema()
    const integrations = configSchema.definitions.IntegrationId.valueOf()['enum']
    let selected
    // selected = await prompts([
    //     {
    //         type: 'multiselect',
    //         name: 'integrations',
    //         message: 'Select which integrations you want to set up',
    //         choices: _.map(integrations, integration => ({
    //             title: integration,
    //             value: integration
    //         }))
    //     }
    // ])

    // _.forEach(selected.integrations, integration => {
    //     const setupScript = resolve(__dirname, `../integrations/${integration}/setup.ts`)
    //     try {
    //         logInfo(`Entering setup for integration ${integration}.`)
    //         fork(`${setupScript}`)
    //         logInfo(`Setup for integration ${integration} complete.`)
    //     } catch (e) {
    //         logInfo(`Encountered error during setup for integration ${integration}.`, e)
    //     }
    // })

    const defaultTransactionConfig: TransactionConfig = {
        enabled: true,
        properties: [
            { id: 'name', automated: true },
            { id: 'date', automated: true },
            { id: 'amount', automated: true },
            { id: 'account', automated: true },
            { id: 'category', automated: true },
            { id: 'subcategory', automated: true },
            { id: 'location', automated: true },
            { id: 'pending', automated: true },
            { id: 'notes', automated: false },
            { id: 'work', automated: false },
            { id: 'joint', automated: false }
        ]
    }

    selected = await prompts([
        {
            type: 'multiselect',
            name: 'properties',
            message: 'Select which properties you want to include.',
            choices: _.map(defaultTransactionConfig.properties, property => ({
                title: property.id,
                value: property.id,
                selected: true
            }))
        }
    ])
    updateConfig(config => {
        const transactionConfig: TransactionConfig = {
            enabled: defaultTransactionConfig.enabled,
            properties: _.filter(defaultTransactionConfig.properties, property =>
                _.includes(selected.properties, property.id)
            )
        }
        config.transactions = transactionConfig
        return config
    })
})()
