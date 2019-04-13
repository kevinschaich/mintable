const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const { wrapPromise } = require('./logging')

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

const getConfigEnv = async options =>
  wrapPromise(
    new Promise((resolve, reject) => {
      let config = process.env.MINTABLE_CONFIG || fs.readFileSync(CONFIG_FILE, 'utf8')

      if (typeof config === 'string') {
        config = JSON.parse(config)
      }

      process.env = { ...process.env, ...config }
      resolve(config)
    }),
    'Fetching current config',
    options
  )

const writeConfig = async newConfig =>
  wrapPromise(
    new Promise(async (resolve, reject) => {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2))
      await getConfigEnv()
      resolve()
    }),
    'Writing config'
  )

const updateConfig = async updates => {
  const currentConfig = await getConfigEnv()
  const newConfig = { ...currentConfig, ...updates }
  return wrapPromise(writeConfig(newConfig), `Updating config properties ${_.join(_.keys(updates), ', ')}`)
}

const deleteConfigProperty = async propertyId => {
  const newConfig = _.omit(await getConfigEnv(), [propertyId])
  return wrapPromise(writeConfig(newConfig), `Deleting config property ${propertyId}`)
}

const maybeWriteDefaultConfig = async () => {
  return wrapPromise(
    getConfigEnv({ quiet: true })
      .then(currentConfig => writeConfig({ ...DEFAULT_CONFIG, ...currentConfig }))
      .catch(writeConfig({ ...DEFAULT_CONFIG })),
    'Writing default config'
  )
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
