import { defaultCSVExportConfig, CSVExportConfig } from '../../types/integrations/csv-export'
import prompts from 'prompts'
import { IntegrationId } from '../../types/integrations'
import { updateConfig } from '../../common/config'
import { logInfo, logError } from '../../common/logging'

export default async () => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(
                '\nThis script will walk you through setting up the CSV Export integration. Follow these steps:'
            )
            console.log('\n\t1. Choose a consistent path on your computer for exported CSV file(s).')
            console.log('\t2. Copy the absolute path of this file(s).')
            console.log('\t3. Answer the following questions:\n')

            const responses = await prompts([
                {
                    type: 'text',
                    name: 'name',
                    message: 'What would you like to call this integration?',
                    initial: 'CSV Export',
                    validate: (s: string) =>
                        1 < s.length && s.length <= 64 ? true : 'Must be between 2 and 64 characters in length.'
                },
                {
                    type: 'text',
                    name: 'transactionPath',
                    message: `Where would you like to save exported transactions?`,
                    initial: '/path/to/my/transactions.csv',
                    validate: (s: string) =>
                        s.substring(0, 1) === '/' && s.substring(s.length - 4) === '.csv'
                            ? true
                            : 'Must start with `/` and end with `.csv`.'
                },
                {
                    type: 'text',
                    name: 'balancePath',
                    message: `Where would you like to save exported account balances?`,
                    initial: '/path/to/my/account-balances.csv',
                    validate: (s: string) =>
                        s.substring(0, 1) === '/' && s.substring(s.length - 4) === '.csv'
                            ? true
                            : 'Must start with `/` and end with `.csv`.'
                }
            ])

            updateConfig(config => {
                let CSVExportConfig =
                    (config.integrations[IntegrationId.CSVExport] as CSVExportConfig) || defaultCSVExportConfig

                CSVExportConfig.name = responses.name
                CSVExportConfig.transactionPath = responses.transactionPath
                CSVExportConfig.balancePath = responses.balancePath

                config.balances.integration = IntegrationId.CSVExport
                config.transactions.integration = IntegrationId.CSVExport

                config.integrations[IntegrationId.CSVExport] = CSVExportConfig

                return config
            })

            logInfo('Successfully set up CSV Export Integration.')
            return resolve()
        } catch (e) {
            logError('Unable to set up CSV Export Integration.', e)
            return reject()
        }
    })
}
