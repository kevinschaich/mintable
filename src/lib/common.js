const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const { wrapPromise } = require('./logging')

const CONFIG_FILE = path.join(__dirname, '../..', process.argv[2] || 'mintable.config.json')

console.log(`\nUsing config ${CONFIG_FILE}.`)
console.log(`Note: The messages displayed below are automated and may contain duplicates.\n`)

const DEFAULT_CONFIG = {
  HOST: 'localhost',
  PORT: 3000,

  TRANSACTION_COLUMNS: ['date', 'amount', 'name', 'account', 'category.0', 'category.1', 'pending'],
  REFERENCE_COLUMNS: ['notes', 'work', 'joint'],

  ACCOUNT_PROVIDER: 'plaid',
  PLAID_ENVIRONMENT: 'development',
  CATEGORY_OVERRIDES: [],

  SHEET_PROVIDER: 'sheets',
  SHEETS_REDIRECT_URI: `http://localhost:3000/google-sheets-oauth2callback`,
  TEMPLATE_SHEET: {
    SHEET_ID: '10fYhPJzABd8KlgAzxtiyFN-L_SebTvM8SaAK_wHk-Fw',
    SHEET_TITLE: 'Template'
  }
}

const checkEnv = propertyIds => {
  const values = _.values(_.pick(process.env, propertyIds))
  return values.length === propertyIds.length && _.every(values, v => v.length)
}

const getAccountTokens = () => {
  if (!process.env) {
    return []
  }

  switch (process.env.ACCOUNT_PROVIDER) {
    case 'plaid':
      return Object.keys(process.env)
        .filter(key => key.startsWith(`PLAID_TOKEN`))
        .map(key => ({
          nickname: key.replace(/^PLAID_TOKEN_/, ''),
          token: process.env[key]
        }))
    default:
      return []
  }
}

const accountSetupComplete = () => getAccountTokens().length > 0

const accountProviderSetupComplete = () => {
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

const sheetProviderSetupComplete = () => {
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
      resolve(getConfigEnv())
    }),
    'Writing config'
  )

const updateConfig = async updates => {
  const currentConfig = await getConfigEnv()
  const newConfig = { ...currentConfig, ...updates }
  return wrapPromise(writeConfig(newConfig), `Updating config properties ${_.join(_.keys(updates), ', ')}`)
}

const deleteConfigProperty = async propertyId => {
  delete process.env[propertyId]
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
  getAccountTokens,
  accountSetupComplete,
  accountProviderSetupComplete,
  sheetProviderSetupComplete
}
