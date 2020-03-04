import { defaultGoogleConfig } from '../../types/integrations/google'
const _ = require('lodash')
import { updateConfig } from '../../lib/config'
import { PromptObject } from 'prompts'
const prompts = require('prompts')

let googleConfig = defaultGoogleConfig

const questions: Array<PromptObject<any>> = [
  {
    type: 'text',
    name: 'name',
    message: 'What would you like to call this integration?',
    initial: 'Google Sheets',
    validate: (s: string) => (0 < s.length && s.length <= 64 ? true : 'Must be between 0 and 64 characters in length.')
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
  },
]
;(async () => {
  console.log('\nThis script will walk you through setting up the Google Sheets integration. Follow these steps:')
  console.log('\n\t1. Visit https://developers.google.com/sheets/api/quickstart/nodejs')
  console.log("\t2. Click 'Enable the Google Sheets API'")
  console.log("\t3. Create a new Google Sheet")
  console.log('\t4. Answer the following questions:\n')

  const response = await prompts(questions)

  googleConfig = {
    ...googleConfig,
    name: response.name,

    credentials: {
      clientId: response.clientId,
      clientSecret: response.clientSecret
    },
    documentId: response.documentId
  }


  updateConfig(config => {
    config.integrations.push(googleConfig)
    return config
  })
})()
