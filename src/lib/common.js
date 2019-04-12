const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const { logPromise } = require('./logging')

const CONFIG_FILE = path.join(__dirname, '../..', process.argv[2] || 'mintable.config.json')

console.log(`\nUsing config ${CONFIG_FILE}...\n`)

const DEFAULT_CONFIG = {
  TRANSACTION_COLUMNS: [
    'date',
    'amount',
    'name',
    'account_details.official_name',
    'category.0',
    'category.1',
    'pending'
  ],
  REFERENCE_COLUMNS: ['notes', 'work', 'joint'],
  SHEET_PROVIDER: 'sheets',
  ACCOUNT_PROVIDER: 'plaid',
  CATEGORY_OVERRIDES: [],
  SHEETS_REDIRECT_URI: 'http://localhost:3000/google-sheets-oauth2callback',
  PLAID_ENVIRONMENT: 'development'
}

const getConfigEnv = () =>
  new Promise((resolve, reject) => {
    // Fallback for CI
    let config = process.env.MINTABLE_CONFIG || fs.readFileSync(CONFIG_FILE, 'utf8')

    // CI has inconsistent behavior and sometimes parses this as a object, other times as a string
    config = typeof config === 'string' ? JSON.parse(config) : config

    process.env = { ...process.env, ...config }
    resolve(config)
  })

const writeConfig = async newConfig =>
  new Promise(async (resolve, reject) => {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2))
    const config = await logPromise(getConfigEnv(), 'Updating cached config after writing')
    resolve(config)
  })

const updateConfig = async updates => {
  const currentConfig = await logPromise(getConfigEnv(), `Getting current config to update`)
  const newConfig = await {
    ...currentConfig,
    ...updates
  }

  await logPromise(writeConfig(newConfig), `Writing updated config`)
}

const deleteConfigProperty = async propertyId => {
  const newConfig = _.omit(
    await logPromise(getConfigEnv(), `Getting current config to delete property ${propertyId}`),
    [propertyId]
  )

  await logPromise(writeConfig(newConfig), `Writing updated config without property ${propertyId}`)
}

const maybeWriteDefaultConfig = async () => {
  const currentConfig = (await logPromise(getConfigEnv(), 'Validating current config', { quiet: true })) || {}
  if (!_.every(_.keys(DEFAULT_CONFIG), _.partial(_.has, currentConfig))) {
    await logPromise(writeConfig({ ...DEFAULT_CONFIG, ...(currentConfig || {}) }), 'Updating config defaults')
  }
}

const checkEnv = propertyIds => {
  const values = _.values(_.pick(process.env, propertyIds))
  return values.length === propertyIds.length && _.every(values, v => v.length)
}

const accountsSetupCompleted = () => {
  if (!process.env) {
    return false
  }

  switch (process.env.ACCOUNT_PROVIDER) {
    case 'plaid':
      return checkEnv(['PLAID_CLIENT_ID', 'PLAID_PUBLIC_KEY', 'PLAID_SECRET'])
    default:
      return false
  }
}

const sheetsSetupCompleted = () => {
  if (!process.env) {
    return false
  }

  switch (process.env.SHEET_PROVIDER) {
    case 'sheets':
      return checkEnv([
        'SHEETS_SHEET_ID',
        'SHEETS_CLIENT_ID',
        'SHEETS_CLIENT_SECRET',
        'SHEETS_REDIRECT_URI',
        'SHEETS_ACCESS_TOKEN'
      ])
    default:
      return false
  }
}

module.exports = {
  getConfigEnv,
  updateConfig,
  deleteConfigProperty,
  writeConfig,
  maybeWriteDefaultConfig,
  accountsSetupCompleted,
  sheetsSetupCompleted
}
