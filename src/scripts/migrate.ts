import { ConfigSource, readConfig, parseConfig, getConfigSource, writeConfig } from '../common/config'
import { argv } from 'yargs'
import { logInfo, logError, logWarn } from '../common/logging'
import * as os from 'os'
import { IntegrationId, IntegrationType } from '../types/integrations'
import { defaultGoogleConfig } from '../types/integrations/google'
import { AccountConfig } from '../types/account'

export const getOldConfig = (): ConfigSource => {
    if (argv['old-config-file']) {
        const path = argv['old-config-file'].replace(/^~(?=$|\/|\\)/, os.homedir())
        return { type: 'file', path: path }
    }
    logError('You need to specify the --old-config-file argument.')
}

export default () => {
    try {
        const oldConfigSource = getOldConfig()
        const oldConfigString = readConfig(oldConfigSource)
        let oldConfig = parseConfig(oldConfigString)

        const deprecatedProperties = ['HOST', 'PORT', 'CATEGORY_OVERRIDES', 'DEBUG', 'CREATE_BALANCES_SHEET', 'DEBUG']

        deprecatedProperties.forEach(prop => {
            if (oldConfig.hasOwnProperty(prop)) {
                logWarn(`Config property '${prop}' is deprecated and will not be migrated.`)
                if (prop === 'DEBUG') {
                    logInfo(`You can now use the --debug argument to log request output.`)
                }
            }
        })

        // Update to new Account syntax
        const balanceColumns: string[] = oldConfig['BALANCE_COLUMNS'].map(col => {
            switch (col) {
                case 'name':
                    return 'institution'
                case 'official_name':
                    return 'account'
                case 'balances.available':
                    return 'available'
                case 'balances.current':
                    return 'current'
                case 'balances.limit':
                    return 'limit'
                default:
                    return col
            }
        })

        // Update to new Transaction syntax
        const transactionColumns: string[] = oldConfig['TRANSACTION_COLUMNS'].map(col => {
            switch (col) {
                case 'category.0':
                case 'category.1':
                    return 'category'
                default:
                    return col
            }
        })

        const accounts: { [id: string]: AccountConfig } = {}
        Object.keys(oldConfig).map(key => {
            if (key.includes('PLAID_TOKEN')) {
                const account: AccountConfig = {
                    id: key.replace('PLAID_TOKEN_', ''),
                    integration: IntegrationId.Plaid,
                    token: oldConfig[key]
                }
                accounts[account.id] = account
            }
        })

        const newConfigSource = getConfigSource()
        writeConfig(newConfigSource, {
            integrations: {
                google: {
                    id: IntegrationId.Google,
                    type: IntegrationType.Export,

                    name: 'Google Sheets',

                    credentials: {
                        clientId: oldConfig['SHEETS_CLIENT_ID'],
                        clientSecret: oldConfig['SHEETS_CLIENT_SECRET'],
                        redirectUri: defaultGoogleConfig.credentials.redirectUri,
                        accessToken: oldConfig['SHEETS_ACCESS_TOKEN'],
                        refreshToken: oldConfig['SHEETS_REFRESH_TOKEN'],
                        scope: defaultGoogleConfig.credentials.scope,
                        tokenType: oldConfig['SHEETS_TOKEN_TYPE'],
                        expiryDate: parseInt(oldConfig['SHEETS_EXPIRY_DATE'])
                    },
                    documentId: oldConfig['SHEETS_SHEET_ID'],

                    template: {
                        documentId: oldConfig['TEMPLATE_SHEET']['SHEET_ID'],
                        sheetTitle: oldConfig['TEMPLATE_SHEET']['SHEET_TITLE']
                    }
                },
                plaid: {
                    id: IntegrationId.Plaid,
                    type: IntegrationType.Import,

                    name: 'Plaid',

                    environment: oldConfig['PLAID_ENVIRONMENT'],
                    credentials: {
                        clientId: oldConfig['PLAID_CLIENT_ID'],
                        secret: oldConfig['PLAID_SECRET']
                    }
                }
            },
            accounts: accounts,
            transactions: {
                integration: IntegrationId.Google,
                properties: transactionColumns.concat(oldConfig['REFERENCE_COLUMNS'])
            },
            balances: {
                integration: IntegrationId.Google,
                properties: balanceColumns
            }
        })
    } catch (e) {
        logError('Error migrating configuration.', e)
    }
}
