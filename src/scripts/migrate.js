const _ = require('lodash')
const { writeConfig, maybeWriteDefaultConfig } = require('../lib/common')
require('dotenv').config()

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

let config = _.pick(process.env, configProperties)

config = {
  ...config,
  ACCOUNT_PROVIDER: config.TRANSACTION_PROVIDER,
  SHEET_PROVIDER: config.SPREADSHEET_PROVIDER
}

writeConfig(config)
maybeWriteDefaultConfig()
