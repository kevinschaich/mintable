import { fork } from 'child_process'
import { resolve } from 'path'
import prompts from 'prompts'
import { getConfigSchema, updateConfig } from '../lib/config'
import { logInfo } from '../lib/logging'

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)

// Declare async block after imports complete
import { TransactionConfig } from '../types/transaction'
;(async () => {
    // Discover Integrations from type definitions
    const configSchema = getConfigSchema()
    const integrations = configSchema.definitions.IntegrationId.valueOf()['enum']
    let selected
    selected = await prompts([
        {
            type: 'multiselect',
            name: 'integrations',
            message: 'Select which integrations you want to set up',
            choices: integrations.map(integration => ({
                title: integration,
                value: integration
            }))
        }
    ])

    selected.integrations.forEach(integration => {
        const setupScript = resolve(__dirname, `../integrations/${integration}/setup.ts`)
        try {
            logInfo(`Entering setup for integration ${integration}.`)
            fork(`${setupScript}`)
            logInfo(`Setup for integration ${integration} complete.`)
        } catch (e) {
            logInfo(`Encountered error during setup for integration ${integration}.`, e)
        }
    })

    const defaultTransactionConfig: TransactionConfig = {
        properties: ['name', 'date', 'amount', 'account', 'category', 'location', 'pending', 'notes', 'work', 'joint']
    }

    selected = await prompts([
        {
            type: 'multiselect',
            name: 'properties',
            message: 'Select which properties you want to include in your transaction sheets.',
            choices: defaultTransactionConfig.properties.map(property => ({
                title: capitalize(property),
                value: property,
                selected: true
            }))
        }
    ])
    updateConfig(config => {
        const transactionConfig: TransactionConfig = {
            properties: defaultTransactionConfig.properties.filter(property => selected.properties.includes(property))
        }
        config.transactions = transactionConfig
        return config
    })
})()
