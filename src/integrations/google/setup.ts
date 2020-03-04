import { GoogleConfig } from '../../types/integrations/google'
const _ = require('lodash')
import { updateConfig, getConfig } from '../../lib/config'
const prompts = require('prompts')
import { IntegrationId } from '../../types/integrations'
import * as open from 'open'
import { initialize, getAuthURL, getToken } from './lib'
;(async () => {
  console.log('\nThis script will walk you through setting up the Google Sheets integration. Follow these steps:')
  console.log('\n\t1. Visit https://developers.google.com/sheets/api/quickstart/nodejs')
  console.log("\t2. Click 'Enable the Google Sheets API'")
  console.log('\t3. Create a new Google Sheet')
  console.log('\t4. Answer the following questions:\n')

  const credentials = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'What would you like to call this integration?',
      initial: 'Google Sheets',
      validate: (s: string) =>
        0 < s.length && s.length <= 64 ? true : 'Must be between 0 and 64 characters in length.'
    },
    {
      type: 'password',
      name: 'clientId',
      message: 'Client ID',
      validate: (s: string) => (s.length >= 8 ? true : 'Must be at least 8 characters in length.')
    },
    {
      type: 'password',
      name: 'clientSecret',
      message: 'Client Secret',
      validate: (s: string) => (s.length >= 8 ? true : 'Must be at least 8 characters in length.')
    },
    {
      type: 'text',
      name: 'documentId',
      message: 'Document ID (From the sheet you just created: https://docs.google.com/spreadsheets/d/DOCUMENT_ID/edit)',
      validate: (s: string) => (s.length >= 8 ? true : 'Must be at least 8 characters in length.')
    }
  ])

  updateConfig(config => {
    let googleConfig = config.integrations[IntegrationId.Google] as GoogleConfig

    config.integrations[IntegrationId.Google] = {
      ...googleConfig,
      name: credentials.name,
      documentId: credentials.documentId,

      credentials: {
        ...googleConfig.credentials,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret
      }
    }

    return config
  })

  initialize(getConfig())
  open(getAuthURL())

  console.log('\n\t5. A link will open in your browser asking you to sign in')
  console.log('\t6. Sign in with the account you want to use with Mintable')
  console.log("\t7. If you see a page saying 'This app isn't verified', click 'Advanced' and then 'Go to app (unsafe)'")
  console.log("\t8. Click 'Allow' on both of the next two screens")
  console.log('\t9. Copy & paste the code from your browser below:\n')

  const authentication = await prompts([
    {
      type: 'password',
      name: 'code',
      message: 'Enter the code from your browser here',
      validate: (s: string) => (s.length >= 8 ? true : 'Must be at least 8 characters in length.')
    }
  ])
  const response = await getToken(authentication.code)

  updateConfig(config => {
    let googleConfig = config.integrations[IntegrationId.Google] as GoogleConfig

    config.integrations[IntegrationId.Google] = {
      ...googleConfig,
      credentials: {
        ...googleConfig.credentials,
        accessToken: response.tokens.access_token,
        refreshToken: response.tokens.refresh_token,
        tokenType: response.tokens.token_type,
        expiryDate: response.tokens.expiry_date
      }
    }
    console.log('newconfig', config)
    return config
  })
})()
