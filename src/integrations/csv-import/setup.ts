import { defaultCSVImportConfig, CSVImportConfig } from '../../types/integrations/csv-import'
import prompts from 'prompts'
import { IntegrationId } from '../../types/integrations'
import { updateConfig } from '../../common/config'
import { logInfo, logError } from '../../common/logging'
import { CSVAccountConfig } from '../../types/account'

export default async () => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(
                '\nThis script will walk you through setting up the CSV Import integration. Follow these steps:'
            )
            console.log('\n\t1. Choose a consistent folder on your computer to hold CSV files you want to import.')
            console.log('\t2. Copy the absolute path of this folder (globs for multiple files are also supported).')
            console.log('\t3. Answer the following questions:\n')

            const responses = await prompts([
                {
                    type: 'text',
                    name: 'name',
                    message: 'What would you like to call this integration?',
                    initial: 'CSV Import',
                    validate: (s: string) =>
                        1 < s.length && s.length <= 64 ? true : 'Must be between 2 and 64 characters in length.'
                },
                {
                    type: 'text',
                    name: 'account',
                    message: 'What would you like to call this account?',
                    initial: 'My CSV Account',
                    validate: (s: string) =>
                        1 < s.length && s.length <= 64 ? true : 'Must be between 2 and 64 characters in length.'
                },
                {
                    type: 'text',
                    name: 'path',
                    message: "What is the path/globs to the CSV file(s) you'd like to import?",
                    initial: '/path/to/my/csv/files/*.csv',
                    validate: (s: string) => (s.substring(0, 1) === '/' ? true : 'Must start with `/`.')
                },
                {
                    type: 'text',
                    name: 'dateFormat',
                    message: 'What is the format of the date column in these files?',
                    initial: 'yyyyMMdd',
                    validate: (s: string) =>
                        1 < s.length && s.length <= 64 ? true : 'Must be between 1 and 64 characters in length.'
                }
            ])

            const defaultCSVAccountConfig: CSVAccountConfig = {
                paths: [responses.path],
                transformer: {
                    name: 'name',
                    date: 'date',
                    amount: 'amount'
                },
                dateFormat: responses.dateFormat,
                id: responses.account,
                integration: IntegrationId.CSVImport
            }

            updateConfig(config => {
                let CSVImportConfig =
                    (config.integrations[IntegrationId.CSVImport] as CSVImportConfig) || defaultCSVImportConfig

                CSVImportConfig.name = responses.name

                config.integrations[IntegrationId.CSVImport] = CSVImportConfig
                config.accounts[responses.account] = defaultCSVAccountConfig

                return config
            })

            console.log(
                `\n\t4. Edit the 'transformer' field of the new account added to your ~/mintable.jsonc config file to map the input columns of your CSV file to a supported Transaction column in Mintable.\n`
            )

            logInfo('Successfully set up CSV Import Integration.')
            return resolve()
        } catch (e) {
            logError('Unable to set up CSV Import Integration.', e)
            return reject()
        }
    })
}
