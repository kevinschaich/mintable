const fs = require('fs')
const _ = require('lodash')

const CONFIG_FILE = __dirname + '/../../mintable.config.json'

const configProperties = [
  'PLAID_CLIENT_ID',
  'PLAID_SECRET',
  'PLAID_PUBLIC_KEY',
  'SHEETS_SHEET_ID',
  'SHEETS_CLIENT_ID',
  'SHEETS_CLIENT_SECRET',
  'SHEETS_REDIRECT_URI',
  'PLAID_TOKEN_CAPITAL_ONE',
  'PLAID_TOKEN_CHASE',
  'PLAID_TOKEN_AMEX',
  'PLAID_TOKEN_DISCOVER',
  'SHEETS_ACCESS_TOKEN',
  'SHEETS_REFRESH_TOKEN',
  'SHEETS_SCOPE',
  'SHEETS_TOKEN_TYPE',
  'SHEETS_EXPIRY_DATE',
  'CATEGORY_OVERRIDES',
  'TRANSACTION_PROVIDER',
  'SPREADSHEET_PROVIDER',
  'TRANSACTION_COLUMNS',
  'REFERENCE_COLUMNS'
]

const config = _.pick(process.env, configProperties)

try {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  console.log('Successfully wrote config.')
} catch (error) {
  console.log('Error: Could not write config file.' + JSON.stringify(error))
}
