import { fork } from 'child_process'
import { resolve } from 'path'
import prompts from 'prompts'
import { getConfigSchema, updateConfig } from '../lib/config'
import { logInfo } from '../lib/logging'
import { TransactionConfig } from '../types/transaction'
import { BalanceConfig } from '../types/balance'

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)

    // Declare async block after imports complete
;(async () => {
    console.log('\nWelcome to Mintable!')
    console.log('\nThis script will walk you through three setup stages:')
    console.log('\n\t1. Set up an EXPORT integration to fetch up-to-date data from your financial institutions')
    console.log('\t2. Select which data you care about')
    console.log('\t3. Set up an EXPORT integration to put your data into a spreadsheet for analysis')

    const defaultTransactionProperties = [
        'name',
        'date',
        'amount',
        'account',
        'category',
        'location',
        'pending',
        'notes',
        'work',
        'shared'
    ]
    const defaultBalanceProperties = [
        'mask',
        'institution',
        'account',
        'type',
        'current',
        'available',
        'limit',
        'currency'
    ]

    // Discover Integrations from type definitions
    const configSchema = getConfigSchema()
    const integrations = configSchema.definitions.IntegrationId.valueOf()['enum']

    const selected = await prompts([
        {
            type: 'multiselect',
            name: 'importers',
            message: 'Select which integration(s) you want to use to IMPORT accounts and transactions.',
            choices: integrations.map(integration => ({
                title: integration,
                value: integration
            }))
        },
        {
            type: 'multiselect',
            name: 'transactionProperties',
            message: 'Select which properties you want to include in your transaction spreadsheets.',
            choices: defaultTransactionProperties.map(property => ({
                title: capitalize(property),
                value: property,
                selected: true
            }))
        },
        {
            type: 'multiselect',
            name: 'balanceProperties',
            message: 'Select which properties you want to include in your balance spreadsheets.',
            choices: defaultBalanceProperties.map(property => ({
                title: capitalize(property),
                value: property,
                selected: true
            }))
        },
        {
            type: 'select',
            name: 'exporter',
            message: 'Select which integration you want use to EXPORT balances and transactions.',
            choices: integrations.map(integration => ({
                title: integration,
                value: integration
            }))
        }
    ])

    updateConfig(config => {
        const transactionConfig: TransactionConfig = {
            properties: defaultTransactionProperties.filter(property =>
                selected.transactionProperties.includes(property)
            ),
            integration: selected.exporter
        }
        const balanceConfig: BalanceConfig = {
            properties: defaultBalanceProperties.filter(property => selected.balanceProperties.includes(property)),
            integration: selected.exporter
        }
        config.transactions = transactionConfig
        config.balances = balanceConfig
        return config
    })

    selected.importers.push(selected.exporter).forEach(integration => {
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
