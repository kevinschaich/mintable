const fs = require('promise-fs')
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

const getConfigEnv = async () => {
  // Fallback for CI
  if (process.env.MINTABLE_CONFIG) {
    let envConfig = process.env.MINTABLE_CONFIG

    // CI has inconsistent behavior and sometimes parses this as a object, other times as a string
    envConfig = typeof envConfig === 'string' ? JSON.parse(envConfig) : envConfig

    process.env = {
      ...process.env,
      ...envConfig
    }
    return envConfig
  } else {
    return await logPromise(fs.readFile(CONFIG_FILE), 'Reading config').then(config => {
      process.env = { ...process.env, ...JSON.parse(config) }
      return JSON.parse(config)
    })
  }
}

const writeConfig = async newConfig => {
  await logPromise(fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2)), 'Writing config')
  return await getConfigEnv()
}

const writeConfigProperty = async (propertyId, value) => {
  const newConfig = {
    ...getConfigEnv(),
    [propertyId]: value
  }

  await writeConfig(newConfig)
}

const deleteConfigProperty = async propertyId => {
  const newConfig = _.omit(await getConfigEnv(), [propertyId])

  await writeConfig(newConfig)
}

const maybeWriteDefaultConfig = async () => {
  const currentConfig = await getConfigEnv()

  if (!_.every(_.keys(DEFAULT_CONFIG), _.partial(_.has, currentConfig))) {
    await writeConfig({
      ...DEFAULT_CONFIG,
      ...(currentConfig || {})
    })
    console.log('Wrote default config.')
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
  writeConfigProperty,
  deleteConfigProperty,
  writeConfig,
  maybeWriteDefaultConfig,
  accountsSetupCompleted,
  sheetsSetupCompleted
}
